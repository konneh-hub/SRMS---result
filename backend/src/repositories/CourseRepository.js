const BaseRepository = require('./BaseRepository');

class CourseRepository extends BaseRepository {
    constructor() {
        super('courses');
    }

    async findByDepartmentId(departmentId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT c.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code,
                   u.first_name as lecturer_first_name, u.last_name as lecturer_last_name
            FROM ${this.tableName} c
            INNER JOIN departments d ON c.department_id = d.id
            INNER JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN users u ON c.lecturer_id = u.id
            WHERE c.department_id = $1
        `;

        const params = [departmentId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY c.${orderBy} ${orderDirection}`;
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

    async findByLecturerId(lecturerId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT c.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code
            FROM ${this.tableName} c
            INNER JOIN departments d ON c.department_id = d.id
            INNER JOIN faculties f ON c.faculty_id = f.id
            WHERE c.lecturer_id = $1
        `;

        const params = [lecturerId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY c.${orderBy} ${orderDirection}`;
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

    async findByCode(code, departmentId) {
        const query = `
            SELECT c.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code,
                   u.first_name as lecturer_first_name, u.last_name as lecturer_last_name
            FROM ${this.tableName} c
            INNER JOIN departments d ON c.department_id = d.id
            INNER JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN users u ON c.lecturer_id = u.id
            WHERE c.code = $1 AND c.department_id = $2
        `;
        const result = await this.db.query(query, [code, departmentId]);
        return result.rows[0];
    }

    async findByFacultyId(facultyId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT c.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code,
                   u.first_name as lecturer_first_name, u.last_name as lecturer_last_name
            FROM ${this.tableName} c
            INNER JOIN departments d ON c.department_id = d.id
            INNER JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN users u ON c.lecturer_id = u.id
            WHERE c.faculty_id = $1
        `;

        const params = [facultyId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY c.${orderBy} ${orderDirection}`;
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

    async findByUniversityId(universityId, options = {}) {
        const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;

        let query = `
            SELECT c.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code,
                   u.first_name as lecturer_first_name, u.last_name as lecturer_last_name
            FROM ${this.tableName} c
            INNER JOIN departments d ON c.department_id = d.id
            INNER JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN users u ON c.lecturer_id = u.id
            WHERE c.university_id = $1
        `;

        const params = [universityId];
        let paramIndex = 2;

        if (orderBy) {
            query += ` ORDER BY c.${orderBy} ${orderDirection}`;
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

    async assignLecturer(courseId, lecturerId) {
        const query = `
            UPDATE ${this.tableName}
            SET lecturer_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await this.db.query(query, [lecturerId, courseId]);
        return result.rows[0];
    }

    async removeLecturer(courseId) {
        const query = `
            UPDATE ${this.tableName}
            SET lecturer_id = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const result = await this.db.query(query, [courseId]);
        return result.rows[0];
    }

    async getLecturer(courseId) {
        const query = `
            SELECT u.* FROM users u
            INNER JOIN courses c ON c.lecturer_id = u.id
            WHERE c.id = $1
        `;
        const result = await this.db.query(query, [courseId]);
        return result.rows[0];
    }

    async getDepartment(courseId) {
        const query = `
            SELECT d.* FROM departments d
            INNER JOIN courses c ON c.department_id = d.id
            WHERE c.id = $1
        `;
        const result = await this.db.query(query, [courseId]);
        return result.rows[0];
    }

    async getFaculty(courseId) {
        const query = `
            SELECT f.* FROM faculties f
            INNER JOIN courses c ON c.faculty_id = f.id
            WHERE c.id = $1
        `;
        const result = await this.db.query(query, [courseId]);
        return result.rows[0];
    }

    async countByDepartmentId(departmentId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE department_id = $1
        `;
        const result = await this.db.query(query, [departmentId]);
        return parseInt(result.rows[0].count);
    }

    async countByLecturerId(lecturerId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE lecturer_id = $1
        `;
        const result = await this.db.query(query, [lecturerId]);
        return parseInt(result.rows[0].count);
    }

    async countByFacultyId(facultyId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE faculty_id = $1
        `;
        const result = await this.db.query(query, [facultyId]);
        return parseInt(result.rows[0].count);
    }

    async countByUniversityId(universityId) {
        const query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE university_id = $1
        `;
        const result = await this.db.query(query, [universityId]);
        return parseInt(result.rows[0].count);
    }

    async findAvailableCourses(universityId, options = {}) {
        const { semester, year, limit, offset } = options;

        let query = `
            SELECT c.*, d.name as department_name, d.code as department_code,
                   f.name as faculty_name, f.code as faculty_code,
                   u.first_name as lecturer_first_name, u.last_name as lecturer_last_name
            FROM ${this.tableName} c
            INNER JOIN departments d ON c.department_id = d.id
            INNER JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN users u ON c.lecturer_id = u.id
            WHERE c.university_id = $1 AND c.status = 'active'
        `;

        const params = [universityId];
        let paramIndex = 2;

        if (semester) {
            query += ` AND c.semester = $${paramIndex}`;
            params.push(semester);
            paramIndex++;
        }

        if (year) {
            query += ` AND c.year = $${paramIndex}`;
            params.push(year);
            paramIndex++;
        }

        query += ` ORDER BY c.name ASC`;

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
}

module.exports = CourseRepository;