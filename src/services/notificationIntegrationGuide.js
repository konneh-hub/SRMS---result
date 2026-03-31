/**
 * Notification System Integration Guide
 * 
 * This file provides examples of how to integrate the notification system
 * with existing services in the application.
 */

// Example 1: Trigger notification when result is published
// In resultService.js or similar:

const notificationEventEmitter = require('./notificationEventEmitter');

async function publishResult(resultData) {
    // ... existing result publishing logic ...

    const { studentId, courseId, courseName, grade, score, universityId, tenantId } = resultData;

    // Trigger notification event
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

    // ... rest of function ...
}

// ============================================

// Example 2: Trigger notification when user account is created
// In userService.js or authService.js:

async function createUser(userData) {
    // ... existing user creation logic ...

    const { id: userId, email, firstName, lastName, role, universityId, tenantId } = userData;

    // Trigger notification event
    notificationEventEmitter.accountCreated({
        userId,
        userEmail: email,
        userName: `${firstName} ${lastName}`,
        role,
        universityId,
        tenantId
    });

    // ... rest of function ...
}

// ============================================

// Example 3: Trigger notification for approvals
// In approvalService.js:

async function submitApproval(approvalData) {
    // ... existing approval logic ...

    const { approverIds, approvalType, entityName, universityId, tenantId } = approvalData;

    // Trigger pending approval notification
    notificationEventEmitter.approvalPending({
        approvalType,
        approverIds,
        entityName,
        universityId,
        tenantId,
        triggeredBy: req.user.id
    });

    // ... rest of function ...
}

async function approveRequest(approvalId) {
    // ... existing approval logic ...

    // Trigger approval approved notification
    notificationEventEmitter.approvalApproved({
        approvalType: approval.type,
        requesterId: approval.requester_id,
        entityName: approval.entity_name,
        universityId,
        tenantId,
        approverName: req.user.firstName + ' ' + req.user.lastName
    });

    // ... rest of function ...
}

// ============================================

// Example 4: Initialize notification preferences for new user
// In user creation handler:

const notificationService = require('./notificationService');

async function createUserWithNotifications(userData) {
    const user = await createUser(userData);

    // Initialize notification preferences for new user
    await notificationService.initializeUserPreferences(
        user.id,
        user.university_id,
        user.tenant_id
    );

    return user;
}

// ============================================

// Example 5: Update grades with notification
// In courseEnrollmentService.js:

async function recordGrade(enrollmentId, gradeData) {
    const enrollment = await courseEnrollmentRepository.findById(enrollmentId);
    const oldGrade = enrollment.grade;

    // ... existing grade recording logic ...

    const updated = await courseEnrollmentRepository.update(enrollmentId, gradeData);

    // Trigger grade updated notification if grade changed
    if (oldGrade !== updated.grade) {
        notificationEventEmitter.gradeUpdated({
            studentId: enrollment.student_id,
            courseName: enrollment.course_name,
            oldGrade,
            newGrade: updated.grade,
            universityId: enrollment.university_id,
            tenantId: enrollment.tenant_id,
            triggeredBy: req.user.id
        });
    }

    return updated;
}

// ============================================

// Example 6: Send bulk announcement notification
// In controller:

notificationEventEmitter.announcement({
    recipientUserIds: [studentId1, studentId2, staffId1],
    title: 'System Maintenance',
    message: 'The system will be under maintenance on Sunday from 10 PM to 2 AM',
    announcementType: 'maintenance',
    universityId,
    tenantId,
    triggeredBy: req.user.id
});

// ============================================

// Example 7: Deadline approaching notification
// In a scheduled task:

async function checkDeadlines() {
    const deadlines = await getUpcomingDeadlines(3); // Get deadlines in 3 days

    for (const deadline of deadlines) {
        const students = await getStudentsForDeadline(deadline.id);
        const studentIds = students.map(s => s.id);

        notificationEventEmitter.deadlineApproaching({
            studentIds,
            deadlineType: deadline.type,
            deadlineName: deadline.name,
            daysRemaining: 3,
            universityId: deadline.university_id,
            tenantId: deadline.tenant_id
        });
    }
}

// ============================================

// Example 8: Initialize queue worker
// In server.js or app initialization:

const NotificationQueueWorker = require('./services/notificationQueueWorker');

// Create and start the notification queue worker
const notificationWorker = new NotificationQueueWorker({
    pollInterval: 5000,    // Check queue every 5 seconds
    batchSize: 10,         // Process 10 notifications per batch
    maxRetries: 3,         // Retry failed notifications up to 3 times
    lockDuration: 300      // Lock item for 5 minutes during processing
});

// Start the worker
notificationWorker.start();

// Optionally stop when app shuts down
process.on('SIGTERM', () => {
    notificationWorker.stop();
});

// ============================================

// Example 9: Getting notifications on frontend
// API endpoints available:

// Get unread notifications
// GET /api/notifications?page=1&limit=20

// Get unread count
// GET /api/notifications/unread-count

// Mark as read
// POST /api/notifications/{notificationId}/read

// Mark all as read
// POST /api/notifications/read-all

// Delete notification
// DELETE /api/notifications/{notificationId}

// Get preferences
// GET /api/notifications/preferences

// Update preference
// PUT /api/notifications/preferences
// {
//   "eventType": "result_published",
//   "emailEnabled": true,
//   "smsEnabled": false,
//   "pushEnabled": true,
//   "inAppEnabled": true,
//   "frequency": "immediate"
// }

// Disable channel
// POST /api/notifications/preferences/disable-channel
// { "eventType": "result_published", "channel": "email" }

// Enable channel
// POST /api/notifications/preferences/enable-channel
// { "eventType": "result_published", "channel": "email" }

module.exports = {
    publishResult,
    createUser,
    submitApproval,
    checkDeadlines
};