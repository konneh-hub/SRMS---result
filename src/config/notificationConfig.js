/**
 * Notification System Configuration
 * 
 * Configure notification system behavior and channels
 */

module.exports = {
    // Queue Worker Settings
    queue: {
        // How often to check for pending notifications (milliseconds)
        pollInterval: process.env.NOTIFICATION_POLL_INTERVAL || 5000,

        // Number of notifications to process in each batch
        batchSize: process.env.NOTIFICATION_BATCH_SIZE || 10,

        // Maximum number of retry attempts
        maxRetries: process.env.NOTIFICATION_MAX_RETRIES || 3,

        // Lock duration for item processing (seconds)
        lockDuration: process.env.NOTIFICATION_LOCK_DURATION || 300,

        // Enable/disable queue worker
        enabled: process.env.NOTIFICATION_QUEUE_ENABLED !== 'false'
    },

    // Cleanup Settings
    cleanup: {
        // How often to run cleanup (milliseconds)
        schedule: process.env.NOTIFICATION_CLEANUP_SCHEDULE || 86400000, // Every 24 hours

        // Delete notifications older than X days
        notificationRetentionDays: process.env.NOTIFICATION_RETENTION_DAYS || 30,

        // Delete logs older than X days
        logRetentionDays: process.env.NOTIFICATION_LOG_RETENTION_DAYS || 90,

        // Auto-cleanup on startup
        autoCleanup: process.env.NOTIFICATION_AUTO_CLEANUP !== 'false'
    },

    // Default Preferences for New Users
    defaultPreferences: {
        emailEnabled: process.env.NOTIFICATION_EMAIL_DEFAULT !== 'false',
        smsEnabled: process.env.NOTIFICATION_SMS_DEFAULT === 'true',
        pushEnabled: process.env.NOTIFICATION_PUSH_DEFAULT !== 'false',
        inAppEnabled: process.env.NOTIFICATION_INAPP_DEFAULT !== 'false',
        frequency: process.env.NOTIFICATION_FREQUENCY_DEFAULT || 'immediate', // immediate, daily, weekly, never
        quietHoursEnabled: process.env.NOTIFICATION_QUIET_HOURS_DEFAULT === 'true',
        quietHoursStart: process.env.NOTIFICATION_QUIET_START || '22:00', // 10 PM
        quietHoursEnd: process.env.NOTIFICATION_QUIET_END || '08:00'     // 8 AM
    },

    // Email Channel Configuration
    email: {
        // Email provider: 'sendgrid', 'mailgun', 'ses', 'smtp', 'none'
        provider: process.env.EMAIL_PROVIDER || 'none',

        // SendGrid configuration
        sendgrid: {
            apiKey: process.env.SENDGRID_API_KEY,
            fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@university.edu',
            fromName: process.env.SENDGRID_FROM_NAME || 'University System'
        },

        // Mailgun configuration
        mailgun: {
            domain: process.env.MAILGUN_DOMAIN,
            apiKey: process.env.MAILGUN_API_KEY,
            fromEmail: process.env.MAILGUN_FROM_EMAIL || 'noreply@university.edu'
        },

        // AWS SES configuration
        ses: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1',
            fromEmail: process.env.SES_FROM_EMAIL || 'noreply@university.edu'
        },

        // Rate limiting (emails per minute)
        rateLimit: process.env.EMAIL_RATE_LIMIT || 60,

        // Retry settings
        maxRetries: process.env.EMAIL_MAX_RETRIES || 3,
        retryDelayMinutes: process.env.EMAIL_RETRY_DELAY || 5
    },

    // SMS Channel Configuration
    sms: {
        // SMS provider: 'twilio', 'aws-sns', 'nexmo', 'none'
        provider: process.env.SMS_PROVIDER || 'none',

        // Twilio configuration
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            fromNumber: process.env.TWILIO_FROM_NUMBER
        },

        // AWS SNS configuration
        sns: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1'
        },

        // Nexmo configuration
        nexmo: {
            apiKey: process.env.NEXMO_API_KEY,
            apiSecret: process.env.NEXMO_API_SECRET,
            fromNumber: process.env.NEXMO_FROM_NUMBER
        },

        // Rate limiting (SMS per minute)
        rateLimit: process.env.SMS_RATE_LIMIT || 10,

        // Retry settings
        maxRetries: process.env.SMS_MAX_RETRIES || 2,
        retryDelayMinutes: process.env.SMS_RETRY_DELAY || 10
    },

    // Push Notifications Configuration
    push: {
        // Push provider: 'firebase', 'onesignal', 'none'
        provider: process.env.PUSH_PROVIDER || 'none',

        // Firebase Cloud Messaging
        firebase: {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        },

        // OneSignal configuration
        onesignal: {
            appId: process.env.ONESIGNAL_APP_ID,
            apiKey: process.env.ONESIGNAL_API_KEY
        },

        // Rate limiting (pushes per minute)
        rateLimit: process.env.PUSH_RATE_LIMIT || 100,

        // Retry settings
        maxRetries: process.env.PUSH_MAX_RETRIES || 3,
        retryDelaySeconds: process.env.PUSH_RETRY_DELAY || 60
    },

    // Webhook Configuration
    webhook: {
        enabled: process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true',
        baseUrl: process.env.WEBHOOK_BASE_URL,
        timeout: process.env.WEBHOOK_TIMEOUT || 10000,
        retryAttempts: process.env.WEBHOOK_RETRY_ATTEMPTS || 3,
        retryDelaySeconds: process.env.WEBHOOK_RETRY_DELAY || 300
    },

    // Event-specific settings
    events: {
        resultPublished: {
            enabled: process.env.EVENT_RESULT_PUBLISHED_ENABLED !== 'false',
            channels: ['in-app', 'email', 'push']
        },
        accountCreated: {
            enabled: process.env.EVENT_ACCOUNT_CREATED_ENABLED !== 'false',
            channels: ['in-app', 'email']
        },
        approvalPending: {
            enabled: process.env.EVENT_APPROVAL_PENDING_ENABLED !== 'false',
            channels: ['in-app', 'email', 'push']
        },
        approvalApproved: {
            enabled: process.env.EVENT_APPROVAL_APPROVED_ENABLED !== 'false',
            channels: ['in-app', 'email']
        },
        approvalRejected: {
            enabled: process.env.EVENT_APPROVAL_REJECTED_ENABLED !== 'false',
            channels: ['in-app', 'email']
        },
        enrollmentConfirmed: {
            enabled: process.env.EVENT_ENROLLMENT_CONFIRMED_ENABLED !== 'false',
            channels: ['in-app', 'email']
        },
        courseRegistered: {
            enabled: process.env.EVENT_COURSE_REGISTERED_ENABLED !== 'false',
            channels: ['in-app', 'email']
        },
        gradeUpdated: {
            enabled: process.env.EVENT_GRADE_UPDATED_ENABLED !== 'false',
            channels: ['in-app', 'email', 'push']
        },
        deadlineApproaching: {
            enabled: process.env.EVENT_DEADLINE_APPROACHING_ENABLED !== 'false',
            channels: ['in-app', 'email', 'push']
        },
        systemAnnouncement: {
            enabled: process.env.EVENT_SYSTEM_ANNOUNCEMENT_ENABLED !== 'false',
            channels: ['in-app', 'email']
        }
    },

    // Logging
    logging: {
        enabled: process.env.NOTIFICATION_LOGGING_ENABLED !== 'false',
        level: process.env.NOTIFICATION_LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
        logFile: process.env.NOTIFICATION_LOG_FILE || 'logs/notifications.log'
    },

    // Monitoring & Alerts
    monitoring: {
        // Alert when queue size exceeds threshold
        queueSizeThreshold: process.env.QUEUE_SIZE_THRESHOLD || 1000,

        // Alert when failure rate exceeds threshold (percentage)
        failureRateThreshold: process.env.FAILURE_RATE_THRESHOLD || 10,

        // Alert email for critical issues
        alertEmail: process.env.NOTIFICATION_ALERT_EMAIL,

        // Enable alerts
        enabled: process.env.MONITORING_ENABLED === 'true'
    },

    // Feature Flags
    features: {
        // Enable bulk notifications
        bulkNotifications: process.env.FEATURE_BULK_NOTIFICATIONS !== 'false',

        // Enable scheduled notifications
        scheduledNotifications: process.env.FEATURE_SCHEDULED_NOTIFICATIONS === 'true',

        // Enable notification digest (daily/weekly summaries)
        notificationDigest: process.env.FEATURE_NOTIFICATION_DIGEST === 'true',

        // Enable user preference UI
        preferenceManagement: process.env.FEATURE_PREFERENCE_MANAGEMENT !== 'false',

        // Enable analytics
        analytics: process.env.FEATURE_NOTIFICATION_ANALYTICS === 'true'
    },

    // Database
    database: {
        // Connection pool size
        pool: {
            min: process.env.DB_POOL_MIN || 2,
            max: process.env.DB_POOL_MAX || 10
        }
    }
};

/**
 * Environment Variables Reference
 * 
 * NOTIFICATION QUEUE:
 * - NOTIFICATION_POLL_INTERVAL: Queue check interval (ms), default 5000
 * - NOTIFICATION_BATCH_SIZE: Items per batch, default 10
 * - NOTIFICATION_MAX_RETRIES: Retry attempts, default 3
 * - NOTIFICATION_LOCK_DURATION: Lock time (s), default 300
 * - NOTIFICATION_QUEUE_ENABLED: Enable queue, default true
 * 
 * CLEANUP:
 * - NOTIFICATION_CLEANUP_SCHEDULE: Cleanup schedule (ms), default 86400000
 * - NOTIFICATION_RETENTION_DAYS: Keep notifications, default 30 days
 * - NOTIFICATION_LOG_RETENTION_DAYS: Keep logs, default 90 days
 * - NOTIFICATION_AUTO_CLEANUP: Auto cleanup, default true
 * 
 * DEFAULT PREFERENCES:
 * - NOTIFICATION_EMAIL_DEFAULT: Email enabled, default true
 * - NOTIFICATION_SMS_DEFAULT: SMS enabled, default false
 * - NOTIFICATION_PUSH_DEFAULT: Push enabled, default true
 * - NOTIFICATION_INAPP_DEFAULT: In-app enabled, default true
 * - NOTIFICATION_FREQUENCY_DEFAULT: Frequency, default 'immediate'
 * - NOTIFICATION_QUIET_HOURS_DEFAULT: Quiet hours, default false
 * - NOTIFICATION_QUIET_START: Quiet start, default '22:00'
 * - NOTIFICATION_QUIET_END: Quiet end, default '08:00'
 * 
 * EMAIL:
 * - EMAIL_PROVIDER: Provider (sendgrid|mailgun|ses|smtp|none), default 'none'
 * - SENDGRID_API_KEY: SendGrid API key
 * - SENDGRID_FROM_EMAIL: From email
 * - SENDGRID_FROM_NAME: From name
 * - MAILGUN_DOMAIN: Mailgun domain
 * - MAILGUN_API_KEY: Mailgun API key
 * - (etc. for other providers)
 * 
 * SMS:
 * - SMS_PROVIDER: Provider (twilio|aws-sns|nexmo|none), default 'none'
 * - TWILIO_ACCOUNT_SID: Twilio account
 * - TWILIO_AUTH_TOKEN: Twilio token
 * - (etc. for other providers)
 * 
 * PUSH:
 * - PUSH_PROVIDER: Provider (firebase|onesignal|none), default 'none'
 * - FIREBASE_PROJECT_ID: Firebase project
 * - (etc. for other providers)
 * 
 * LOGGING:
 * - NOTIFICATION_LOGGING_ENABLED: Enable logging, default true
 * - NOTIFICATION_LOG_LEVEL: Log level (debug|info|warn|error), default 'info'
 * - NOTIFICATION_LOG_FILE: Log file path
 * 
 * EXAMPLE .env file:
 * 
 * NOTIFICATION_POLL_INTERVAL=5000
 * NOTIFICATION_BATCH_SIZE=10
 * EMAIL_PROVIDER=sendgrid
 * SENDGRID_API_KEY=your_api_key
 * SENDGRID_FROM_EMAIL=noreply@university.edu
 * NOTIFICATION_LOGGING_ENABLED=true
 * NOTIFICATION_LOG_LEVEL=info
 * 
 */