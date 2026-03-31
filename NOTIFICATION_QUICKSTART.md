/**
 * Quick Start Guide - Notification System
 * 
 * This file shows the quickest way to get the notification system running
 */

// ============================================
// STEP 1: Initialize Database Tables
// ============================================

// Run in terminal:
// node db-init.js

// This will create all notification-related tables:
// - notifications
// - notification_preferences
// - notification_templates
// - event_logs
// - notification_channels
// - notification_queue


// ============================================
// STEP 2: Seed Default Templates
// ============================================

// Run in terminal:
// node src/scripts/seedNotificationTemplates.js

// This creates default templates for all event types


// ============================================
// STEP 3: Start Server with Notification Worker
// ============================================

// In server.js, add this before starting the server:

const NotificationQueueWorker = require('./src/services/notificationQueueWorker');

// Create notification worker
const notificationWorker = new NotificationQueueWorker({
    pollInterval: 5000,      // Check queue every 5 seconds
    batchSize: 10,           // Process 10 notifications at a time
    maxRetries: 3,           // Retry failed notifications 3 times
    lockDuration: 300        // Lock for 5 minutes during processing
});

// Start worker
notificationWorker.start();

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Stopping notification worker...');
    notificationWorker.stop();
});

// ============================================
// STEP 4: Use in Your Services
// ============================================

// Example: Result Service
const notificationEventEmitter = require('./src/services/notificationEventEmitter');

async function publishResult(studentId, courseId, courseName, grade, score, universityId, tenantId) {
    // Your existing logic...

    // Trigger notification
    notificationEventEmitter.resultPublished({
        studentId,
        courseId,
        courseName,
        grade,
        score,
        universityId,
        tenantId,
        triggeredBy: req.user.id
    });
}

// ============================================
// STEP 5: Initialize User Preferences
// ============================================

const notificationService = require('./src/services/notificationService');

// When creating new user:
async function createNewUser(userData) {
    const user = await userService.create(userData);

    // Initialize notification preferences
    await notificationService.initializeUserPreferences(
        user.id,
        user.university_id,
        user.tenant_id
    );

    return user;
}

// ============================================
// STEP 6: Use Notification APIs in Frontend
// ============================================

/*
Available endpoints:

1. Get Notifications
   GET /api/notifications?page=1&limit=20

2. Get Unread Count
   GET /api/notifications/unread-count

3. Mark as Read
   POST /api/notifications/{notificationId}/read

4. Mark All as Read
   POST /api/notifications/read-all

5. Delete Notification
   DELETE /api/notifications/{notificationId}

6. Get Preferences
   GET /api/notifications/preferences

7. Update Preference
   PUT /api/notifications/preferences
   Body: {
       eventType: "result_published",
       emailEnabled: true,
       smsEnabled: false,
       pushEnabled: true,
       inAppEnabled: true,
       frequency: "immediate"
   }

8. Disable Channel
   POST /api/notifications/preferences/disable-channel
   Body: { eventType: "result_published", channel: "email" }

9. Enable Channel
   POST /api/notifications/preferences/enable-channel
   Body: { eventType: "result_published", channel: "email" }

10. Send Bulk Notification (Admin)
    POST /api/notifications/send-bulk
    Body: {
        recipientUserIds: [1, 2, 3],
        title: "Announcement",
        message: "Important message"
    }

11. Get Event Logs (Admin)
    GET /api/notifications/events/logs?page=1&limit=50

12. Get Statistics (Admin)
    GET /api/notifications/stats?days=7
*/

// ============================================
// STEP 7: Frontend Integration Example (React)
// ============================================

/*
import { useState, useEffect } from 'react';

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        
        // Refresh every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications?page=1&limit=20', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setNotifications(data.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch('/api/notifications/unread-count', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setUnreadCount(data.data.unreadCount);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div className="notifications">
            <div className="header">
                <h2>Notifications ({unreadCount} unread)</h2>
                {unreadCount > 0 && (
                    <button onClick={markAllAsRead}>Mark all as read</button>
                )}
            </div>
            
            <div className="notification-list">
                {notifications.map(notif => (
                    <div 
                        key={notif.id} 
                        className={`notification ${notif.is_read ? 'read' : 'unread'}`}
                    >
                        <div className="content">
                            <h4>{notif.title}</h4>
                            <p>{notif.message}</p>
                            <small>{new Date(notif.created_at).toLocaleString()}</small>
                        </div>
                        
                        {!notif.is_read && (
                            <button onClick={() => markAsRead(notif.id)}>
                                Mark as Read
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Notifications;
*/

// ============================================
// STEP 8: Event Emitter Reference
// ============================================

/*
Available events you can emit:

1. Result Published
   notificationEventEmitter.resultPublished({
       studentId, courseId, courseName, grade, score, universityId, tenantId
   })

2. Account Created
   notificationEventEmitter.accountCreated({
       userId, userEmail, userName, role, universityId, tenantId
   })

3. Approval Pending
   notificationEventEmitter.approvalPending({
       approvalType, approverIds, entityName, universityId, tenantId
   })

4. Approval Approved
   notificationEventEmitter.approvalApproved({
       approvalType, requesterId, entityName, universityId, tenantId, approverName
   })

5. Approval Rejected
   notificationEventEmitter.approvalRejected({
       approvalType, requesterId, entityName, universityId, tenantId, rejectionReason, approverName
   })

6. Enrollment Confirmed
   notificationEventEmitter.enrollmentConfirmed({
       studentId, courseName, semester, universityId, tenantId
   })

7. Course Registered
   notificationEventEmitter.courseRegistered({
       studentId, courseName, courseCode, universityId, tenantId
   })

8. Grade Updated
   notificationEventEmitter.gradeUpdated({
       studentId, courseName, oldGrade, newGrade, universityId, tenantId
   })

9. Deadline Approaching
   notificationEventEmitter.deadlineApproaching({
       studentIds, deadlineType, deadlineName, daysRemaining, universityId, tenantId
   })

10. System Announcement
    notificationEventEmitter.announcement({
        recipientUserIds, title, message, announcementType, universityId, tenantId
    })

11. Bulk Notification
    notificationEventEmitter.sendBulk({
        recipientUserIds, title, message, universityId, tenantId
    })
*/

// ============================================
// TROUBLESHOOTING
// ============================================

/*
Issue: Notifications not appearing

Solutions:
1. Check if queue worker is running
   - Look for "Starting notification queue worker..." in logs
   
2. Check user preferences
   - GET /api/notifications/preferences
   - Make sure channels are enabled for the event
   
3. Check database tables exist
   - Run: SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'notification%'
   
4. Check event logs
   - GET /api/notifications/events/logs
   - Look for the event in the logs
   
5. Check queue status
   - SELECT status, COUNT(*) FROM notification_queue GROUP BY status
   - Look for 'pending' or 'failed' items

Issue: Queue worker crashing

Solutions:
1. Check database connection
2. Check logs for specific errors
3. Verify notification_queue table exists
4. Check for locked items that may be stuck
   - Update notification_queue SET locked_until = NULL WHERE locked_until < NOW();

Issue: High CPU usage

Solutions:
1. Increase pollInterval to reduce frequency
2. Decrease batchSize to process fewer items at once
3. Archive old notifications to improve query performance
4. Add indexes if missing

*/

module.exports = {
    setupNotifications: true
};