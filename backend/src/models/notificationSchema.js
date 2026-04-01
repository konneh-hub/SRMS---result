// Notification System Schema
// This includes tables for notifications, notification preferences, event logs, and notification channels

const notificationsSchema = `
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMP,
  is_read BOOLEAN DEFAULT false,
  notification_type VARCHAR(20) DEFAULT 'in-app' CHECK (notification_type IN ('in-app', 'email', 'sms', 'push')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  send_attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  retry_after TIMESTAMP,
  error_message TEXT,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_university ON notifications(university_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_event_type ON notifications(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
`;

const notificationPreferencesSchema = `
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, university_id, event_type),
  tenant_id VARCHAR(255) NOT NULL
);

-- Indexes for preference lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_preferences_event ON notification_preferences(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_preferences_university ON notification_preferences(university_id);
`;

const notificationTemplatesSchema = `
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  email_subject VARCHAR(255),
  email_template TEXT,
  sms_template TEXT,
  push_title VARCHAR(255),
  push_body TEXT,
  in_app_template TEXT,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for template lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_templates_event ON notification_templates(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_templates_university ON notification_templates(university_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_templates_tenant ON notification_templates(tenant_id);
`;

const eventLogsSchema = `
CREATE TABLE IF NOT EXISTS event_logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  triggered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  description TEXT,
  data JSONB,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_details TEXT,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for event log queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_logs_event_type ON event_logs(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_logs_entity ON event_logs(entity_type, entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_logs_university ON event_logs(university_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_logs_tenant ON event_logs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_logs_created ON event_logs(created_at DESC);
`;

const notificationChannelsSchema = `
CREATE TABLE IF NOT EXISTS notification_channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'slack', 'webhook')),
  is_active BOOLEAN DEFAULT true,
  configuration JSONB,
  credentials JSONB,
  rate_limit INTEGER,
  timeout_seconds INTEGER DEFAULT 30,
  retry_policy JSONB,
  university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL,
  global_channel BOOLEAN DEFAULT false,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, tenant_id)
);

-- Indexes for channel lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_channels_type ON notification_channels(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_channels_university ON notification_channels(university_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_channels_tenant ON notification_channels(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_channels_active ON notification_channels(is_active);
`;

const notificationQueueSchema = `
CREATE TABLE IF NOT EXISTS notification_queue (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'abandoned')),
  failure_reason TEXT,
  locked_until TIMESTAMP,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for queue processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_queue_priority ON notification_queue(priority DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_queue_locked ON notification_queue(locked_until);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_queue_tenant ON notification_queue(tenant_id);
`;

module.exports = {
  notificationsSchema,
  notificationPreferencesSchema,
  notificationTemplatesSchema,
  eventLogsSchema,
  notificationChannelsSchema,
  notificationQueueSchema
};