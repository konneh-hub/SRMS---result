// Audit Logging System Schema
// Comprehensive audit trail for all user actions in the university system

const auditLogsSchema = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- create, update, delete, approve, reject, login, logout, etc.
  entity_type VARCHAR(50) NOT NULL, -- student, result, course, user, etc.
  entity_id INTEGER, -- ID of the affected entity
  entity_name VARCHAR(255), -- Human-readable name/description
  old_values JSONB, -- Previous state for updates
  new_values JSONB, -- New state for updates/creates
  metadata JSONB, -- Additional context (IP, user agent, session info, etc.)
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
  error_message TEXT,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying and reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_university ON audit_logs(university_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);

-- Partitioning strategy for large audit tables (by month)
-- This can be implemented later if audit logs grow significantly
-- CREATE TABLE audit_logs_y2024m01 PARTITION OF audit_logs FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
`;

module.exports = {
  auditLogsSchema
};