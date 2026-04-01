// Audit Repository
// Handles database operations for audit logging

const db = require('../config/database');

class AuditRepository {
  /**
   * Log an audit event
   */
  async logAuditEvent(auditData) {
    const {
      userId,
      universityId,
      action,
      entityType,
      entityId,
      entityName,
      oldValues,
      newValues,
      metadata,
      ipAddress,
      userAgent,
      sessionId,
      status = 'success',
      errorMessage,
      tenantId
    } = auditData;

    const query = `
      INSERT INTO audit_logs (
        user_id, university_id, action, entity_type, entity_id, entity_name,
        old_values, new_values, metadata, ip_address, user_agent, session_id,
        status, error_message, tenant_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const values = [
      userId, universityId, action, entityType, entityId, entityName,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      metadata ? JSON.stringify(metadata) : null,
      ipAddress, userAgent, sessionId, status, errorMessage, tenantId
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters = {}, pagination = {}) {
    const {
      userId,
      universityId,
      action,
      entityType,
      entityId,
      status,
      tenantId,
      startDate,
      endDate
    } = filters;

    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];
    let paramIndex = 1;

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex++}`);
      values.push(userId);
    }

    if (universityId) {
      whereConditions.push(`university_id = $${paramIndex++}`);
      values.push(universityId);
    }

    if (action) {
      whereConditions.push(`action = $${paramIndex++}`);
      values.push(action);
    }

    if (entityType) {
      whereConditions.push(`entity_type = $${paramIndex++}`);
      values.push(entityType);
    }

    if (entityId) {
      whereConditions.push(`entity_id = $${paramIndex++}`);
      values.push(entityId);
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (tenantId) {
      whereConditions.push(`tenant_id = $${paramIndex++}`);
      values.push(tenantId);
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      values.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT
        al.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        univ.name as university_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN universities univ ON al.university_id = univ.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);
    const result = await db.query(dataQuery, values);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(filters = {}) {
    const { tenantId, universityId, startDate, endDate } = filters;

    let whereConditions = [];
    let values = [];
    let paramIndex = 1;

    if (tenantId) {
      whereConditions.push(`tenant_id = $${paramIndex++}`);
      values.push(tenantId);
    }

    if (universityId) {
      whereConditions.push(`university_id = $${paramIndex++}`);
      values.push(universityId);
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      values.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      values.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT
        action,
        entity_type,
        status,
        COUNT(*) as count
      FROM audit_logs
      ${whereClause}
      GROUP BY action, entity_type, status
      ORDER BY count DESC
    `;

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Get recent audit activity for a user
   */
  async getUserActivity(userId, limit = 20) {
    const query = `
      SELECT
        al.*,
        univ.name as university_name
      FROM audit_logs al
      LEFT JOIN universities univ ON al.university_id = univ.id
      WHERE al.user_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Clean up old audit logs (for maintenance)
   */
  async cleanupOldLogs(daysToKeep = 365) {
    const query = `
      DELETE FROM audit_logs
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysToKeep} days'
    `;

    const result = await db.query(query);
    return result.rowCount;
  }
}

module.exports = AuditRepository;