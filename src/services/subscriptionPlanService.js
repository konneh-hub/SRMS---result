const subscriptionPlanRepository = require('../repositories/subscriptionPlanRepository');
const { sanitizeInput } = require('../utils/helpers');

class SubscriptionPlanService {
  async getAllPlans(tenantId, options = {}) {
    try {
      const plans = await subscriptionPlanRepository.findAll(tenantId, null, options);
      return {
        success: true,
        data: plans,
        count: plans.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch subscription plans: ${error.message}`);
    }
  }

  async getActivePlans(tenantId) {
    try {
      const plans = await subscriptionPlanRepository.findActivePlans(tenantId);
      return {
        success: true,
        data: plans,
        count: plans.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch active plans: ${error.message}`);
    }
  }

  async getPlanById(id, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid plan ID');
      }

      const plan = await subscriptionPlanRepository.findById(id, tenantId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      return {
        success: true,
        data: plan
      };
    } catch (error) {
      throw error;
    }
  }

  async createPlan(planData, tenantId) {
    try {
      // Validate required fields
      if (!planData.name || !planData.name.trim()) {
        throw new Error('Plan name is required');
      }
      if (!planData.price || isNaN(planData.price) || planData.price < 0) {
        throw new Error('Valid price is required');
      }
      if (!planData.duration_months || isNaN(planData.duration_months) || planData.duration_months <= 0) {
        throw new Error('Valid duration in months is required');
      }

      // Check for duplicate name
      const existingPlan = await subscriptionPlanRepository.findByName(
        planData.name.trim(),
        tenantId
      );
      if (existingPlan) {
        throw new Error('A plan with this name already exists');
      }

      // Sanitize and prepare data
      const data = {
        name: sanitizeInput(planData.name),
        description: planData.description ? sanitizeInput(planData.description) : null,
        price: parseFloat(planData.price),
        duration_months: parseInt(planData.duration_months),
        max_students: planData.max_students ? parseInt(planData.max_students) : null,
        max_staff: planData.max_staff ? parseInt(planData.max_staff) : null,
        features: planData.features || null,
        is_active: planData.is_active !== undefined ? planData.is_active : true
      };

      const plan = await subscriptionPlanRepository.create(data, tenantId);
      return {
        success: true,
        data: plan,
        message: 'Subscription plan created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePlan(id, planData, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid plan ID');
      }

      // Check if plan exists
      const existingPlan = await subscriptionPlanRepository.findById(id, tenantId);
      if (!existingPlan) {
        throw new Error('Subscription plan not found');
      }

      // Check for duplicate name if name is being updated
      if (planData.name && planData.name.trim() !== existingPlan.name) {
        const duplicatePlan = await subscriptionPlanRepository.findByName(
          planData.name.trim(),
          tenantId
        );
        if (duplicatePlan) {
          throw new Error('A plan with this name already exists');
        }
      }

      // Validate price and duration if provided
      if (planData.price !== undefined && (isNaN(planData.price) || planData.price < 0)) {
        throw new Error('Valid price is required');
      }
      if (planData.duration_months !== undefined && (isNaN(planData.duration_months) || planData.duration_months <= 0)) {
        throw new Error('Valid duration in months is required');
      }

      // Prepare update data
      const data = {};
      if (planData.name !== undefined) {
        data.name = sanitizeInput(planData.name);
      }
      if (planData.description !== undefined) {
        data.description = planData.description ? sanitizeInput(planData.description) : null;
      }
      if (planData.price !== undefined) {
        data.price = parseFloat(planData.price);
      }
      if (planData.duration_months !== undefined) {
        data.duration_months = parseInt(planData.duration_months);
      }
      if (planData.max_students !== undefined) {
        data.max_students = planData.max_students ? parseInt(planData.max_students) : null;
      }
      if (planData.max_staff !== undefined) {
        data.max_staff = planData.max_staff ? parseInt(planData.max_staff) : null;
      }
      if (planData.features !== undefined) {
        data.features = planData.features;
      }
      if (planData.is_active !== undefined) {
        data.is_active = planData.is_active;
      }

      const plan = await subscriptionPlanRepository.update(id, data, tenantId);
      return {
        success: true,
        data: plan,
        message: 'Subscription plan updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deletePlan(id, tenantId) {
    try {
      if (!id || isNaN(id)) {
        throw new Error('Invalid plan ID');
      }

      // Check if plan exists
      const plan = await subscriptionPlanRepository.findById(id, tenantId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      await subscriptionPlanRepository.delete(id, tenantId);
      return {
        success: true,
        message: 'Subscription plan deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async activatePlan(id, tenantId) {
    try {
      const plan = await subscriptionPlanRepository.updateStatus(id, true, tenantId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      return {
        success: true,
        data: plan,
        message: 'Subscription plan activated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deactivatePlan(id, tenantId) {
    try {
      const plan = await subscriptionPlanRepository.updateStatus(id, false, tenantId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      return {
        success: true,
        data: plan,
        message: 'Subscription plan deactivated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async checkStudentLimit(universityId, tenantId) {
    try {
      // Get active subscription for university
      const universitySubscriptionRepository = require('../repositories/universitySubscriptionRepository');
      const activeSubscription = await universitySubscriptionRepository.findActiveByUniversity(universityId, tenantId);

      if (!activeSubscription) {
        return {
          success: true,
          within_limit: false,
          message: 'No active subscription found',
          current_count: 0,
          limit: 0
        };
      }

      // Get current student count
      const studentRepository = require('../repositories/studentRepository');
      const studentCount = await studentRepository.countByUniversity(universityId, tenantId);

      const limit = activeSubscription.max_students;
      const withinLimit = limit === null || studentCount < limit;

      return {
        success: true,
        within_limit: withinLimit,
        current_count: studentCount,
        limit: limit,
        plan_name: activeSubscription.plan_name,
        message: withinLimit
          ? 'Within student limit'
          : `Student limit exceeded. Current: ${studentCount}, Limit: ${limit}`
      };
    } catch (error) {
      throw new Error(`Failed to check student limit: ${error.message}`);
    }
  }

  async checkStaffLimit(universityId, tenantId) {
    try {
      // Get active subscription for university
      const universitySubscriptionRepository = require('../repositories/universitySubscriptionRepository');
      const activeSubscription = await universitySubscriptionRepository.findActiveByUniversity(universityId, tenantId);

      if (!activeSubscription) {
        return {
          success: true,
          within_limit: false,
          message: 'No active subscription found',
          current_count: 0,
          limit: 0
        };
      }

      // Get current staff count (users with roles other than 'student')
      const userRepository = require('../repositories/userRepository');
      const staffCount = await userRepository.countStaffByUniversity(universityId, tenantId);

      const limit = activeSubscription.max_staff;
      const withinLimit = limit === null || staffCount < limit;

      return {
        success: true,
        within_limit: withinLimit,
        current_count: staffCount,
        limit: limit,
        plan_name: activeSubscription.plan_name,
        message: withinLimit
          ? 'Within staff limit'
          : `Staff limit exceeded. Current: ${staffCount}, Limit: ${limit}`
      };
    } catch (error) {
      throw new Error(`Failed to check staff limit: ${error.message}`);
    }
  }

  async validateLimits(universityId, tenantId) {
    try {
      const studentLimitCheck = await this.checkStudentLimit(universityId, tenantId);
      const staffLimitCheck = await this.checkStaffLimit(universityId, tenantId);

      const violations = [];
      if (!studentLimitCheck.within_limit) {
        violations.push({
          type: 'students',
          message: studentLimitCheck.message,
          current: studentLimitCheck.current_count,
          limit: studentLimitCheck.limit
        });
      }
      if (!staffLimitCheck.within_limit) {
        violations.push({
          type: 'staff',
          message: staffLimitCheck.message,
          current: staffLimitCheck.current_count,
          limit: staffLimitCheck.limit
        });
      }

      return {
        success: true,
        valid: violations.length === 0,
        violations: violations,
        student_check: studentLimitCheck,
        staff_check: staffLimitCheck
      };
    } catch (error) {
      throw new Error(`Failed to validate limits: ${error.message}`);
    }
  }
}

module.exports = new SubscriptionPlanService();