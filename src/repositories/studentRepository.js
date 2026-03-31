const BaseRepository = require('./baseRepository');

class StudentRepository extends BaseRepository {
    constructor() {
        super('students');
    }

    async findByEmail(email) {
        const query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.email = $1
        `;
        const result = await this.db.query(query, [email.toLowerCase()]);
        return result.rows[0];
    }

    async findByStudentId(studentId) {
        const query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.student_id = $1
        `;
        const result = await this.db.query(query, [studentId]);
        return result.rows[0];
    }

    async findByUniversityId(universityId, options = {}) {
        const { limit, offset, orderBy = 'first_name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.university_id = $1
        `;

        const params = [universityId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY s.${orderBy} ${orderDirection}`;
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

    async findByFacultyId(facultyId, options = {}) {
        const { limit, offset, orderBy = 'first_name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.faculty_id = $1
        `;

        const params = [facultyId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY s.${orderBy} ${orderDirection}`;
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

    async findByDepartmentId(departmentId, options = {}) {
        const { limit, offset, orderBy = 'first_name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.department_id = $1
        `;

        const params = [departmentId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY s.${orderBy} ${orderDirection}`;
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

    async findByProgramId(programId, options = {}) {
        const { limit, offset, orderBy = 'first_name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.program_id = $1
        `;

        const params = [programId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY s.${orderBy} ${orderDirection}`;
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

    async findAll(filters = {}, options = {}) {
        const { limit, offset, orderBy = 'first_name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        // Apply filters
        if (filters.university_id) {
            query += ` AND s.university_id = $${paramIndex}`;
            params.push(filters.university_id);
            paramIndex++;
        }

        if (filters.faculty_id) {
            query += ` AND s.faculty_id = $${paramIndex}`;
            params.push(filters.faculty_id);
            paramIndex++;
        }

        if (filters.department_id) {
            query += ` AND s.department_id = $${paramIndex}`;
            params.push(filters.department_id);
            paramIndex++;
        }

        if (filters.program_id) {
            query += ` AND s.program_id = $${paramIndex}`;
            params.push(filters.program_id);
            paramIndex++;
        }

        if (filters.academic_status) {
            query += ` AND s.academic_status = $${paramIndex}`;
            params.push(filters.academic_status);
            paramIndex++;
        }

        if (filters.enrollment_year) {
            query += ` AND s.enrollment_year = $${paramIndex}`;
            params.push(filters.enrollment_year);
            paramIndex++;
        }

        if (filters.is_active !== undefined) {
            query += ` AND s.is_active = $${paramIndex}`;
            params.push(filters.is_active);
            paramIndex++;
        }

        if (orderBy) {
            query += ` ORDER BY s.${orderBy} ${orderDirection}`;
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

    async count(filters = {}) {
        let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE 1=1`;
        const params = [];
        let paramIndex = 1;

        // Apply filters
        if (filters.university_id) {
            query += ` AND university_id = $${paramIndex}`;
            params.push(filters.university_id);
            paramIndex++;
        }

        if (filters.faculty_id) {
            query += ` AND faculty_id = $${paramIndex}`;
            params.push(filters.faculty_id);
            paramIndex++;
        }

        if (filters.department_id) {
            query += ` AND department_id = $${paramIndex}`;
            params.push(filters.department_id);
            paramIndex++;
        }

        if (filters.program_id) {
            query += ` AND program_id = $${paramIndex}`;
            params.push(filters.program_id);
            paramIndex++;
        }

        if (filters.academic_status) {
            query += ` AND academic_status = $${paramIndex}`;
            params.push(filters.academic_status);
            paramIndex++;
        }

        if (filters.enrollment_year) {
            query += ` AND enrollment_year = $${paramIndex}`;
            params.push(filters.enrollment_year);
            paramIndex++;
        }

        if (filters.is_active !== undefined) {
            query += ` AND is_active = $${paramIndex}`;
            params.push(filters.is_active);
            paramIndex++;
        }

        const result = await this.db.query(query, params);
        return parseInt(result.rows[0].count);
    }

    async findById(id) {
        const query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.id = $1
        `;
        const result = await this.db.query(query, [id]);
        return result.rows[0];
    }

    async updateGPA(studentId, gpa) {
        const query = `
            UPDATE ${this.tableName}
            SET gpa = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await this.db.query(query, [gpa, studentId]);
        return result.rows[0];
    }

    async updateCredits(studentId, credits) {
        const query = `
            UPDATE ${this.tableName}
            SET total_credits = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await this.db.query(query, [credits, studentId]);
        return result.rows[0];
    }

    async getStudentsByEnrollmentYear(universityId, year) {
        const query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.university_id = $1 AND s.enrollment_year = $2
            ORDER BY s.first_name ASC
        `;
        const result = await this.db.query(query, [universityId, year]);
        return result.rows;
    }

    async getGraduatingStudents(universityId, year) {
        const query = `
            SELECT s.*, u.name as university_name, f.name as faculty_name,
                   d.name as department_name, p.name as program_name
            FROM ${this.tableName} s
            LEFT JOIN universities u ON s.university_id = u.id
            LEFT JOIN faculties f ON s.faculty_id = f.id
            LEFT JOIN departments d ON s.department_id = d.id
            LEFT JOIN programs p ON s.program_id = p.id
            WHERE s.university_id = $1 AND s.graduation_year = $2
            ORDER BY s.first_name ASC
        `;
        const result = await this.db.query(query, [universityId, year]);
        return result.rows;
    }
}

module.exports = new StudentRepository();