const billingService = require('../services/billingService');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class BillingController {
  async createBillingRecord(req, res) {
    try {
      const { universityId, subscriptionId } = req.params;
      const tenantId = req.tenantId;
      const userId = req.user.id;

      const billingRecord = await billingService.createBillingRecord(
        parseInt(universityId),
        parseInt(subscriptionId),
        tenantId,
        userId
      );

      sendSuccess(res, 'Billing record created successfully', billingRecord, 201);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to create billing record', 500);
      }
    }
  }

  async getUniversityBillingRecords(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenantId;
      const { status, limit = 50, offset = 0 } = req.query;

      const options = {
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const billingRecords = await billingService.getUniversityBillingRecords(
        parseInt(universityId),
        tenantId,
        options
      );

      sendSuccess(res, 'Billing records retrieved successfully', {
        billing_records: billingRecords,
        pagination: {
          limit: options.limit,
          offset: options.offset
        }
      });
    } catch (error) {
      sendError(res, 'Failed to retrieve billing records', 500);
    }
  }

  async getPendingPayments(req, res) {
    try {
      const tenantId = req.tenantId;
      const { daysUntilDue = 30 } = req.query;

      const pendingPayments = await billingService.getPendingPayments(
        tenantId,
        parseInt(daysUntilDue)
      );

      sendSuccess(res, 'Pending payments retrieved successfully', {
        pending_payments: pendingPayments,
        days_until_due: parseInt(daysUntilDue)
      });
    } catch (error) {
      sendError(res, 'Failed to retrieve pending payments', 500);
    }
  }

  async getOverduePayments(req, res) {
    try {
      const tenantId = req.tenantId;

      const overduePayments = await billingService.getOverduePayments(tenantId);

      sendSuccess(res, 'Overdue payments retrieved successfully', {
        overdue_payments: overduePayments
      });
    } catch (error) {
      sendError(res, 'Failed to retrieve overdue payments', 500);
    }
  }

  async updateBillingStatus(req, res) {
    try {
      const { billingRecordId } = req.params;
      const { status } = req.body;
      const tenantId = req.tenantId;

      if (!status) {
        return sendError(res, 'Status is required', 400);
      }

      const billingRecord = await billingService.updateBillingStatus(
        parseInt(billingRecordId),
        status,
        tenantId
      );

      sendSuccess(res, 'Billing status updated successfully', billingRecord);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to update billing status', 500);
      }
    }
  }

  async getBillingStats(req, res) {
    try {
      const tenantId = req.tenantId;

      const stats = await billingService.getBillingStats(tenantId);

      sendSuccess(res, 'Billing statistics retrieved successfully', stats);
    } catch (error) {
      sendError(res, 'Failed to retrieve billing statistics', 500);
    }
  }

  async generateMonthlyBilling(req, res) {
    try {
      const tenantId = req.tenantId;

      const billingRecords = await billingService.generateMonthlyBilling(tenantId);

      sendSuccess(res, 'Monthly billing generated successfully', {
        generated_billing_records: billingRecords,
        count: billingRecords.length
      });
    } catch (error) {
      sendError(res, 'Failed to generate monthly billing', 500);
    }
  }
}

module.exports = new BillingController();