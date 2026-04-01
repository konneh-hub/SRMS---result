const paymentService = require('../services/paymentService');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class PaymentController {
  async processPayment(req, res) {
    try {
      const { billingRecordId } = req.params;
      const { amount, payment_method, transaction_id, notes } = req.body;
      const tenantId = req.tenantId;

      if (!amount || !payment_method) {
        return sendError(res, 'Amount and payment method are required', 400);
      }

      const result = await paymentService.processPayment(
        parseInt(billingRecordId),
        { amount, payment_method, transaction_id, notes },
        tenantId
      );

      sendSuccess(res, 'Payment processed successfully', result);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to process payment', 500);
      }
    }
  }

  async getUniversityPayments(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenantId;
      const { status, limit = 50, offset = 0 } = req.query;

      const options = {
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const payments = await paymentService.getUniversityPayments(
        parseInt(universityId),
        tenantId,
        options
      );

      sendSuccess(res, 'University payments retrieved successfully', {
        payments,
        pagination: {
          limit: options.limit,
          offset: options.offset
        }
      });
    } catch (error) {
      sendError(res, 'Failed to retrieve university payments', 500);
    }
  }

  async getBillingPayments(req, res) {
    try {
      const { billingRecordId } = req.params;
      const tenantId = req.tenantId;

      const payments = await paymentService.getBillingPayments(
        parseInt(billingRecordId),
        tenantId
      );

      sendSuccess(res, 'Billing payments retrieved successfully', {
        billing_record_id: parseInt(billingRecordId),
        payments
      });
    } catch (error) {
      sendError(res, 'Failed to retrieve billing payments', 500);
    }
  }

  async refundPayment(req, res) {
    try {
      const { paymentRecordId } = req.params;
      const { refund_amount, reason } = req.body;
      const tenantId = req.tenantId;

      if (!refund_amount || !reason) {
        return sendError(res, 'Refund amount and reason are required', 400);
      }

      const refundRecord = await paymentService.refundPayment(
        parseInt(paymentRecordId),
        refund_amount,
        reason,
        tenantId
      );

      sendSuccess(res, 'Payment refunded successfully', refundRecord);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to process refund', 500);
      }
    }
  }

  async updatePaymentStatus(req, res) {
    try {
      const { paymentRecordId } = req.params;
      const { status } = req.body;
      const tenantId = req.tenantId;

      if (!status) {
        return sendError(res, 'Status is required', 400);
      }

      const paymentRecord = await paymentService.updatePaymentStatus(
        parseInt(paymentRecordId),
        status,
        tenantId
      );

      sendSuccess(res, 'Payment status updated successfully', paymentRecord);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to update payment status', 500);
      }
    }
  }

  async getPaymentStats(req, res) {
    try {
      const tenantId = req.tenantId;
      const { start_date, end_date } = req.query;

      const dateRange = {};
      if (start_date) dateRange.startDate = start_date;
      if (end_date) dateRange.endDate = end_date;

      const stats = await paymentService.getPaymentStats(tenantId, dateRange);

      sendSuccess(res, 'Payment statistics retrieved successfully', {
        stats,
        date_range: dateRange
      });
    } catch (error) {
      sendError(res, 'Failed to retrieve payment statistics', 500);
    }
  }

  async processSubscriptionPayment(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { amount, payment_method, transaction_id, notes } = req.body;
      const tenantId = req.tenantId;

      if (!amount || !payment_method) {
        return sendError(res, 'Amount and payment method are required', 400);
      }

      const result = await paymentService.processSubscriptionPayment(
        parseInt(subscriptionId),
        { amount, payment_method, transaction_id, notes },
        tenantId
      );

      sendSuccess(res, 'Subscription payment processed successfully', result);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        sendError(res, error.message, error.statusCode);
      } else {
        sendError(res, 'Failed to process subscription payment', 500);
      }
    }
  }
}

module.exports = new PaymentController();