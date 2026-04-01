const universitySubscriptionRepository = require('../repositories/universitySubscriptionRepository');
const subscriptionPlanRepository = require('../repositories/subscriptionPlanRepository');
const universityRepository = require('../repositories/universityRepository');

class UniversitySubscriptionService {
  async getAllSubscriptions(tenantId, options = {}) {
    try {
      const subscriptions = await universitySubscriptionRepository.findAll(tenantId, null, options);
      return {
        success: true,
        data: subscriptions,
        count: subscriptions.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }
  }

  async getUniversitySubscriptions(universityId, tenantId) {
    try {
      if (!universityId || isNaN(universityId)) {
        throw new Error('Invalid university ID');
      }

      const subscriptions = await universitySubscriptionRepository.findByUniversity(universityId, tenantId);
      return {
        success: true,
        data: subscriptions,
        count: subscriptions.length
      };
    } catch (error) {
      throw error;
    }
  }

  async getActiveSubscription(universityId, tenantId) {
    try {
      if (!universityId || isNaN(universityId)) {
        throw new Error('Invalid university ID');
      }

      const subscription = await universitySubscriptionRepository.findActiveByUniversity(universityId, tenantId);
      return {
        success: true,
        data: subscription
      };
    } catch (error) {
      throw error;
    }
  }

  async createSubscription(subscriptionData, tenantId) {
    try {
      // Validate required fields
      if (!subscriptionData.university_id || isNaN(subscriptionData.university_id)) {
        throw new Error('Valid university ID is required');
      }
      if (!subscriptionData.subscription_plan_id || isNaN(subscriptionData.subscription_plan_id)) {
        throw new Error('Valid subscription plan ID is required');
      }
      if (!subscriptionData.start_date) {
        throw new Error('Start date is required');
      }

      // Check if university exists
      const university = await universityRepository.findById(subscriptionData.university_id, tenantId);
      if (!university) {
        throw new Error('University not found');
      }

      // Check if plan exists and is active
      const plan = await subscriptionPlanRepository.findById(subscriptionData.subscription_plan_id, tenantId);
      if (!plan || !plan.is_active) {
        throw new Error('Subscription plan not found or inactive');
      }

      // Check if university already has an active subscription
      const activeSubscription = await universitySubscriptionRepository.findActiveByUniversity(
        subscriptionData.university_id,
        tenantId
      );
      if (activeSubscription) {
        throw new Error('University already has an active subscription');
      }

      // Calculate end date
      const startDate = new Date(subscriptionData.start_date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + plan.duration_months);

      // Prepare data
      const data = {
        university_id: parseInt(subscriptionData.university_id),
        subscription_plan_id: parseInt(subscriptionData.subscription_plan_id),
        start_date: subscriptionData.start_date,
        end_date: endDate.toISOString().split('T')[0],
        status: subscriptionData.status || 'active',
        auto_renew: subscriptionData.auto_renew || false,
        payment_status: subscriptionData.payment_status || 'pending'
      };

      const subscription = await universitySubscriptionRepository.create(data, tenantId);
      return {
        success: true,
        data: subscription,
        message: 'University subscription created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateSubscription(id, subscriptionData, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid subscription ID');
      }

      // Check if subscription exists
      const existingSubscription = await universitySubscriptionRepository.findById(id, tenantId);
      if (!existingSubscription) {
        throw new Error('Subscription not found');
      }

      // Prepare update data
      const data = {};
      if (subscriptionData.status !== undefined) {
        data.status = subscriptionData.status;
      }
      if (subscriptionData.auto_renew !== undefined) {
        data.auto_renew = subscriptionData.auto_renew;
      }
      if (subscriptionData.payment_status !== undefined) {
        data.payment_status = subscriptionData.payment_status;
      }

      const subscription = await universitySubscriptionRepository.update(id, data, tenantId);
      return {
        success: true,
        data: subscription,
        message: 'Subscription updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async renewSubscription(id, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid subscription ID');
      }

      // Get current subscription
      const subscription = await universitySubscriptionRepository.findById(id, tenantId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get plan details
      const plan = await subscriptionPlanRepository.findById(subscription.subscription_plan_id, tenantId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Calculate new end date
      const currentEndDate = new Date(subscription.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + plan.duration_months);

      const updatedSubscription = await universitySubscriptionRepository.renewSubscription(
        id,
        newEndDate.toISOString().split('T')[0],
        tenantId
      );

      return {
        success: true,
        data: updatedSubscription,
        message: 'Subscription renewed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async cancelSubscription(id, tenantId) {
    try {
      const subscription = await universitySubscriptionRepository.updateStatus(id, 'cancelled', tenantId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      return {
        success: true,
        data: subscription,
        message: 'Subscription cancelled successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getExpiringSubscriptions(tenantId, days = 30) {
    try {
      const subscriptions = await universitySubscriptionRepository.findExpiringSoon(tenantId, days);
      return {
        success: true,
        data: subscriptions,
        count: subscriptions.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch expiring subscriptions: ${error.message}`);
    }
  }

  async getSubscriptionStats(tenantId) {
    try {
      const stats = await universitySubscriptionRepository.getSubscriptionStats(tenantId);
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new Error(`Failed to fetch subscription stats: ${error.message}`);
    }
  }
}

module.exports = new UniversitySubscriptionService();