const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class NotificationQueueRepository extends BaseRepository {
    constructor() {
        super('notification_queue');
    }

    /**
     * Get pending notifications for processing
     */
    async getPendingNotifications(limit = 100) {
        const query = `
            SELECT nq.*, n.* FROM notification_queue nq
            JOIN notifications n ON nq.notification_id = n.id
            WHERE nq.status IN ('pending', 'failed')
            AND (nq.locked_until IS NULL OR nq.locked_until < NOW())
            AND (nq.next_retry_at IS NULL OR nq.next_retry_at <= NOW())
            ORDER BY nq.priority DESC, nq.scheduled_at ASC
            LIMIT $1
        `;
        const result = await db.query(query, [limit]);
        return result.rows;
    }

    /**
     * Lock notification for processing
     */
    async lockNotification(queueId, lockDurationSeconds = 300) {
        const query = `
            UPDATE notification_queue
            SET locked_until = NOW() + INTERVAL '${lockDurationSeconds} seconds'
            WHERE id = $1 AND (locked_until IS NULL OR locked_until < NOW())
            RETURNING *
        `;
        const result = await db.query(query, [queueId]);
        return result.rows[0];
    }

    /**
     * Mark as processing
     */
    async markProcessing(queueId) {
        const query = `
            UPDATE notification_queue
            SET status = 'processing', last_attempt_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [queueId]);
        return result.rows[0];
    }

    /**
     * Mark as completed
     */
    async markCompleted(queueId) {
        const query = `
            UPDATE notification_queue
            SET status = 'completed', locked_until = NULL
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [queueId]);
        return result.rows[0];
    }

    /**
     * Mark as failed with retry
     */
    async markFailed(queueId, reason, retryDelaySeconds = 300) {
        const query = `
            UPDATE notification_queue
            SET 
                status = CASE 
                    WHEN attempt_count >= 3 THEN 'abandoned'
                    ELSE 'failed'
                END,
                attempt_count = attempt_count + 1,
                failure_reason = $2,
                next_retry_at = NOW() + INTERVAL '${retryDelaySeconds} seconds',
                locked_until = NULL
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [queueId, reason]);
        return result.rows[0];
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(universityId = null) {
        let query = `
            SELECT 
                status,
                COUNT(*) as count
            FROM notification_queue
        `;
        const params = [];

        if (universityId) {
            query += ` WHERE tenant_id = (SELECT tenant_id FROM universities WHERE id = $1)`;
            params.push(universityId);
        }

        query += ` GROUP BY status`;

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Clean up old completed items
     */
    async cleanupCompleted(daysOld = 7) {
        const query = `
            DELETE FROM notification_queue
            WHERE status = 'completed'
            AND created_at < NOW() - INTERVAL '${daysOld} days'
            RETURNING id
        `;
        const result = await db.query(query);
        return result.rows;
    }
}

module.exports = new NotificationQueueRepository();