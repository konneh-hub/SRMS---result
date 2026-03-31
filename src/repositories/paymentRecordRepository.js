const BaseRepository = require('./baseRepository');
const db = require('../config/database');

class PaymentRecordRepository extends BaseRepository {
  constructor() {
    super('payment_records');
    this.db = db;
  }

  async findByBillingRecord(billingRecordId, tenantId) {
    const query = `
      SELECT pr.*, br.amount as billed_amount, br.currency as billed_currency, u.name as university_name
      FROM ${this.tableName} pr
      JOIN billing_records br ON pr.billing_record_id = br.id
      JOIN universities u ON pr.university_id = u.id
      WHERE pr.billing_record_id = $1 AND pr.tenant_id = $2
      ORDER BY pr.payment_date DESC
    `;
    const result = await this.db.query(query, [billingRecordId, tenantId], tenantId);
    return result.rows;
  }

  async findByUniversity(universityId, tenantId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    let query = `
      SELECT pr.*, br.amount as billed_amount, br.billing_period_start, br.billing_period_end, u.name as university_name
      FROM ${this.tableName} pr
      JOIN billing_records br ON pr.billing_record_id = br.id
      JOIN universities u ON pr.university_id = u.id
      WHERE pr.university_id = $1 AND pr.tenant_id = $2
    `;
    const params = [universityId, tenantId];
    let paramIndex = 3;

    if (status) {
      query += ` AND pr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY pr.payment_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params, tenantId);
    return result.rows;
  }

  async createPaymentRecord(data, tenantId) {
    const { billing_record_id, university_id, amount, currency = 'USD', payment_method, transaction_id, status = 'completed', notes } = data;

    const query = `
      INSERT INTO ${this.tableName} (billing_record_id, university_id, amount, currency, payment_method, transaction_id, status, notes, tenant_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      billing_record_id, university_id, amount, currency,
      payment_method, transaction_id, status, notes, tenantId
    ], tenantId);

    return result.rows[0];
  }

  async updatePaymentStatus(id, status, tenantId) {
    const query = `UPDATE ${this.tableName} SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *`;
    const result = await this.db.query(query, [status, id, tenantId], tenantId);
    return result.rows[0] || null;
  }

  async getPaymentStats(tenantId, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    let query = `
      SELECT
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount_received,
        AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_payment_amount
      FROM ${this.tableName}
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND payment_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND payment_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await this.db.query(query, params, tenantId);
    return result.rows[0];
  }

  async findByTransactionId(transactionId, tenantId) {
    const query = `SELECT * FROM ${this.tableName} WHERE transaction_id = $1 AND tenant_id = $2`;
    const result = await this.db.query(query, [transactionId, tenantId], tenantId);
    return result.rows[0] || null;
  }
}

module.exports = new PaymentRecordRepository();