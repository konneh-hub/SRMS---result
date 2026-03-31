# Notification System Documentation

## Overview

The notification system provides a comprehensive event-driven notification framework for the university management system. It supports multiple events such as result publication, account creation, approvals, and more, with customizable delivery channels and user preferences.

## Features

### 1. Event Types Supported
- **Result Published**: When student grades are published
- **Account Created**: When new user accounts are created
- **Approval Pending**: When approvals require action
- **Approval Approved**: When approval requests are granted
- **Approval Rejected**: When approval requests are denied
- **Enrollment Confirmed**: When student enrollment is confirmed
- **Course Registered**: When student registers for a course
- **Grade Updated**: When student grades are updated
- **Deadline Approaching**: When important deadlines are approaching
- **System Announcement**: For system-wide announcements
- **Bulk Notifications**: For custom bulk notifications

### 2. Delivery Channels
- **In-App**: Notifications stored in database and displayed in UI
- **Email**: Email notifications (requires email service configuration)
- **SMS**: SMS notifications (requires SMS service configuration)
- **Push**: Push notifications (requires push service configuration)
- **Custom Webhooks**: Custom integrations

### 3. User Preferences
- Users can enable/disable notifications per event type
- Granular channel control (email, SMS, push, in-app)
- Quiet hours configuration for silent periods
- Frequency control (immediate, daily, weekly, never)

### 4. Queue System
- Asynchronous notification processing
- Automatic retry mechanism
- Priority-based processing
- Batch processing for efficiency
- Failure tracking and logging

## Database Schema

### notifications
Stores individual notifications

```sql
- id: Unique identifier
- user_id: Target user
- university_id: University context
- event_type: Type of event
- title: Notification title
- message: Notification content
- data: JSON data for the event
- read_at: When notification was read
- is_read: Read status
- notification_type: Delivery channel
- status: Sending status (pending, sent, failed, delivered)
- send_attempts: Number of send attempts
- created_at: Creation timestamp
```

### notification_preferences
User preferences for notifications

```sql
- id: Unique identifier
- user_id: Target user
- university_id: University context
- event_type: Event type
- email_enabled: Enable email delivery
- sms_enabled: Enable SMS delivery
- push_enabled: Enable push delivery
- in_app_enabled: Enable in-app delivery
- frequency: Notification frequency
- quiet_hours_start/end: Silent period
- quiet_hours_enabled: Enable quiet hours
```

### notification_templates
Customizable notification templates

```sql
- id: Unique identifier
- event_type: Event type
- name: Template name
- email_subject: Email subject line
- email_template: Email HTML template
- sms_template: SMS text template
- push_title/body: Push notification content
- in_app_template: In-app notification template
- variables: Template variables
```

### event_logs
Audit trail of all events

```sql
- id: Unique identifier
- event_type: Type of event
- entity_type: Type of entity affected
- entity_id: ID of affected entity
- triggered_by: User who triggered event
- description: Event description
- data: Event data JSON
- status: Success/failure status
```

### notification_queue
Queue for asynchronous processing

```sql
- id: Unique identifier
- notification_id: Reference to notification
- priority: Processing priority
- scheduled_at: When to process
- status: Queue status
- attempt_count: Number of attempts
- last_attempt_at: Last attempt timestamp
```

## API Endpoints

### Get Notifications
```
GET /api/notifications
Query Parameters:
  - page: Page number (default: 1)
  - limit: Results per page (default: 20)
  - isRead: Filter by read status (true/false)
  - eventType: Filter by event type

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "event_type": "result_published",
      "title": "Result Published",
      "message": "Your grade for Math 101 has been published: A (90)",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20 }
}
```

### Get Unread Count
```
GET /api/notifications/unread-count

Response:
{
  "success": true,
  "data": { "unreadCount": 5 }
}
```

### Mark as Read
```
POST /api/notifications/{notificationId}/read

Response:
{
  "success": true,
  "data": { "is_read": true, "read_at": "2024-01-15T10:35:00Z" }
}
```

### Mark All as Read
```
POST /api/notifications/read-all

Response:
{
  "success": true,
  "message": "All notifications marked as read",
  "data": { "count": 5 }
}
```

### Delete Notification
```
DELETE /api/notifications/{notificationId}

Response:
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### Get Preferences
```
GET /api/notifications/preferences

Response:
{
  "success": true,
  "data": [
    {
      "event_type": "result_published",
      "email_enabled": true,
      "sms_enabled": false,
      "push_enabled": true,
      "in_app_enabled": true,
      "frequency": "immediate"
    }
  ]
}
```

### Update Preferences
```
PUT /api/notifications/preferences

Body:
{
  "eventType": "result_published",
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true,
  "inAppEnabled": true,
  "frequency": "immediate"
}

Response:
{
  "success": true,
  "data": { ...updated preference object... }
}
```

### Disable Channel
```
POST /api/notifications/preferences/disable-channel

Body:
{
  "eventType": "result_published",
  "channel": "email"
}

Response:
{
  "success": true,
  "data": { ...preference object with email disabled... }
}
```

### Enable Channel
```
POST /api/notifications/preferences/enable-channel

Body:
{
  "eventType": "result_published",
  "channel": "email"
}

Response:
{
  "success": true,
  "data": { ...preference object with email enabled... }
}
```

### Get Event Logs (Admin)
```
GET /api/notifications/events/logs?page=1&limit=50&eventType=result_published

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_type": "result_published",
      "entity_type": "result",
      "entity_id": 123,
      "triggered_by": 2,
      "description": "result_published - Grade Published",
      "status": "success",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Statistics (Admin)
```
GET /api/notifications/stats?days=7

Response:
{
  "success": true,
  "data": [
    {
      "event_type": "result_published",
      "status": "sent",
      "count": 45,
      "date": "2024-01-15"
    }
  ]
}
```

### Send Bulk Notification (Admin)
```
POST /api/notifications/send-bulk

Body:
{
  "recipientUserIds": [1, 2, 3, 4, 5],
  "title": "System Maintenance",
  "message": "The system will be under maintenance on Sunday from 10 PM to 2 AM",
  "eventType": "system_announcement"
}

Response:
{
  "success": true,
  "message": "Bulk notification sent successfully"
}
```

## Integration Examples

### Trigger Result Published Notification

```javascript
const notificationEventEmitter = require('./services/notificationEventEmitter');

// In your result publishing service
notificationEventEmitter.resultPublished({
    studentId: 5,
    courseId: 101,
    courseName: 'Mathematics 101',
    grade: 'A',
    score: 90,
    universityId: 1,
    tenantId: 'tenant-1',
    triggeredBy: 2
});
```

### Trigger Account Created Notification

```javascript
notificationEventEmitter.accountCreated({
    userId: 5,
    userEmail: 'student@example.com',
    userName: 'John Doe',
    role: 'student',
    universityId: 1,
    tenantId: 'tenant-1'
});
```

### Send Approval Pending Notification

```javascript
notificationEventEmitter.approvalPending({
    approvalType: 'grade_change',
    approverIds: [3, 4],  // IDs of approvers
    entityName: 'Grade Change: Math 101 - A to A+',
    universityId: 1,
    tenantId: 'tenant-1',
    triggeredBy: 2
});
```

### Initialize Queue Worker

```javascript
const NotificationQueueWorker = require('./services/notificationQueueWorker');

const notificationWorker = new NotificationQueueWorker({
    pollInterval: 5000,    // Check every 5 seconds
    batchSize: 10,         // Process 10 per batch
    maxRetries: 3,         // Retry 3 times
    lockDuration: 300      // 5 minute lock
});

notificationWorker.start();

// Stop on app shutdown
process.on('SIGTERM', () => {
    notificationWorker.stop();
});
```

## Setup Instructions

### 1. Initialize Database Tables

```bash
node db-init.js
```

This will create all necessary notification tables.

### 2. Import Notification System in App

```javascript
// In server.js or app initialization
const notificationEventEmitter = require('./src/services/notificationEventEmitter');
const NotificationQueueWorker = require('./src/services/notificationQueueWorker');

// Start queue worker
const notificationWorker = new NotificationQueueWorker();
notificationWorker.start();

// Make emitter available globally
global.notificationEventEmitter = notificationEventEmitter;
```

### 3. Initialize User Preferences

```javascript
// When creating new user
const notificationService = require('./services/notificationService');

await notificationService.initializeUserPreferences(
    userId,
    universityId,
    tenantId
);
```

### 4. Integrate with Existing Services

Update your services to emit notification events:

```javascript
// In result service
notificationEventEmitter.resultPublished({...});

// In user service
notificationEventEmitter.accountCreated({...});

// In approval service
notificationEventEmitter.approvalPending({...});
```

## Advanced Configuration

### Custom Notification Channels

To add custom channels (e.g., Slack, WhatsApp):

1. Implement channel handler in `notificationQueueWorker.js`
2. Update `sendViaChannel()` method
3. Add channel configuration in notification channels table

```javascript
async sendToSlack(notification, template) {
    // Your Slack API implementation
    return { success: true, message: 'Sent to Slack' };
}
```

### Email Service Integration

To enable email notifications, configure and implement:

```javascript
async sendEmail(notification, template) {
    const emailService = require('./emailService');
    
    return await emailService.send({
        to: user.email,
        subject: template.email_subject,
        html: template.email_template,
        data: notification.data
    });
}
```

### SMS Service Integration

```javascript
async sendSMS(notification, template) {
    const smsService = require('./smsService');
    
    return await smsService.send({
        to: user.phone,
        message: template.sms_template,
        data: notification.data
    });
}
```

## Maintenance

### Clean Up Old Notifications

```javascript
const notificationService = require('./services/notificationService');

await notificationService.cleanup({
    notificationDays: 30,  // Delete notifications older than 30 days
    logDays: 90           // Delete logs older than 90 days
});
```

Schedule this as a cron job:

```javascript
const cron = require('node-cron');

cron.schedule('0 2 * * *', async () => {
    await notificationService.cleanup();
});
```

## Performance Considerations

1. **Queue Processing**: Worker processes in batches to avoid database overload
2. **Indexing**: Properly indexed tables for fast queries
3. **Archiving**: Archive old notifications to separate tables
4. **Rate Limiting**: Implement rate limits per user
5. **Caching**: Cache notification templates and preferences

## Testing

```javascript
// Test notification creation
const notificationService = require('./services/notificationService');

await notificationService.triggerNotification({
    eventType: 'test_event',
    userId: 1,
    universityId: 1,
    title: 'Test Notification',
    message: 'This is a test',
    tenantId: 'test-tenant'
});

// Check unread count
const count = await notificationService.getUnreadCount(1, 1);
console.log('Unread count:', count);
```

## Troubleshooting

### Notifications Not Appearing

1. Check user preferences are enabled
2. Verify notification queue worker is running
3. Check event logs for errors
4. Verify user has read permission (tenant/university)

### Queue Processing Issues

1. Check notification_queue table for stuck items
2. Verify database connection
3. Check error_message in queue for details
4. Monitor worker logs

## Future Enhancements

- [ ] WebSocket real-time notifications
- [ ] Notification digest (daily/weekly summaries)
- [ ] Analytics dashboard
- [ ] Advanced filtering and search
- [ ] Notification templates UI
- [ ] Mobile app integration
- [ ] Slack integration
- [ ] Teams integration
