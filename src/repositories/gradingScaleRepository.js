const BaseRepository = require('./baseRepository');

class GradingScaleRepository extends BaseRepository {
    constructor() {
        super('grading_scales');
    }

    async findByUniversity(universityId, options = {}) {
        const { includeDetails = false, activeOnly = true } = options;

        let query = `
            SELECT gs.*,
                   u.name as university_name
            FROM ${this.tableName} gs
            LEFT JOIN universities u ON gs.university_id = u.id
            WHERE gs.university_id = $1
        `;

        const params = [universityId];
        let paramIndex = 2;

        if (activeOnly) {
            query += ` AND gs.is_active = true`;
        }

        query += ` ORDER BY gs.created_at DESC`;

        if (options.limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(options.limit);
            paramIndex++;
        }

        const result = await this.db.query(query, params);

        if (includeDetails) {
            // Fetch details for each grading scale
            for (const scale of result.rows) {
                scale.details = await this.getScaleDetails(scale.id);
            }
        }

        return result.rows;
    }

    async getScaleDetails(scaleId) {
        const query = `
            SELECT * FROM grading_scale_details
            WHERE grading_scale_id = $1
            ORDER BY min_score DESC
        `;
        const result = await this.db.query(query, [scaleId]);
        return result.rows;
    }

    async getActiveScaleForUniversity(universityId) {
        const scales = await this.findByUniversity(universityId, { activeOnly: true, includeDetails: true });
        return scales.length > 0 ? scales[0] : null;
    }

    async getGradeFromScore(scaleId, score) {
        const query = `
            SELECT * FROM grading_scale_details
            WHERE grading_scale_id = $1 AND $2 BETWEEN min_score AND max_score
            ORDER BY grade_point DESC
            LIMIT 1
        `;
        const result = await this.db.query(query, [scaleId, score]);
        return result.rows[0] || null;
    }

    async createWithDetails(scaleData, detailsData) {
        const client = await this.db.getClient();

        try {
            await client.query('BEGIN');

            // Create the grading scale
            const scale = await this.create(scaleData, client);

            // Create the details
            for (const detail of detailsData) {
                await client.query(`
                    INSERT INTO grading_scale_details (
                        grading_scale_id, grade, grade_point, min_score, max_score, description, tenant_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    scale.id,
                    detail.grade,
                    detail.gradePoint,
                    detail.minScore,
                    detail.maxScore,
                    detail.description,
                    scaleData.tenant_id
                ]);
            }

            await client.query('COMMIT');
            return scale;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new GradingScaleRepository();