const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { notificationRateLimit } = require('../middleware/security');

// All routes require authentication and rate limiting
router.use(authenticate);
router.use(notificationRateLimit);

// Validation schemas
const updatePreferencesSchema = {
    body: {
        eventType: 'string|required',
        emailEnabled: 'boolean|optional',
        smsEnabled: 'boolean|optional',
        pushEnabled: 'boolean|optional',
        inAppEnabled: 'boolean|optional',
        frequency: 'string|optional'
    }
};

const disableChannelSchema = {
    body: {
        eventType: 'string|required',
        channel: 'string|required'
    }
};

const enableChannelSchema = {
    body: {
        eventType: 'string|required',
        channel: 'string|required'
    }
};

const sendBulkSchema = {
    body: {
        recipientUserIds: 'array|required',
        title: 'string|required',
        message: 'string|required',
        eventType: 'string|optional'
    }
};

/**
 * @route GET /api/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route POST /api/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.post('/:notificationId/read', notificationController.markAsRead);

/**
 * @route POST /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.post('/read-all', notificationController.markAllAsRead);

/**
 * @route DELETE /api/notifications/:notificationId
 * @desc Delete notification
 * @access Private
 */
router.delete('/:notificationId', notificationController.deleteNotification);

/**
 * @route GET /api/notifications/preferences
 * @desc Get notification preferences
 * @access Private
 */
router.get('/preferences', notificationController.getPreferences);

/**
 * @route PUT /api/notifications/preferences
 * @desc Update notification preferences
 * @access Private
 */
router.put(
    '/preferences',
    validateRequest(updatePreferencesSchema),
    notificationController.updatePreferences
);

/**
 * @route POST /api/notifications/preferences/disable-channel
 * @desc Disable notification channel for event
 * @access Private
 */
router.post(
    '/preferences/disable-channel',
    validateRequest(disableChannelSchema),
    notificationController.disableChannel
);

/**
 * @route POST /api/notifications/preferences/enable-channel
 * @desc Enable notification channel for event
 * @access Private
 */
router.post(
    '/preferences/enable-channel',
    validateRequest(enableChannelSchema),
    notificationController.enableChannel
);

/**
 * @route GET /api/notifications/events/logs
 * @desc Get event logs (Admin only)
 * @access Private (Admin, Staff)
 */
router.get(
    '/events/logs',
    authorize(['admin', 'staff']),
    notificationController.getEventLogs
);

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics (Admin only)
 * @access Private (Admin only)
 */
router.get(
    '/stats',
    authorize(['admin']),
    notificationController.getStats
);

/**
 * @route POST /api/notifications/send-bulk
 * @desc Send bulk notification (Admin only)
 * @access Private (Admin only)
 */
router.post(
    '/send-bulk',
    authorize(['admin']),
    validateRequest(sendBulkSchema),
    notificationController.sendBulkNotification
);

module.exports = router;