# Audit Logging System Documentation

## Overview

The Audit Logging System provides comprehensive tracking of all user actions within the University Management System. It records detailed information about who performed what action, when, where, and what changed, ensuring compliance, security, and accountability.

## Features

- **Complete Action Tracking**: Logs all CRUD operations, approvals, authentication events, and administrative actions
- **Detailed Change History**: Captures old and new values for update operations
- **Multi-tenant Support**: Isolated audit logs per tenant
- **Performance Optimized**: Asynchronous logging with batch processing
- **Flexible Querying**: Advanced filtering and pagination for audit log retrieval
- **Export Capabilities**: JSON and CSV export formats
- **Security Focused**: IP address, user agent, and session tracking
- **Configurable Retention**: Automatic cleanup of old audit logs

## Database Schema

### audit_logs Table

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  entity_name VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Get Audit Logs
```
GET /api/audit/logs
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Records per page (default: 50, max: 100)
- `userId` (number): Filter by user ID
- `universityId` (number): Filter by university ID
- `action` (string): Filter by action type
- `entityType` (string): Filter by entity type
- `entityId` (number): Filter by entity ID
- `status` (string): Filter by status
- `startDate` (string): Filter from date (ISO format)
- `endDate` (string): Filter to date (ISO format)

**Response:**
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Get Audit Statistics
```
GET /api/audit/stats
```

**Query Parameters:**
- `universityId` (number): Filter by university ID
- `startDate` (string): Filter from date
- `endDate` (string): Filter to date

### Get User Activity
```
GET /api/audit/user-activity/:userId
```

**Query Parameters:**
- `limit` (number): Number of records to return (default: 20)

### Get Audit Log Details
```
GET /api/audit/logs/:id
```

### Export Audit Logs
```
GET /api/audit/export
```

**Query Parameters:**
- `format` (string): Export format - 'json' or 'csv' (default: 'json')
- All filtering parameters from GET /api/audit/logs

## Auditable Actions

### Result Management
- `upload_scores`: When scores are uploaded to a result submission
- `submit_for_approval`: When a result submission is sent for approval
- `approve_submission`: When a result submission is approved
- `reject_submission`: When a result submission is rejected
- `submit_to_exam_officer`: When submission is forwarded to exam officer
- `exam_officer_approve`: When exam officer approves submission
- `exam_officer_reject`: When exam officer rejects submission
- `recall_submission`: When a submission is recalled to draft status

### Authentication
- `login`: User login events
- `logout`: User logout events
- `password_change`: Password change events
- `password_reset`: Password reset events

### Administrative Actions
- `user_create`: User account creation
- `user_update`: User account updates
- `user_delete`: User account deletion
- `role_change`: User role changes
- `permission_change`: Permission modifications

### General CRUD
- `create`: Entity creation
- `update`: Entity updates
- `delete`: Entity deletion

## Integration Examples

### Manual Audit Logging

```javascript
const AuditService = require('../services/auditService');
const auditService = new AuditService();

// Log a custom action
await auditService.logAction(user, 'custom_action', 'entity_type', {
  entityId: 123,
  entityName: 'Example Entity'
}, {
  ipAddress: req.ip,
  userAgent: req.get('User-Agent'),
  metadata: { customField: 'value' }
});

// Log entity creation
await auditService.logCreate(user, 'student', studentData);

// Log entity update
await auditService.logUpdate(user, 'course', courseData, oldValues, newValues);

// Log approval action
await auditService.logApproval(user, 'result', resultData, 'approve');
```

### Automatic Audit Logging

```javascript
const AuditService = require('../services/auditService');
const auditService = new AuditService();

// Create audit middleware for automatic logging
const auditMiddleware = auditService.createAuditMiddleware('update', 'student');

// Use in routes
app.put('/api/students/:id', auditMiddleware, studentController.update);
```

## Configuration

The audit system is configured via `src/config/auditConfig.js`. Key settings include:

- **Audit Levels**: Control detail level (NONE, BASIC, DETAILED, FULL)
- **Auditable Actions**: Which actions to log
- **Sensitive Fields**: Fields to mask in logs
- **Retention Policy**: How long to keep audit logs
- **Performance Settings**: Batch sizes and timeouts
- **Security Settings**: IP logging, rate limiting

## Security Considerations

1. **Access Control**: Only administrators can view audit logs
2. **Data Masking**: Sensitive fields are automatically masked
3. **IP Tracking**: All actions include IP address logging
4. **Session Tracking**: Links actions to user sessions
5. **Immutable Logs**: Audit logs cannot be modified once created

## Performance Optimization

1. **Asynchronous Logging**: Audit logging doesn't block main operations
2. **Batch Processing**: Multiple audit events are processed in batches
3. **Indexing**: Optimized database indexes for fast querying
4. **Cleanup**: Automatic removal of old audit logs
5. **Rate Limiting**: Prevents audit log flooding

## Monitoring and Maintenance

### Log Rotation
Old audit logs are automatically cleaned up based on the retention policy (default: 365 days).

### Health Checks
Monitor audit system health through:
- Database connection status
- Queue processing status
- Log volume trends
- Error rates

### Alerts
Configure alerts for:
- High error rates in audit logging
- Unusual activity patterns
- Storage capacity warnings

## Troubleshooting

### Common Issues

1. **Audit Logs Not Appearing**
   - Check database connectivity
   - Verify audit service is properly initialized
   - Check for async logging errors in application logs

2. **Performance Issues**
   - Review batch sizes in configuration
   - Check database indexes
   - Monitor queue processing

3. **Storage Issues**
   - Adjust retention policy
   - Enable log compression
   - Implement log archiving

## Compliance

The audit logging system helps meet compliance requirements for:
- **GDPR**: User data access tracking
- **SOX**: Financial transaction auditing
- **FERPA**: Educational record access tracking
- **ISO 27001**: Security event logging

## Future Enhancements

- Real-time audit dashboards
- Advanced analytics and reporting
- Integration with SIEM systems
- Blockchain-based immutable audit trails
- Machine learning anomaly detection