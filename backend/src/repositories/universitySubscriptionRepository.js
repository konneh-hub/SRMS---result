const BaseRepository = require('./baseRepository');
const db = require('../config/database');

class UniversitySubscriptionRepository extends BaseRepository {
  constructor() {
    super('university_subscriptions');
    this.db = db;
  }

  async findByUniversity(universityId, tenantId) {
    const query = `
      SELECT us.*, sp.name as plan_name, sp.price, sp.duration_months, sp.max_students, sp.max_staff, sp.features
      FROM ${this.tableName} us
      JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
      WHERE us.university_id = $1 AND us.tenant_id = $2
      ORDER BY us.created_at DESC
    `;
    const result = await this.db.query(query, [universityId, tenantId], tenantId);
    return result.rows;
  }

  async findActiveByUniversity(universityId, tenantId) {
    const query = `
      SELECT us.*, sp.name as plan_name, sp.price, sp.duration_months, sp.max_students, sp.max_staff, sp.features
      FROM ${this.tableName} us
      JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
      WHERE us.university_id = $1 AND us.tenant_id = $2 AND us.status = 'active' AND us.end_date >= CURRENT_DATE
      ORDER BY us.end_date DESC
      LIMIT 1
    `;
    const result = await this.db.query(query, [universityId, tenantId], tenantId);
    return result.rows[0] || null;
  }

  async findExpiringSoon(tenantId, days = 30) {
    const query = `
      SELECT us.*, u.name as university_name, sp.name as plan_name
      FROM ${this.tableName} us
      JOIN universities u ON us.university_id = u.id
      JOIN subscription_plans sp ON us.subscription_plan_id = sp.id
      WHERE us.tenant_id = $1 AND us.status = 'active'
      AND us.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
      ORDER BY us.end_date ASC
    `;
    const result = await this.db.query(query, [tenantId], tenantId);
    return result.rows;
  }

  async updateStatus(id, status, tenantId) {
    const query = `UPDATE ${this.tableName} SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *`;
    const result = await this.db.query(query, [status, id, tenantId], tenantId);
    return result.rows[0] || null;
  }

  async renewSubscription(id, newEndDate, tenantId) {
    const query = `UPDATE ${this.tableName} SET end_date = $1, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *`;
    const result = await this.db.query(query, [newEndDate, id, tenantId], tenantId);
    return result.rows[0] || null;
  }

  async updatePaymentStatus(id, paymentStatus, tenantId) {
    const query = `UPDATE ${this.tableName} SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *`;
    const result = await this.db.query(query, [paymentStatus, id, tenantId], tenantId);
    return result.rows[0] || null;
  }

  async getSubscriptionStats(tenantId) {
    const query = `
      SELECT
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' AND end_date >= CURRENT_DATE THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_subscriptions,
        COUNT(CASE WHEN end_date < CURRENT_DATE + INTERVAL '30 days' AND status = 'active' THEN 1 END) as expiring_soon
      FROM ${this.tableName}
      WHERE tenant_id = $1
    `;
    const result = await this.db.query(query, [tenantId], tenantId);
    return result.rows[0];
  }
}

module.exports = new UniversitySubscriptionRepository();