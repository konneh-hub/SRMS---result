// Audit Service
// High-level service for audit logging across the application

const AuditRepository = require('../repositories/auditRepository');

class AuditService {
  constructor() {
    this.auditRepository = new AuditRepository();
  }

  /**
   * Log a user action
   */
  async logAction(user, action, entityType, entityData = {}, options = {}) {
    const {
      entityId,
      entityName,
      oldValues,
      newValues,
      metadata = {},
      ipAddress,
      userAgent,
      sessionId,
      status = 'success',
      errorMessage
    } = options;

    const auditData = {
      userId: user.id || user.userId,
      universityId: user.universityId || user.university_id,
      action,
      entityType,
      entityId,
      entityName: entityName || this.generateEntityName(entityType, entityData),
      oldValues,
      newValues,
      metadata: {
        ...metadata,
        userRole: user.role,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      sessionId,
      status,
      errorMessage,
      tenantId: user.tenantId || user.tenant_id
    };

    try {
      return await this.auditRepository.logAuditEvent(auditData);
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main flow
      return null;
    }
  }

  /**
   * Log entity creation
   */
  async logCreate(user, entityType, entityData, options = {}) {
    return this.logAction(user, 'create', entityType, entityData, {
      newValues: entityData,
      ...options
    });
  }

  /**
   * Log entity update
   */
  async logUpdate(user, entityType, entityData, oldValues, newValues, options = {}) {
    return this.logAction(user, 'update', entityType, entityData, {
      oldValues,
      newValues,
      ...options
    });
  }

  /**
   * Log entity deletion
   */
  async logDelete(user, entityType, entityData, options = {}) {
    return this.logAction(user, 'delete', entityType, entityData, {
      oldValues: entityData,
      ...options
    });
  }

  /**
   * Log approval action
   */
  async logApproval(user, entityType, entityData, action, options = {}) {
    return this.logAction(user, action, entityType, entityData, {
      metadata: {
        approvalType: action,
        ...options.metadata
      },
      ...options
    });
  }

  /**
   * Log authentication events
   */
  async logAuth(user, action, options = {}) {
    return this.logAction(user, action, 'authentication', {}, {
      metadata: {
        authAction: action,
        ...options.metadata
      },
      ...options
    });
  }

  /**
   * Log result-related actions
   */
  async logResultAction(user, action, resultData, options = {}) {
    const entityName = this.generateResultEntityName(resultData);
    return this.logAction(user, action, 'result', resultData, {
      entityName,
      ...options
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters = {}, pagination = {}) {
    return this.auditRepository.getAuditLogs(filters, pagination);
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(filters = {}) {
    return this.auditRepository.getAuditStats(filters);
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId, limit = 20) {
    return this.auditRepository.getUserActivity(userId, limit);
  }

  /**
   * Extract audit context from request
   */
  extractAuditContext(req) {
    return {
      ipAddress: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionId || req.headers['x-session-id']
    };
  }

  /**
   * Generate entity name for better readability
   */
  generateEntityName(entityType, entityData) {
    switch (entityType) {
      case 'student':
        return entityData.name || `${entityData.firstName} ${entityData.lastName}` || `Student ${entityData.id}`;
      case 'course':
        return entityData.name || entityData.courseName || `Course ${entityData.id}`;
      case 'result':
        return this.generateResultEntityName(entityData);
      case 'user':
        return entityData.email || `${entityData.firstName} ${entityData.lastName}` || `User ${entityData.id}`;
      case 'university':
        return entityData.name || `University ${entityData.id}`;
      default:
        return entityData.name || entityData.title || `${entityType} ${entityData.id || 'Unknown'}`;
    }
  }

  /**
   * Generate result entity name
   */
  generateResultEntityName(resultData) {
    if (resultData.courseName && resultData.studentName) {
      return `${resultData.courseName} - ${resultData.studentName}`;
    }
    if (resultData.submissionId) {
      return `Result Submission ${resultData.submissionId}`;
    }
    return `Result ${resultData.id || 'Unknown'}`;
  }

  /**
   * Middleware for automatic audit logging
   */
  createAuditMiddleware(action, entityType) {
    return async (req, res, next) => {
      const originalSend = res.send;
      const auditContext = this.extractAuditContext(req);

      res.send = async (data) => {
        try {
          // Only log successful operations
          if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
            const entityData = this.extractEntityDataFromRequest(req, entityType);
            await this.logAction(req.user, action, entityType, entityData, auditContext);
          }
        } catch (error) {
          console.error('Audit logging failed:', error);
        }

        originalSend.call(res, data);
      };

      next();
    };
  }

  /**
   * Extract entity data from request for automatic logging
   */
  extractEntityDataFromRequest(req, entityType) {
    switch (entityType) {
      case 'student':
        return { ...req.body, id: req.params.id };
      case 'course':
        return { ...req.body, id: req.params.id };
      case 'result':
        return { ...req.body, id: req.params.submissionId || req.params.id };
      default:
        return { ...req.body, ...req.params };
    }
  }
}

module.exports = AuditService;