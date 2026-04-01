const billingRecordRepository = require('../repositories/billingRecordRepository');
const universitySubscriptionRepository = require('../repositories/universitySubscriptionRepository');
const subscriptionPlanRepository = require('../repositories/subscriptionPlanRepository');
const { ValidationError, NotFoundError } = require('../utils/errors');

class BillingService {
  async createBillingRecord(universityId, subscriptionId, tenantId, userId) {
    // Verify subscription exists and is active
    const subscription = await universitySubscriptionRepository.findById(subscriptionId, tenantId);
    if (!subscription) {
      throw new NotFoundError('Subscription not found');
    }

    if (subscription.university_id !== universityId) {
      throw new ValidationError('Subscription does not belong to this university');
    }

    // Get subscription plan details
    const plan = await subscriptionPlanRepository.findById(subscription.subscription_plan_id, tenantId);
    if (!plan) {
      throw new NotFoundError('Subscription plan not found');
    }

    // Calculate billing period
    const billingPeriodStart = new Date(subscription.start_date);
    const billingPeriodEnd = new Date(subscription.end_date);

    // Set due date (30 days from now by default)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const billingData = {
      university_id: universityId,
      subscription_id: subscriptionId,
      amount: plan.price,
      currency: 'USD',
      billing_period_start: billingPeriodStart.toISOString().split('T')[0],
      billing_period_end: billingPeriodEnd.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      description: `Subscription billing for ${plan.name} plan (${plan.duration_months} months)`
    };

    return await billingRecordRepository.createBillingRecord(billingData, tenantId);
  }

  async getUniversityBillingRecords(universityId, tenantId, options = {}) {
    return await billingRecordRepository.findByUniversity(universityId, tenantId, options);
  }

  async getPendingPayments(tenantId, daysUntilDue = 30) {
    return await billingRecordRepository.findPendingPayments(tenantId, daysUntilDue);
  }

  async getOverduePayments(tenantId) {
    return await billingRecordRepository.findOverduePayments(tenantId);
  }

  async updateBillingStatus(billingRecordId, status, tenantId) {
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid billing status');
    }

    const billingRecord = await billingRecordRepository.updateStatus(billingRecordId, status, tenantId);
    if (!billingRecord) {
      throw new NotFoundError('Billing record not found');
    }

    return billingRecord;
  }

  async getBillingStats(tenantId) {
    return await billingRecordRepository.getBillingStats(tenantId);
  }

  async generateMonthlyBilling(tenantId) {
    // Find all active subscriptions that need billing
    const activeSubscriptions = await universitySubscriptionRepository.findAll({
      tenant_id: tenantId,
      status: 'active'
    });

    const billingRecords = [];

    for (const subscription of activeSubscriptions) {
      // Check if billing record already exists for current period
      const existingBilling = await billingRecordRepository.findAll({
        university_id: subscription.university_id,
        subscription_id: subscription.id,
        billing_period_start: subscription.start_date,
        billing_period_end: subscription.end_date
      });

      if (existingBilling.length === 0) {
        try {
          const billingRecord = await this.createBillingRecord(
            subscription.university_id,
            subscription.id,
            tenantId
          );
          billingRecords.push(billingRecord);
        } catch (error) {
          console.error(`Failed to create billing record for subscription ${subscription.id}:`, error);
        }
      }
    }

    return billingRecords;
  }
}

module.exports = new BillingService();