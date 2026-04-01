const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class NotificationRepository extends BaseRepository {
    constructor() {
        super('notifications');
    }

    /**
     * Get unread notifications for a user
     */
    async getUnreadNotifications(userId, universityId, options = {}) {
        const { limit = 20, offset = 0, eventType = null } = options;

        let query = `
            SELECT * FROM notifications
            WHERE user_id = $1 AND university_id = $2 AND is_read = false
        `;
        const params = [userId, universityId];
        let paramIndex = 3;

        if (eventType) {
            query += ` AND event_type = $${paramIndex}`;
            params.push(eventType);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Get all notifications for a user with pagination
     */
    async getUserNotifications(userId, universityId, options = {}) {
        const { limit = 20, offset = 0, isRead = null } = options;

        let query = `
            SELECT * FROM notifications
            WHERE user_id = $1 AND university_id = $2
        `;
        const params = [userId, universityId];
        let paramIndex = 3;

        if (isRead !== null) {
            query += ` AND is_read = $${paramIndex}`;
            params.push(isRead);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        const query = `
            UPDATE notifications
            SET is_read = true, read_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [notificationId]);
        return result.rows[0];
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId, universityId) {
        const query = `
            UPDATE notifications
            SET is_read = true, read_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND university_id = $2 AND is_read = false
            RETURNING *
        `;
        const result = await db.query(query, [userId, universityId]);
        return result.rows;
    }

    /**
     * Get unread count for user
     */
    async getUnreadCount(userId, universityId) {
        const query = `
            SELECT COUNT(*) as count FROM notifications
            WHERE user_id = $1 AND university_id = $2 AND is_read = false
        `;
        const result = await db.query(query, [userId, universityId]);
        return result.rows[0].count;
    }

    /**
     * Delete old notifications
     */
    async deleteOldNotifications(daysOld = 30) {
        const query = `
            DELETE FROM notifications
            WHERE created_at < NOW() - INTERVAL '${daysOld} days'
            AND is_read = true
            RETURNING id
        `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Get notifications by event type
     */
    async getNotificationsByEventType(eventType, universityId, options = {}) {
        const { limit = 100, offset = 0 } = options;

        const query = `
            SELECT * FROM notifications
            WHERE event_type = $1 AND university_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        `;
        const result = await db.query(query, [eventType, universityId, limit, offset]);
        return result.rows;
    }

    /**
     * Update notification status
     */
    async updateStatus(notificationId, status, errorMessage = null) {
        let query = `
            UPDATE notifications
            SET status = $1, updated_at = CURRENT_TIMESTAMP
        `;
        const params = [status, notificationId];
        let paramIndex = 3;

        if (errorMessage) {
            query += `, error_message = $${paramIndex}`;
            params.splice(1, 0, errorMessage);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
        params.push(notificationId);

        const result = await db.query(query, params);
        return result.rows[0];
    }

    /**
     * Increment send attempts
     */
    async incrementSendAttempts(notificationId) {
        const query = `
            UPDATE notifications
            SET send_attempts = send_attempts + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [notificationId]);
        return result.rows[0];
    }
}

module.exports = new NotificationRepository();