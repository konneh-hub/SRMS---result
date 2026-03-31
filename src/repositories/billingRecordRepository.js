const BaseRepository = require('./baseRepository');
const db = require('../config/database');

class BillingRecordRepository extends BaseRepository {
  constructor() {
    super('billing_records');
    this.db = db;
  }

  async findByUniversity(universityId, tenantId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    let query = `
      SELECT br.*, u.name as university_name, us.start_date as subscription_start, us.end_date as subscription_end
      FROM ${this.tableName} br
      JOIN universities u ON br.university_id = u.id
      LEFT JOIN university_subscriptions us ON br.subscription_id = us.id
      WHERE br.university_id = $1 AND br.tenant_id = $2
    `;
    const params = [universityId, tenantId];
    let paramIndex = 3;

    if (status) {
      query += ` AND br.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY br.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params, tenantId);
    return result.rows;
  }

  async findPendingPayments(tenantId, daysUntilDue = 30) {
    const query = `
      SELECT br.*, u.name as university_name
      FROM ${this.tableName} br
      JOIN universities u ON br.university_id = u.id
      WHERE br.tenant_id = $1 AND br.status = 'pending'
      AND br.due_date <= CURRENT_DATE + INTERVAL '${daysUntilDue} days'
      ORDER BY br.due_date ASC
    `;
    const result = await this.db.query(query, [tenantId], tenantId);
    return result.rows;
  }

  async findOverduePayments(tenantId) {
    const query = `
      SELECT br.*, u.name as university_name
      FROM ${this.tableName} br
      JOIN universities u ON br.university_id = u.id
      WHERE br.tenant_id = $1 AND br.status = 'pending'
      AND br.due_date < CURRENT_DATE
      ORDER BY br.due_date ASC
    `;
    const result = await this.db.query(query, [tenantId], tenantId);
    return result.rows;
  }

  async updateStatus(id, status, tenantId) {
    const query = `UPDATE ${this.tableName} SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *`;
    const result = await this.db.query(query, [status, id, tenantId], tenantId);
    return result.rows[0] || null;
  }

  async getBillingStats(tenantId) {
    const query = `
      SELECT
        COUNT(*) as total_bills,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_bills,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bills,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_bills,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
        AVG(amount) as average_bill_amount
      FROM ${this.tableName}
      WHERE tenant_id = $1
    `;
    const result = await this.db.query(query, [tenantId], tenantId);
    return result.rows[0];
  }

  async createBillingRecord(data, tenantId) {
    const { university_id, subscription_id, amount, currency = 'USD', billing_period_start, billing_period_end, due_date, description } = data;

    const query = `
      INSERT INTO ${this.tableName} (university_id, subscription_id, amount, currency, billing_period_start, billing_period_end, due_date, description, tenant_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      university_id, subscription_id, amount, currency,
      billing_period_start, billing_period_end, due_date, description, tenantId
    ], tenantId);

    return result.rows[0];
  }
}

module.exports = new BillingRecordRepository();