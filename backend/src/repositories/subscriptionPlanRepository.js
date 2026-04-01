const BaseRepository = require('./baseRepository');
const db = require('../config/database');

class SubscriptionPlanRepository extends BaseRepository {
  constructor() {
    super('subscription_plans');
    this.db = db;
  }

  async findByName(name, tenantId) {
    const query = `SELECT * FROM ${this.tableName} WHERE name = $1 AND tenant_id = $2`;
    const result = await this.db.query(query, [name, tenantId], tenantId);
    return result.rows[0] || null;
  }

  async findActivePlans(tenantId) {
    const query = `SELECT * FROM ${this.tableName} WHERE is_active = true AND tenant_id = $1 ORDER BY created_at DESC`;
    const result = await this.db.query(query, [tenantId], tenantId);
    return result.rows;
  }

  async updateStatus(id, isActive, tenantId) {
    const query = `UPDATE ${this.tableName} SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *`;
    const result = await this.db.query(query, [isActive, id, tenantId], tenantId);
    return result.rows[0] || null;
  }
}

module.exports = new SubscriptionPlanRepository();