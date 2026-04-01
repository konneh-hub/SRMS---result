const BaseRepository = require('./baseRepository');

class ResultSubmissionRepository extends BaseRepository {
    constructor() {
        super('result_submissions');
    }

    async findByCourseSemesterYear(courseId, semester, academicYear) {
        const query = `
            SELECT rs.*, c.name as course_name, c.code as course_code,
                   u.first_name as lecturer_first_name, u.last_name as lecturer_last_name, u.email as lecturer_email,
                   univ.name as university_name, d.name as department_name
            FROM ${this.tableName} rs
            LEFT JOIN courses c ON rs.course_id = c.id
            LEFT JOIN users u ON rs.lecturer_id = u.id
            LEFT JOIN universities univ ON rs.university_id = univ.id
            LEFT JOIN departments d ON rs.department_id = d.id
            WHERE rs.course_id = $1 AND rs.semester = $2 AND rs.academic_year = $3
            LIMIT 1
        `;
        const result = await this.db.query(query, [courseId, semester, academicYear]);
        return result.rows[0];
    }

    async findByLecturer(lecturerId, options = {}) {
        const { semester, academicYear, status, limit, offset, orderBy = 'created_at', orderDirection = 'DESC' } = options;

        let query = `
            SELECT rs.*, c.name as course_name, c.code as course_code,
                   univ.name as university_name, d.name as department_name
            FROM ${this.tableName} rs
            LEFT JOIN courses c ON rs.course_id = c.id
            LEFT JOIN universities univ ON rs.university_id = univ.id
            LEFT JOIN departments d ON rs.department_id = d.id
            WHERE rs.lecturer_id = $1
        `;

        const params = [lecturerId];
        let paramIndex = 2;

        if (semester) {
            query += ` AND rs.semester = $${paramIndex}`;
            params.push(semester);
            paramIndex++;
        }

        if (academicYear) {
            query += ` AND rs.academic_year = $${paramIndex}`;
            params.push(academicYear);
            paramIndex++;
        }

        if (status) {
            query += ` AND rs.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (orderBy) {
            query += ` ORDER BY rs.${orderBy} ${orderDirection}`;
        }

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(limit);
            paramIndex++;
        }

        if (offset) {
            query += ` OFFSET $${paramIndex}`;
            params.push(offset);
        }

        const result = await this.db.query(query, params);
        return result.rows;
    }

    async findByUniversitySemester(universityId, semester, academicYear, options = {}) {
        const { department, status, limit, offset } = options;

        let query = `
            SELECT rs.*, c.name as course_name, c.code as course_code,
                   u.first_name as lecturer_first_name, u.last_name as lecturer_last_name,
                   d.name as department_name
            FROM ${this.tableName} rs
            LEFT JOIN courses c ON rs.course_id = c.id
            LEFT JOIN users u ON rs.lecturer_id = u.id
            LEFT JOIN departments d ON rs.department_id = d.id
            WHERE rs.university_id = $1 AND rs.semester = $2 AND rs.academic_year = $3
        `;

        const params = [universityId, semester, academicYear];
        let paramIndex = 4;

        if (department) {
            query += ` AND rs.department_id = $${paramIndex}`;
            params.push(department);
            paramIndex++;
        }

        if (status) {
            query += ` AND rs.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY rs.updated_at DESC`;

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(limit);
            paramIndex++;
        }

        if (offset) {
            query += ` OFFSET $${paramIndex}`;
            params.push(offset);
        }

        const result = await this.db.query(query, params);
        return result.rows;
    }

    async findByStatus(status, universityId = null, options = {}) {
        const { limit, offset, orderBy = 'updated_at', orderDirection = 'DESC' } = options;

        let query = `
            SELECT rs.*, c.name as course_name, u.first_name as lecturer_first_name,
                   u.last_name as lecturer_last_name
            FROM ${this.tableName} rs
            LEFT JOIN courses c ON rs.course_id = c.id
            LEFT JOIN users u ON rs.lecturer_id = u.id
            WHERE rs.status = $1
        `;

        const params = [status];
        let paramIndex = 2;

        if (universityId) {
            query += ` AND rs.university_id = $${paramIndex}`;
            params.push(universityId);
            paramIndex++;
        }

        if (orderBy) {
            query += ` ORDER BY rs.${orderBy} ${orderDirection}`;
        }

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(limit);
            paramIndex++;
        }

        if (offset) {
            query += ` OFFSET $${paramIndex}`;
            params.push(offset);
        }

        const result = await this.db.query(query, params);
        return result.rows;
    }

    async countByStatus(status, universityId = null) {
        let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = $1`;
        const params = [status];

        if (universityId) {
            query += ` AND university_id = $2`;
            params.push(universityId);
        }

        const result = await this.db.query(query, params);
        return parseInt(result.rows[0].count);
    }

    async findById(id) {
        const query = `
            SELECT rs.*, c.name as course_name, c.code as course_code,
                   u.first_name as lecturer_first_name, u.last_name as lecturer_last_name, u.email as lecturer_email,
                   univ.name as university_name, d.name as department_name
            FROM ${this.tableName} rs
            LEFT JOIN courses c ON rs.course_id = c.id
            LEFT JOIN users u ON rs.lecturer_id = u.id
            LEFT JOIN universities univ ON rs.university_id = univ.id
            LEFT JOIN departments d ON rs.department_id = d.id
            WHERE rs.id = $1
        `;
        const result = await this.db.query(query, [id]);
        return result.rows[0];
    }

    async create(data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

        const query = `
            INSERT INTO ${this.tableName} (${keys.join(', ')})
            VALUES (${placeholders})
            RETURNING *
        `;

        const result = await this.db.query(query, values);
        return result.rows[0];
    }

    async update(id, data) {
        const keys = Object.keys(data);
        const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
        const values = Object.values(data);

        const query = `
            UPDATE ${this.tableName}
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${keys.length + 1}
            RETURNING *
        `;

        const result = await this.db.query(query, [...values, id]);
        return result.rows[0];
    }

    async updateStatus(id, status, additionalData = {}) {
        const updates = { status, ...additionalData };
        return this.update(id, updates);
    }

    async delete(id) {
        const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
        const result = await this.db.query(query, [id]);
        return result.rows[0];
    }

    async incrementDownloadCount(id) {
        const query = `
            UPDATE ${this.tableName}
            SET download_count = download_count + 1,
                last_downloaded_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await this.db.query(query, [id]);
        return result.rows[0];
    }

    async getSubmissionStats(universityId, semester, academicYear) {
        const query = `
            SELECT 
                COUNT(*) as total_submissions,
                COUNT(CASE WHEN status = 'submitted' THEN 1 END) as awaiting_approval,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
                SUM(total_students) as total_students_processed
            FROM ${this.tableName}
            WHERE university_id = $1 AND semester = $2 AND academic_year = $3
        `;
        const result = await this.db.query(query, [universityId, semester, academicYear]);
        return result.rows[0];
    }
}

module.exports = new ResultSubmissionRepository();
