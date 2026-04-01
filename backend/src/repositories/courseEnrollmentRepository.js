const BaseRepository = require('./baseRepository');

class CourseEnrollmentRepository extends BaseRepository {
    constructor() {
        super('course_enrollments');
    }

    async findByStudentAndCourse(studentId, courseId, semester, academicYear) {
        const query = `
            SELECT ce.*, c.name as course_name, c.code as course_code, c.credits as course_credits,
                   s.first_name as student_first_name, s.last_name as student_last_name,
                   d.name as department_name, u.name as university_name
            FROM ${this.tableName} ce
            LEFT JOIN courses c ON ce.course_id = c.id
            LEFT JOIN students s ON ce.student_id = s.id
            LEFT JOIN departments d ON ce.department_id = d.id
            LEFT JOIN universities u ON ce.university_id = u.id
            WHERE ce.student_id = $1 AND ce.course_id = $2 AND ce.semester = $3 AND ce.academic_year = $4
            LIMIT 1
        `;
        const result = await this.db.query(query, [studentId, courseId, semester, academicYear]);
        return result.rows[0];
    }

    async findByStudent(studentId, options = {}) {
        const { semester, academicYear, status, limit, offset, orderBy = 'enrollment_date', orderDirection = 'DESC' } = options;

        let query = `
            SELECT ce.*, c.name as course_name, c.code as course_code, c.credits as course_credits,
                   d.name as department_name, f.name as faculty_name, u.name as university_name
            FROM ${this.tableName} ce
            LEFT JOIN courses c ON ce.course_id = c.id
            LEFT JOIN departments d ON ce.department_id = d.id
            LEFT JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN universities u ON ce.university_id = u.id
            WHERE ce.student_id = $1
        `;

        const params = [studentId];
        let paramIndex = 2;

        if (semester) {
            query += ` AND ce.semester = $${paramIndex}`;
            params.push(semester);
            paramIndex++;
        }

        if (academicYear) {
            query += ` AND ce.academic_year = $${paramIndex}`;
            params.push(academicYear);
            paramIndex++;
        }

        if (status) {
            query += ` AND ce.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (orderBy) {
            query += ` ORDER BY ce.${orderBy} ${orderDirection}`;
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

    async findByStudentAndSemester(studentId, semester, academicYear) {
        const query = `
            SELECT ce.*, c.name as course_name, c.code as course_code, c.credits as course_credits,
                   d.name as department_name, f.name as faculty_name
            FROM ${this.tableName} ce
            LEFT JOIN courses c ON ce.course_id = c.id
            LEFT JOIN departments d ON ce.department_id = d.id
            LEFT JOIN faculties f ON c.faculty_id = f.id
            WHERE ce.student_id = $1 AND ce.semester = $2 AND ce.academic_year = $3
            ORDER BY ce.enrollment_date
        `;
        const result = await this.db.query(query, [studentId, semester, academicYear]);
        return result.rows;
    }

    async findByCourse(courseId, options = {}) {
        const { semester, academicYear, status, limit, offset, orderBy = 'enrollment_date', orderDirection = 'ASC' } = options;

        let query = `
            SELECT ce.*, s.first_name as student_first_name, s.last_name as student_last_name,
                   s.email as student_email, s.student_id as student_number,
                   c.name as course_name, c.code as course_code
            FROM ${this.tableName} ce
            INNER JOIN students s ON ce.student_id = s.id
            INNER JOIN courses c ON ce.course_id = c.id
            WHERE ce.course_id = $1
        `;

        const params = [courseId];
        let paramIndex = 2;

        if (semester) {
            query += ` AND ce.semester = $${paramIndex}`;
            params.push(semester);
            paramIndex++;
        }

        if (academicYear) {
            query += ` AND ce.academic_year = $${paramIndex}`;
            params.push(academicYear);
            paramIndex++;
        }

        if (status) {
            query += ` AND ce.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (orderBy) {
            query += ` ORDER BY ce.${orderBy} ${orderDirection}`;
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

    async findBySemesterAndYear(universityId, semester, academicYear, options = {}) {
        const { department, status, limit, offset } = options;

        let query = `
            SELECT ce.*, s.first_name as student_first_name, s.last_name as student_last_name,
                   s.email as student_email, c.name as course_name, c.code as course_code,
                   d.name as department_name
            FROM ${this.tableName} ce
            INNER JOIN students s ON ce.student_id = s.id
            INNER JOIN courses c ON ce.course_id = c.id
            LEFT JOIN departments d ON ce.department_id = d.id
            WHERE ce.university_id = $1 AND ce.semester = $2 AND ce.academic_year = $3
        `;

        const params = [universityId, semester, academicYear];
        let paramIndex = 4;

        if (department) {
            query += ` AND ce.department_id = $${paramIndex}`;
            params.push(department);
            paramIndex++;
        }

        if (status) {
            query += ` AND ce.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY s.last_name ASC`;

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

    async countStudentsInCourse(courseId, semester, academicYear, status = null) {
        let query = `
            SELECT COUNT(*) as count FROM ${this.tableName}
            WHERE course_id = $1 AND semester = $2 AND academic_year = $3
        `;
        const params = [courseId, semester, academicYear];

        if (status) {
            query += ` AND status = $4`;
            params.push(status);
        }

        const result = await this.db.query(query, params);
        return parseInt(result.rows[0].count);
    }

    async getStudentTranscript(studentId, options = {}) {
        const { academicYear, limit, offset } = options;

        let query = `
            SELECT ce.*, c.name as course_name, c.code as course_code, c.credits as course_credits,
                   d.name as department_name, f.name as faculty_name
            FROM ${this.tableName} ce
            INNER JOIN courses c ON ce.course_id = c.id
            LEFT JOIN departments d ON ce.department_id = d.id
            LEFT JOIN faculties f ON c.faculty_id = f.id
            WHERE ce.student_id = $1 AND ce.is_completed = true
        `;

        const params = [studentId];
        let paramIndex = 2;

        if (academicYear) {
            query += ` AND ce.academic_year = $${paramIndex}`;
            params.push(academicYear);
            paramIndex++;
        }

        query += ` ORDER BY ce.academic_year DESC, ce.semester DESC`;

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

    async getStudentGPA(studentId) {
        const query = `
            SELECT 
                AVG(CASE WHEN grade_points IS NOT NULL THEN grade_points ELSE 0 END) as gpa,
                SUM(CASE WHEN is_completed = true THEN credits_earned ELSE 0 END) as total_credits,
                COUNT(*) as courses_taken,
                COUNT(CASE WHEN is_completed = true THEN 1 END) as courses_completed
            FROM ${this.tableName}
            WHERE student_id = $1 AND is_completed = true
        `;
        const result = await this.db.query(query, [studentId]);
        return result.rows[0];
    }

    async bulkEnroll(enrollments) {
        const columns = ['student_id', 'course_id', 'university_id', 'department_id', 'semester', 'academic_year', 'enrollment_date', 'status', 'tenant_id', 'created_by', 'updated_by'];
        const placeholders = enrollments.map((_, idx) => {
            const offset = idx * columns.length;
            return `(${columns.map((_, i) => `$${offset + i + 1}`).join(', ')})`;
        }).join(', ');

        const values = [];
        enrollments.forEach(e => {
            values.push(
                e.student_id,
                e.course_id,
                e.university_id,
                e.department_id,
                e.semester,
                e.academic_year,
                e.enrollment_date || new Date().toISOString().split('T')[0],
                e.status || 'enrolled',
                e.tenant_id,
                e.created_by,
                e.updated_by
            );
        });

        const query = `
            INSERT INTO ${this.tableName} (${columns.join(', ')})
            VALUES ${placeholders}
            ON CONFLICT (student_id, course_id, semester, academic_year) 
            DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await this.db.query(query, values);
        return result.rows;
    }

    async updateGrades(courseId, semester, academicYear, gradesData) {
        const updates = [];
        const parameters = [];
        let paramIndex = 1;

        Object.entries(gradesData).forEach(([studentId, gradeInfo]) => {
            const setClause = [];
            const values = [studentId, courseId, semester, academicYear];

            if (gradeInfo.grade) {
                setClause.push(`grade = $${paramIndex + 4}`);
                values.push(gradeInfo.grade);
            }

            if (gradeInfo.gradePoints !== undefined) {
                setClause.push(`grade_points = $${paramIndex + 5}`);
                values.push(gradeInfo.gradePoints);
            }

            if (gradeInfo.totalScore !== undefined) {
                setClause.push(`total_score = $${paramIndex + 6}`);
                values.push(gradeInfo.totalScore);
            }

            if (gradeInfo.creditsEarned !== undefined) {
                setClause.push(`credits_earned = $${paramIndex + 7}`);
                values.push(gradeInfo.creditsEarned);
            }

            if (gradeInfo.isCompleted !== undefined) {
                setClause.push(`is_completed = $${paramIndex + 8}`);
                values.push(gradeInfo.isCompleted);
            }

            if (gradeInfo.completionDate) {
                setClause.push(`completion_date = $${paramIndex + 9}`);
                values.push(gradeInfo.completionDate);
            }

            if (setClause.length > 0) {
                setClause.push(`updated_at = CURRENT_TIMESTAMP`);
                const query = `
                    UPDATE ${this.tableName}
                    SET ${setClause.join(', ')}
                    WHERE student_id = $1 AND course_id = $2 AND semester = $3 AND academic_year = $4
                    RETURNING *
                `;
                updates.push({ query, values });
            }
        });

        const results = [];
        for (const { query, values } of updates) {
            const result = await this.db.query(query, values);
            results.push(...result.rows);
        }
        return results;
    }

    async findById(id) {
        const query = `
            SELECT ce.*, c.name as course_name, c.code as course_code, c.credits as course_credits,
                   s.first_name as student_first_name, s.last_name as student_last_name,
                   d.name as department_name, u.name as university_name
            FROM ${this.tableName} ce
            LEFT JOIN courses c ON ce.course_id = c.id
            LEFT JOIN students s ON ce.student_id = s.id
            LEFT JOIN departments d ON ce.department_id = d.id
            LEFT JOIN universities u ON ce.university_id = u.id
            WHERE ce.id = $1
        `;
        const result = await this.db.query(query, [id]);
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

    async delete(id) {
        const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
        const result = await this.db.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = new CourseEnrollmentRepository();
