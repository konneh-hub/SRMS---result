const EventEmitter = require('events');
const notificationService = require('./notificationService');

class NotificationEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.setupListeners();
    }

    /**
     * Setup all event listeners
     */
    setupListeners() {
        // Result publication event
        this.on('result_published', this.handleResultPublished.bind(this));

        // Account creation event
        this.on('account_created', this.handleAccountCreated.bind(this));

        // Approval events
        this.on('approval_pending', this.handleApprovalPending.bind(this));
        this.on('approval_approved', this.handleApprovalApproved.bind(this));
        this.on('approval_rejected', this.handleApprovalRejected.bind(this));

        // Enrollment events
        this.on('enrollment_confirmed', this.handleEnrollmentConfirmed.bind(this));
        this.on('course_registered', this.handleCourseRegistered.bind(this));

        // Grade update event
        this.on('grade_updated', this.handleGradeUpdated.bind(this));

        // Deadline events
        this.on('deadline_approaching', this.handleDeadlineApproaching.bind(this));

        // Announcement event
        this.on('system_announcement', this.handleSystemAnnouncement.bind(this));

        // Bulk events
        this.on('bulk_notification', this.handleBulkNotification.bind(this));
    }

    /**
     * Handle result published event
     */
    async handleResultPublished(eventData) {
        const {
            studentId,
            courseId,
            courseName,
            grade,
            score,
            universityId,
            tenantId,
            triggeredBy
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'result_published',
            userId: studentId,
            universityId,
            title: 'Result Published',
            message: `Your grade for ${courseName} has been published: ${grade} (${score})`,
            data: {
                entityType: 'result',
                entityId: courseId,
                courseName,
                grade,
                score
            },
            triggedBy: triggeredBy,
            tenantId
        });
    }

    /**
     * Handle account created event
     */
    async handleAccountCreated(eventData) {
        const {
            userId,
            userEmail,
            userName,
            role,
            universityId,
            tenantId
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'account_created',
            userId,
            universityId,
            title: 'Account Created',
            message: `Welcome ${userName}! Your ${role} account has been created. You can now log in to the system.`,
            data: {
                entityType: 'user',
                entityId: userId,
                email: userEmail,
                role
            },
            tenantId
        });
    }

    /**
     * Handle approval pending event
     */
    async handleApprovalPending(eventData) {
        const {
            approvalType,
            approverIds,
            entityName,
            universityId,
            tenantId,
            triggeredBy
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'approval_pending',
            recipientUserIds: approverIds,
            universityId,
            title: 'Approval Required',
            message: `A new ${approvalType} approval request is pending: ${entityName}`,
            data: {
                entityType: approvalType,
                approvalType,
                entityName
            },
            triggedBy: triggeredBy,
            tenantId
        });
    }

    /**
     * Handle approval approved event
     */
    async handleApprovalApproved(eventData) {
        const {
            approvalType,
            requesterId,
            entityName,
            universityId,
            tenantId,
            approverName
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'approval_approved',
            userId: requesterId,
            universityId,
            title: 'Approval Granted',
            message: `Your ${approvalType} request has been approved by ${approverName}: ${entityName}`,
            data: {
                entityType: approvalType,
                approvalType,
                entityName,
                approverName
            },
            tenantId
        });
    }

    /**
     * Handle approval rejected event
     */
    async handleApprovalRejected(eventData) {
        const {
            approvalType,
            requesterId,
            entityName,
            universityId,
            tenantId,
            rejectionReason,
            approverName
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'approval_rejected',
            userId: requesterId,
            universityId,
            title: 'Approval Rejected',
            message: `Your ${approvalType} request has been rejected by ${approverName}. Reason: ${rejectionReason}`,
            data: {
                entityType: approvalType,
                approvalType,
                entityName,
                rejectionReason,
                approverName
            },
            tenantId
        });
    }

    /**
     * Handle enrollment confirmed event
     */
    async handleEnrollmentConfirmed(eventData) {
        const {
            studentId,
            courseName,
            semester,
            universityId,
            tenantId
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'enrollment_confirmed',
            userId: studentId,
            universityId,
            title: 'Enrollment Confirmed',
            message: `Your enrollment for ${courseName} (${semester}) has been confirmed.`,
            data: {
                entityType: 'enrollment',
                courseName,
                semester
            },
            tenantId
        });
    }

    /**
     * Handle course registered event
     */
    async handleCourseRegistered(eventData) {
        const {
            studentId,
            courseName,
            courseCode,
            universityId,
            tenantId
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'course_registered',
            userId: studentId,
            universityId,
            title: 'Course Registered',
            message: `You have successfully registered for ${courseCode}: ${courseName}`,
            data: {
                entityType: 'course',
                courseCode,
                courseName
            },
            tenantId
        });
    }

    /**
     * Handle grade updated event
     */
    async handleGradeUpdated(eventData) {
        const {
            studentId,
            courseName,
            oldGrade,
            newGrade,
            universityId,
            tenantId,
            triggeredBy
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'grade_updated',
            userId: studentId,
            universityId,
            title: 'Grade Updated',
            message: `Your grade for ${courseName} has been updated from ${oldGrade} to ${newGrade}`,
            data: {
                entityType: 'grade',
                courseName,
                oldGrade,
                newGrade
            },
            triggedBy: triggeredBy,
            tenantId
        });
    }

    /**
     * Handle deadline approaching event
     */
    async handleDeadlineApproaching(eventData) {
        const {
            studentIds,
            deadlineType,
            deadlineName,
            daysRemaining,
            universityId,
            tenantId
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'deadline_approaching',
            recipientUserIds: studentIds,
            universityId,
            title: 'Deadline Approaching',
            message: `${deadlineName} deadline is approaching in ${daysRemaining} days`,
            data: {
                entityType: 'deadline',
                deadlineType,
                deadlineName,
                daysRemaining
            },
            tenantId
        });
    }

    /**
     * Handle system announcement event
     */
    async handleSystemAnnouncement(eventData) {
        const {
            recipientUserIds,
            title,
            message,
            announcementType,
            universityId,
            tenantId,
            triggeredBy
        } = eventData;

        await notificationService.triggerNotification({
            eventType: 'system_announcement',
            recipientUserIds,
            universityId,
            title,
            message,
            data: {
                entityType: 'announcement',
                announcementType
            },
            triggedBy: triggeredBy,
            tenantId
        });
    }

    /**
     * Handle bulk notification sending
     */
    async handleBulkNotification(eventData) {
        const {
            recipientUserIds,
            title,
            message,
            universityId,
            tenantId,
            eventType = 'bulk_notification'
        } = eventData;

        await notificationService.triggerNotification({
            eventType,
            recipientUserIds,
            universityId,
            title,
            message,
            data: {
                entityType: 'bulk'
            },
            tenantId
        });
    }

    /**
     * Emit result published event
     */
    resultPublished(data) {
        this.emit('result_published', data);
    }

    /**
     * Emit account created event
     */
    accountCreated(data) {
        this.emit('account_created', data);
    }

    /**
     * Emit approval pending event
     */
    approvalPending(data) {
        this.emit('approval_pending', data);
    }

    /**
     * Emit approval approved event
     */
    approvalApproved(data) {
        this.emit('approval_approved', data);
    }

    /**
     * Emit approval rejected event
     */
    approvalRejected(data) {
        this.emit('approval_rejected', data);
    }

    /**
     * Emit enrollment confirmed event
     */
    enrollmentConfirmed(data) {
        this.emit('enrollment_confirmed', data);
    }

    /**
     * Emit course registered event
     */
    courseRegistered(data) {
        this.emit('course_registered', data);
    }

    /**
     * Emit grade updated event
     */
    gradeUpdated(data) {
        this.emit('grade_updated', data);
    }

    /**
     * Emit deadline approaching event
     */
    deadlineApproaching(data) {
        this.emit('deadline_approaching', data);
    }

    /**
     * Emit system announcement event
     */
    announcement(data) {
        this.emit('system_announcement', data);
    }

    /**
     * Send bulk notification
     */
    sendBulk(data) {
        this.emit('bulk_notification', data);
    }
}

module.exports = new NotificationEventEmitter();