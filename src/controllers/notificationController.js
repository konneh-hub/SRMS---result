const notificationService = require('../services/notificationService');
const { AppError } = require('../utils/helpers');

class NotificationController {
    /**
     * Get user notifications
     */
    async getNotifications(req, res, next) {
        try {
            const { userId } = req.user;
            const { universityId } = req.user;
            const { page = 1, limit = 20, isRead, eventType } = req.query;

            const options = {
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                isRead: isRead ? isRead === 'true' : null,
                eventType
            };

            const notifications = await notificationService.getUserNotifications(userId, universityId, options);

            res.json({
                success: true,
                data: notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get unread count
     */
    async getUnreadCount(req, res, next) {
        try {
            const { userId } = req.user;
            const { universityId } = req.user;

            const count = await notificationService.getUnreadCount(userId, universityId);

            res.json({
                success: true,
                data: { unreadCount: count }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(req, res, next) {
        try {
            const { notificationId } = req.params;
            const { userId, universityId } = req.user;

            const notification = await notificationService.markAsRead(notificationId, userId, universityId);

            res.json({
                success: true,
                data: notification
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark all as read
     */
    async markAllAsRead(req, res, next) {
        try {
            const { userId, universityId } = req.user;

            const notifications = await notificationService.markAllAsRead(userId, universityId);

            res.json({
                success: true,
                message: 'All notifications marked as read',
                data: { count: notifications.length }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(req, res, next) {
        try {
            const { notificationId } = req.params;
            const { userId, universityId } = req.user;

            await notificationService.deleteNotification(notificationId, userId, universityId);

            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get notification preferences
     */
    async getPreferences(req, res, next) {
        try {
            const { userId } = req.user;
            const { universityId } = req.user;

            const preferences = await notificationService.getUserPreferences(userId, universityId);

            res.json({
                success: true,
                data: preferences
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(req, res, next) {
        try {
            const { userId, universityId } = req.user;
            const { eventType, emailEnabled, smsEnabled, pushEnabled, inAppEnabled, frequency } = req.body;

            if (!eventType) {
                throw new AppError('eventType is required', 400);
            }

            const preference = await notificationService.updatePreference(
                userId,
                universityId,
                eventType,
                {
                    emailEnabled,
                    smsEnabled,
                    pushEnabled,
                    inAppEnabled,
                    frequency
                }
            );

            res.json({
                success: true,
                data: preference
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Disable channel for event
     */
    async disableChannel(req, res, next) {
        try {
            const { userId, universityId } = req.user;
            const { eventType, channel } = req.body;

            const validChannels = ['email', 'sms', 'push', 'in_app'];
            if (!validChannels.includes(channel)) {
                throw new AppError(`Invalid channel. Must be one of: ${validChannels.join(', ')}`, 400);
            }

            const preference = await notificationService.disableChannel(userId, universityId, eventType, channel);

            res.json({
                success: true,
                data: preference
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Enable channel for event
     */
    async enableChannel(req, res, next) {
        try {
            const { userId, universityId } = req.user;
            const { eventType, channel } = req.body;

            const validChannels = ['email', 'sms', 'push', 'in_app'];
            if (!validChannels.includes(channel)) {
                throw new AppError(`Invalid channel. Must be one of: ${validChannels.join(', ')}`, 400);
            }

            const preference = await notificationService.enableChannel(userId, universityId, eventType, channel);

            res.json({
                success: true,
                data: preference
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get event logs (Admin only)
     */
    async getEventLogs(req, res, next) {
        try {
            const { universityId } = req.user;
            const { page = 1, limit = 50, eventType, entityType, entityId } = req.query;

            const options = {
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                eventType,
                entityType,
                entityId: entityId ? parseInt(entityId) : null
            };

            const logs = await notificationService.getEventLogs(universityId, options);

            res.json({
                success: true,
                data: logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get notification statistics (Admin only)
     */
    async getStats(req, res, next) {
        try {
            const { universityId } = req.user;
            const { days = 7 } = req.query;

            const stats = await notificationService.getNotificationStats(universityId, {
                days: parseInt(days)
            });

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Send bulk notification (Admin only)
     */
    async sendBulkNotification(req, res, next) {
        try {
            const { universityId, tenantId } = req.user;
            const { recipientUserIds, title, message, eventType } = req.body;

            if (!recipientUserIds || !Array.isArray(recipientUserIds)) {
                throw new AppError('recipientUserIds must be an array', 400);
            }

            if (!title || !message) {
                throw new AppError('title and message are required', 400);
            }

            const notificationEventEmitter = require('./notificationEventEmitter');
            notificationEventEmitter.sendBulk({
                recipientUserIds,
                title,
                message,
                universityId,
                tenantId,
                eventType: eventType || 'bulk_notification'
            });

            res.json({
                success: true,
                message: 'Bulk notification sent successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();