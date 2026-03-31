// Audit Controller
// API endpoints for audit log management and viewing

const AuditService = require('../services/auditService');
const { AppError } = require('../utils/helpers');

class AuditController {
  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Get audit logs with filtering and pagination
   * GET /api/audit/logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        universityId,
        action,
        entityType,
        entityId,
        status,
        startDate,
        endDate
      } = req.query;

      // Validate date range
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new AppError('Start date cannot be after end date', 400);
      }

      // Validate limit
      const maxLimit = 100;
      if (limit > maxLimit) {
        throw new AppError(`Limit cannot exceed ${maxLimit} records per request`, 400);
      }

      // Build filters
      const filters = {
        userId: userId ? parseInt(userId) : undefined,
        universityId: universityId ? parseInt(universityId) : undefined,
        action,
        entityType,
        entityId: entityId ? parseInt(entityId) : undefined,
        status,
        tenantId: req.user.tenant_id,
        startDate,
        endDate
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

  /**
   * Get audit logs with filtering and pagination
   * GET /api/audit/logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        universityId,
        action,
        entityType,
        entityId,
        status,
        startDate,
        endDate
      } = req.query;

      // Validate date range
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new AppError('Start date cannot be after end date', 400);
      }

      // Validate limit
      const maxLimit = 100;
      if (limit > maxLimit) {
        throw new AppError(`Limit cannot exceed ${maxLimit} records per request`, 400);
      }

      // Build filters
      const filters = {
        userId: userId ? parseInt(userId) : undefined,
        universityId: universityId ? parseInt(universityId) : undefined,
        action,
        entityType,
        entityId: entityId ? parseInt(entityId) : undefined,
        status,
        tenantId: req.user.tenant_id,
        startDate,
        endDate
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const pagination = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100) // Max 100 per page
      };

      const result = await this.auditService.getAuditLogs(filters, pagination);

      res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Get audit statistics
   * GET /api/audit/stats
   */
  async getAuditStats(req, res, next) {
    try {
      const { universityId, startDate, endDate } = req.query;

      // Validate date range
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new AppError('Start date cannot be after end date', 400);
      }

      const filters = {
        tenantId: req.user.tenant_id,
        universityId: universityId ? parseInt(universityId) : undefined,
        startDate,
        endDate
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const stats = await this.auditService.getAuditStats(filters);

      res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Get user activity
   * GET /api/audit/user-activity/:userId
   */
  async getUserActivity(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 20 } = req.query;

      // Check if user has permission to view this activity
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.id != userId) {
        throw new AppError('Access denied: Can only view your own activity', 403);
      }

      const activity = await this.auditService.getUserActivity(
        parseInt(userId),
        parseInt(limit)
      );

      res.status(200).json({
        status: 'success',
        data: activity
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Get audit log details
   * GET /api/audit/logs/:id
   */
  async getAuditLogDetails(req, res, next) {
    try {
      const { id } = req.params;

      const filters = {
        id: parseInt(id),
        tenantId: req.user.tenant_id
      };

      const result = await this.auditService.getAuditLogs(filters, { page: 1, limit: 1 });

      if (result.data.length === 0) {
        throw new AppError('Audit log not found', 404);
      }

      res.status(200).json({
        status: 'success',
        data: result.data[0]
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export audit logs
   * GET /api/audit/export
   */
  async exportAuditLogs(req, res, next) {
    try {
      const {
        format = 'json',
        userId,
        universityId,
        action,
        entityType,
        startDate,
        endDate
      } = req.query;

      // Build filters
      const filters = {
        userId: userId ? parseInt(userId) : undefined,
        universityId: universityId ? parseInt(universityId) : undefined,
        action,
        entityType,
        tenantId: req.user.tenant_id,
        startDate,
        endDate
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      // Get all matching logs (no pagination for export)
      const result = await this.auditService.getAuditLogs(filters, { page: 1, limit: 10000 });

      if (format === 'csv') {
        const csvData = this.convertToCSV(result.data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
        res.send(csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
        res.send(JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Convert audit logs to CSV format
   */
  convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = [
      'ID', 'User Email', 'User Name', 'University', 'Action', 'Entity Type',
      'Entity ID', 'Entity Name', 'Status', 'IP Address', 'Created At'
    ];

    const rows = data.map(log => [
      log.id,
      log.user_email || '',
      `${log.user_first_name || ''} ${log.user_last_name || ''}`.trim(),
      log.university_name || '',
      log.action,
      log.entity_type,
      log.entity_id || '',
      log.entity_name || '',
      log.status,
      log.ip_address || '',
      log.created_at
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

module.exports = AuditController;