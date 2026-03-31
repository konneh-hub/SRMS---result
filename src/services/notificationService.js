const notificationRepository = require('../repositories/notificationRepository');
const { notificationPreferenceRepository, notificationTemplateRepository, eventLogRepository } = require('../repositories/notificationPreferenceRepository');
const notificationQueueRepository = require('../repositories/notificationQueueRepository');
const db = require('../config/database');
const { AppError } = require('../utils/helpers');

class NotificationService {
    /**
     * Trigger notification for an event
     * @param {Object} eventData - Event trigger data
     */
    async triggerNotification(eventData) {
        const {
            eventType,
            userId,
            universityId,
            title,
            message,
            data = {},
            recipientUserIds = null,
            triggedBy = null,
            tenantId
        } = eventData;

        try {
            // Log the event
            await this.logEvent({
                eventType,
                entityType: data.entityType,
                entityId: data.entityId,
                triggeredBy: triggedBy,
                universityId,
                description: `${eventType} - ${title}`,
                data,
                tenantId
            });

            // Determine who should receive this notification
            const recipients = recipientUserIds || (userId ? [userId] : []);

            if (recipients.length === 0) {
                return { success: true, message: 'No recipients for this notification', created: 0 };
            }

            // Create notifications for each recipient
            const createdNotifications = [];
            for (const recipientId of recipients) {
                try {
                    // Check user preferences
                    const preferences = await notificationPreferenceRepository.getUserPreference(
                        recipientId,
                        universityId,
                        eventType
                    );

                    // Skip if user has disabled all notifications for this event
                    if (preferences && !preferences.email_enabled && !preferences.sms_enabled &&
                        !preferences.push_enabled && !preferences.in_app_enabled) {
                        continue;
                    }

                    // Create notification
                    const notification = await notificationRepository.create({
                        user_id: recipientId,
                        university_id: universityId,
                        event_type: eventType,
                        title,
                        message,
                        data: JSON.stringify(data),
                        notification_type: 'in-app',
                        status: 'pending',
                        tenant_id: tenantId
                    });

                    // Add to queue for processing
                    await db.query(
                        `INSERT INTO notification_queue (notification_id, priority, tenant_id)
                         VALUES ($1, $2, $3)`,
                        [notification.id, 0, tenantId]
                    );

                    createdNotifications.push(notification);
                } catch (error) {
                    console.error(`Error creating notification for recipient ${recipientId}:`, error);
                }
            }

            return {
                success: true,
                created: createdNotifications.length,
                notifications: createdNotifications
            };
        } catch (error) {
            console.error('Error triggering notification:', error);
            throw error;
        }
    }

    /**
     * Log an event
     */
    async logEvent(eventData) {
        const {
            eventType,
            entityType,
            entityId,
            triggeredBy,
            universityId,
            description,
            data,
            tenantId
        } = eventData;

        return await db.query(
            `INSERT INTO event_logs (
                event_type, entity_type, entity_id, triggered_by,
                university_id, description, data, tenant_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                eventType,
                entityType,
                entityId,
                triggeredBy,
                universityId,
                description,
                JSON.stringify(data),
                tenantId
            ]
        );
    }

    /**
     * Get user notifications
     */
    async getUserNotifications(userId, universityId, options = {}) {
        return await notificationRepository.getUserNotifications(userId, universityId, options);
    }

    /**
     * Get unread count for user
     */
    async getUnreadCount(userId, universityId) {
        return await notificationRepository.getUnreadCount(userId, universityId);
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId, universityId) {
        // Verify notification belongs to user
        const notification = await notificationRepository.findById(notificationId);
        if (!notification || notification.user_id !== userId || notification.university_id !== universityId) {
            throw new AppError('Notification not found', 404);
        }

        return await notificationRepository.markAsRead(notificationId);
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId, universityId) {
        return await notificationRepository.markAllAsRead(userId, universityId);
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId, userId, universityId) {
        // Verify notification belongs to user
        const notification = await notificationRepository.findById(notificationId);
        if (!notification || notification.user_id !== userId || notification.university_id !== universityId) {
            throw new AppError('Notification not found', 404);
        }

        return await notificationRepository.delete(notificationId);
    }

    /**
     * Get notification preferences for user
     */
    async getUserPreferences(userId, universityId) {
        return await notificationPreferenceRepository.getUserPreferences(userId, universityId);
    }

    /**
     * Update notification preference
     */
    async updatePreference(userId, universityId, eventType, preferenceData) {
        return await notificationPreferenceRepository.upsertPreference({
            userId,
            universityId,
            eventType,
            ...preferenceData,
            tenantId: (await db.query('SELECT tenant_id FROM users WHERE id = $1', [userId])).rows[0].tenant_id
        });
    }

    /**
     * Disable notifications for specific channel
     */
    async disableChannel(userId, universityId, eventType, channel) {
        return await notificationPreferenceRepository.disableChannel(userId, universityId, eventType, channel);
    }

    /**
     * Enable notifications for specific channel
     */
    async enableChannel(userId, universityId, eventType, channel) {
        return await notificationPreferenceRepository.enableChannel(userId, universityId, eventType, channel);
    }

    /**
     * Get default notification preferences for new users
     */
    getDefaultPreferences() {
        return {
            emailEnabled: true,
            smsEnabled: false,
            pushEnabled: true,
            inAppEnabled: true,
            frequency: 'immediate',
            quietHoursEnabled: false
        };
    }

    /**
     * Initialize default preferences for new user
     */
    async initializeUserPreferences(userId, universityId, tenantId) {
        const eventTypes = [
            'result_published',
            'account_created',
            'approval_pending',
            'approval_approved',
            'approval_rejected',
            'enrollment_confirmed',
            'course_registered',
            'grade_updated',
            'deadline_approaching',
            'system_announcement'
        ];

        const defaultPrefs = this.getDefaultPreferences();

        for (const eventType of eventTypes) {
            try {
                await notificationPreferenceRepository.upsertPreference({
                    userId,
                    universityId,
                    eventType,
                    ...defaultPrefs,
                    tenantId
                });
            } catch (error) {
                console.error(`Error initializing preference for ${eventType}:`, error);
            }
        }
    }

    /**
     * Get notification template
     */
    async getTemplate(eventType, universityId = null) {
        return await notificationTemplateRepository.getByEventType(eventType, universityId);
    }

    /**
     * Update notification template
     */
    async updateTemplate(eventType, templateData, universityId, tenantId) {
        return await notificationTemplateRepository.upsertTemplate({
            eventType,
            ...templateData,
            universityId,
            tenantId
        });
    }

    /**
     * Get event logs
     */
    async getEventLogs(universityId, options = {}) {
        const { limit = 100, offset = 0, eventType = null, entityType = null, entityId = null } = options;

        let query = `SELECT * FROM event_logs WHERE university_id = $1`;
        const params = [universityId];
        let paramIndex = 2;

        if (eventType) {
            query += ` AND event_type = $${paramIndex}`;
            params.push(eventType);
            paramIndex++;
        }

        if (entityType) {
            query += ` AND entity_type = $${paramIndex}`;
            params.push(entityType);
            paramIndex++;
        }

        if (entityId) {
            query += ` AND entity_id = $${paramIndex}`;
            params.push(entityId);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Get notification statistics
     */
    async getNotificationStats(universityId, options = {}) {
        const { days = 7 } = options;

        const query = `
            SELECT 
                event_type,
                status,
                COUNT(*) as count,
                DATE(created_at) as date
            FROM notifications
            WHERE university_id = $1 
            AND created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY event_type, status, DATE(created_at)
            ORDER BY date DESC
        `;

        const result = await db.query(query, [universityId]);
        return result.rows;
    }

    /**
     * Clean up old notifications and logs
     */
    async cleanup(options = {}) {
        const { notificationDays = 30, logDays = 90 } = options;

        try {
            // Delete old notifications
            const deletedNotifications = await notificationRepository.deleteOldNotifications(notificationDays);

            // Delete old queue items
            const deletedQueue = await notificationQueueRepository.cleanupCompleted(logDays);

            return {
                success: true,
                deletedNotifications: deletedNotifications.length,
                deletedQueue: deletedQueue.length
            };
        } catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();