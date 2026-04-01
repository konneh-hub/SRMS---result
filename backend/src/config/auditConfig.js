// Audit System Configuration
// Configuration settings for the audit logging system

const auditConfig = {
  // Database settings
  database: {
    tableName: 'audit_logs',
    retentionDays: 365, // Keep audit logs for 1 year
    maxQueryLimit: 1000, // Maximum records per query
  },

  // Audit levels
  levels: {
    NONE: 0,      // No auditing
    BASIC: 1,     // Basic actions (create, update, delete)
    DETAILED: 2,  // Detailed actions with full data
    FULL: 3       // All actions including reads
  },

  // Default audit level for different entity types
  defaultLevels: {
    user: 'DETAILED',
    student: 'DETAILED',
    course: 'BASIC',
    result: 'FULL',        // Full auditing for results
    university: 'BASIC',
    department: 'BASIC',
    faculty: 'BASIC',
    program: 'BASIC',
    enrollment: 'BASIC',
    billing: 'DETAILED',
    payment: 'FULL',
    notification: 'BASIC',
    authentication: 'FULL' // Full auditing for auth events
  },

  // Actions to audit
  auditableActions: {
    // CRUD operations
    create: true,
    update: true,
    delete: true,
    read: false, // Generally don't audit reads unless sensitive

    // Result-specific actions
    upload_scores: true,
    submit_for_approval: true,
    approve_submission: true,
    reject_submission: true,
    submit_to_exam_officer: true,
    exam_officer_approve: true,
    exam_officer_reject: true,
    recall_submission: true,

    // Approval workflow actions
    approve: true,
    reject: true,
    validate: true,

    // Authentication actions
    login: true,
    logout: true,
    password_change: true,
    password_reset: true,

    // Administrative actions
    user_create: true,
    user_update: true,
    user_delete: true,
    role_change: true,
    permission_change: true,

    // System actions
    bulk_import: true,
    bulk_export: true,
    system_config_change: true
  },

  // Sensitive fields to mask in audit logs
  sensitiveFields: [
    'password',
    'passwordHash',
    'password_reset_token',
    'email_verification_token',
    'api_key',
    'secret',
    'private_key',
    'credit_card',
    'ssn',
    'social_security_number'
  ],

  // Fields to exclude from audit logs entirely
  excludedFields: [
    'created_at',
    'updated_at',
    'password_changed_at',
    'last_login_at'
  ],

  // Export settings
  export: {
    maxRecords: 10000, // Maximum records to export at once
    formats: ['json', 'csv'],
    defaultFormat: 'json',
    compression: true
  },

  // Performance settings
  performance: {
    batchSize: 100, // Batch size for bulk operations
    asyncLogging: true, // Log asynchronously to avoid blocking
    queueTimeout: 30000, // 30 seconds timeout for queued operations
    retryAttempts: 3
  },

  // Security settings
  security: {
    ipLogging: true,
    userAgentLogging: true,
    sessionLogging: true,
    rateLimit: {
      enabled: true,
      maxRequestsPerMinute: 1000,
      burstLimit: 100
    }
  },

  // Notification settings for audit events
  notifications: {
    enabled: false, // Enable audit event notifications
    criticalActions: ['user_delete', 'role_change', 'system_config_change'],
    recipients: ['admin@university.edu'], // Email addresses to notify
    channels: ['email'] // notification channels
  },

  // Maintenance settings
  maintenance: {
    cleanupEnabled: true,
    cleanupSchedule: '0 2 * * *', // Daily at 2 AM
    archiveEnabled: false,
    archivePath: './audit-archive/'
  }
};

module.exports = auditConfig;