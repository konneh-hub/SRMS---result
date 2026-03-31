const paymentRecordRepository = require('../repositories/paymentRecordRepository');
const billingRecordRepository = require('../repositories/billingRecordRepository');
const universitySubscriptionRepository = require('../repositories/universitySubscriptionRepository');
const { ValidationError, NotFoundError } = require('../utils/errors');

class PaymentService {
  async processPayment(billingRecordId, paymentData, tenantId) {
    const { amount, payment_method, transaction_id, notes } = paymentData;

    // Verify billing record exists
    const billingRecord = await billingRecordRepository.findById(billingRecordId, tenantId);
    if (!billingRecord) {
      throw new NotFoundError('Billing record not found');
    }

    if (billingRecord.status === 'paid') {
      throw new ValidationError('Billing record is already paid');
    }

    // Validate payment amount
    if (parseFloat(amount) !== parseFloat(billingRecord.amount)) {
      throw new ValidationError('Payment amount must match billing amount');
    }

    // Check for duplicate transaction ID
    if (transaction_id) {
      const existingPayment = await paymentRecordRepository.findByTransactionId(transaction_id, tenantId);
      if (existingPayment) {
        throw new ValidationError('Transaction ID already exists');
      }
    }

    // Create payment record
    const paymentRecordData = {
      billing_record_id: billingRecordId,
      university_id: billingRecord.university_id,
      amount: amount,
      currency: billingRecord.currency,
      payment_method: payment_method,
      transaction_id: transaction_id,
      status: 'completed',
      notes: notes
    };

    const paymentRecord = await paymentRecordRepository.createPaymentRecord(paymentRecordData, tenantId);

    // Update billing record status to paid
    await billingRecordRepository.updateStatus(billingRecordId, 'paid', tenantId);

    // Update subscription payment status if applicable
    if (billingRecord.subscription_id) {
      await universitySubscriptionRepository.updatePaymentStatus(billingRecord.subscription_id, 'paid', tenantId);
    }

    return {
      payment_record: paymentRecord,
      billing_record: await billingRecordRepository.findById(billingRecordId, tenantId)
    };
  }

  async getUniversityPayments(universityId, tenantId, options = {}) {
    return await paymentRecordRepository.findByUniversity(universityId, tenantId, options);
  }

  async getBillingPayments(billingRecordId, tenantId) {
    return await paymentRecordRepository.findByBillingRecord(billingRecordId, tenantId);
  }

  async refundPayment(paymentRecordId, refundAmount, reason, tenantId) {
    // Get payment record
    const paymentRecord = await paymentRecordRepository.findById(paymentRecordId, tenantId);
    if (!paymentRecord) {
      throw new NotFoundError('Payment record not found');
    }

    if (paymentRecord.status !== 'completed') {
      throw new ValidationError('Only completed payments can be refunded');
    }

    // Validate refund amount
    if (parseFloat(refundAmount) > parseFloat(paymentRecord.amount)) {
      throw new ValidationError('Refund amount cannot exceed payment amount');
    }

    // Create refund payment record
    const refundData = {
      billing_record_id: paymentRecord.billing_record_id,
      university_id: paymentRecord.university_id,
      amount: -parseFloat(refundAmount), // Negative amount for refund
      currency: paymentRecord.currency,
      payment_method: paymentRecord.payment_method,
      transaction_id: `REFUND-${paymentRecord.transaction_id}`,
      status: 'refunded',
      notes: `Refund: ${reason}`
    };

    const refundRecord = await paymentRecordRepository.createPaymentRecord(refundData, tenantId);

    // If full refund, update billing status
    if (parseFloat(refundAmount) === parseFloat(paymentRecord.amount)) {
      await billingRecordRepository.updateStatus(paymentRecord.billing_record_id, 'cancelled', tenantId);

      // Update subscription payment status if applicable
      const billingRecord = await billingRecordRepository.findById(paymentRecord.billing_record_id, tenantId);
      if (billingRecord.subscription_id) {
        await universitySubscriptionRepository.updatePaymentStatus(billingRecord.subscription_id, 'refunded', tenantId);
      }
    }

    return refundRecord;
  }

  async updatePaymentStatus(paymentRecordId, status, tenantId) {
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid payment status');
    }

    const paymentRecord = await paymentRecordRepository.updatePaymentStatus(paymentRecordId, status, tenantId);
    if (!paymentRecord) {
      throw new NotFoundError('Payment record not found');
    }

    return paymentRecord;
  }

  async getPaymentStats(tenantId, dateRange = {}) {
    return await paymentRecordRepository.getPaymentStats(tenantId, dateRange);
  }

  async processSubscriptionPayment(subscriptionId, paymentData, tenantId) {
    // Get subscription details
    const subscription = await universitySubscriptionRepository.findById(subscriptionId, tenantId);
    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    // Find or create billing record for this subscription
    let billingRecord = await billingRecordRepository.findAll({
      subscription_id: subscriptionId,
      status: 'pending'
    });

    if (billingRecord.length === 0) {
      // Create billing record if none exists
      billingRecord = await billingRecordRepository.createBillingRecord({
        university_id: subscription.university_id,
        subscription_id: subscriptionId,
        amount: subscription.price,
        billing_period_start: subscription.start_date,
        billing_period_end: subscription.end_date,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        description: `Subscription payment for ${subscription.plan_name}`
      }, tenantId);
    } else {
      billingRecord = billingRecord[0];
    }

    // Process payment
    return await this.processPayment(billingRecord.id, paymentData, tenantId);
  }
}

module.exports = new PaymentService();