const StudentRepository = require('../repositories/studentRepository');
const UniversityRepository = require('../repositories/universityRepository');
const FacultyRepository = require('../repositories/facultyRepository');
const DepartmentRepository = require('../repositories/departmentRepository');
const ProgramRepository = require('../repositories/programRepository');
const UserRepository = require('../repositories/userRepository');
const { isValidEmail, sanitizeInput } = require('../utils/helpers');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

class StudentService {
    constructor() {
        this.studentRepository = new StudentRepository();
        this.universityRepository = new UniversityRepository();
        this.facultyRepository = new FacultyRepository();
        this.departmentRepository = new DepartmentRepository();
        this.programRepository = new ProgramRepository();
        this.userRepository = new UserRepository();
    }

    async create(data, user) {
        // Validate required fields
        if (!data.firstName || !data.lastName || !data.email || !data.universityId) {
            throw new ValidationError('First name, last name, email, and university ID are required');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin' && user.role !== 'exam_officer') {
            throw new ForbiddenError('Only system admins, university admins, and exam officers can create students');
        }

        // For non-system admins, they can only create students in their university
        if (user.role !== 'system_admin' && data.universityId !== user.universityId) {
            throw new ForbiddenError('You can only create students for your university');
        }

        // Validate university exists
        const university = await this.universityRepository.findById(data.universityId);
        if (!university) {
            throw new NotFoundError('University not found');
        }

        // Validate program relationships
        if (data.programId) {
            const program = await this.programRepository.findById(data.programId);
            if (!program) {
                throw new NotFoundError('Program not found');
            }

            // Auto-set department and faculty from program if not provided
            if (!data.departmentId) {
                data.departmentId = program.department_id;
            }
            if (!data.facultyId) {
                data.facultyId = program.faculty_id;
            }

            // Validate relationships
            if (data.departmentId && data.departmentId !== program.department_id) {
                throw new ValidationError('Department ID does not match program\'s department');
            }
            if (data.facultyId && data.facultyId !== program.faculty_id) {
                throw new ValidationError('Faculty ID does not match program\'s faculty');
            }
        }

        // Validate department and faculty
        if (data.departmentId) {
            const department = await this.departmentRepository.findById(data.departmentId);
            if (!department) {
                throw new NotFoundError('Department not found');
            }

            if (!data.facultyId) {
                data.facultyId = department.faculty_id;
            }

            if (data.facultyId && data.facultyId !== department.faculty_id) {
                throw new ValidationError('Faculty ID does not match department\'s faculty');
            }
        }

        if (data.facultyId) {
            const faculty = await this.facultyRepository.findById(data.facultyId);
            if (!faculty) {
                throw new NotFoundError('Faculty not found');
            }
        }

        // Check if email is unique
        const existingStudent = await this.studentRepository.findByEmail(data.email);
        if (existingStudent) {
            throw new ValidationError('Email already exists');
        }

        // Generate student ID if not provided
        if (!data.studentId) {
            data.studentId = await this.generateStudentId(data.universityId);
        } else {
            // Check if student ID is unique
            const existingStudentId = await this.studentRepository.findByStudentId(data.studentId);
            if (existingStudentId) {
                throw new ValidationError('Student ID already exists');
            }
        }

        // Create student
        const studentData = {
            student_id: data.studentId,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: data.phone,
            date_of_birth: data.dateOfBirth,
            gender: data.gender,
            address: data.address,
            nationality: data.nationality,
            university_id: data.universityId,
            faculty_id: data.facultyId,
            department_id: data.departmentId,
            program_id: data.programId,
            enrollment_year: data.enrollmentYear || new Date().getFullYear(),
            current_semester: data.currentSemester,
            academic_status: data.academicStatus || 'active',
            emergency_contact_name: data.emergencyContactName,
            emergency_contact_phone: data.emergencyContactPhone,
            emergency_contact_relationship: data.emergencyContactRelationship,
            admission_date: data.admissionDate || new Date(),
            profile_picture_url: data.profilePictureUrl,
            documents: data.documents || {},
            is_active: data.isActive !== undefined ? data.isActive : true,
            created_by: user.id,
            updated_by: user.id
        };

        return await this.studentRepository.create(studentData);
    }

    async update(id, data, user) {
        // Find existing student
        const student = await this.studentRepository.findById(id);
        if (!student) {
            throw new NotFoundError('Student not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin' && user.role !== 'exam_officer') {
            throw new ForbiddenError('Only system admins, university admins, and exam officers can update students');
        }

        // For non-system admins, they can only update students in their university
        if (user.role !== 'system_admin' && student.university_id !== user.universityId) {
            throw new ForbiddenError('You can only update students in your university');
        }

        // Validate program relationships if being updated
        if (data.programId) {
            const program = await this.programRepository.findById(data.programId);
            if (!program) {
                throw new NotFoundError('Program not found');
            }

            // Auto-set department and faculty from program if not provided
            if (!data.departmentId) {
                data.departmentId = program.department_id;
            }
            if (!data.facultyId) {
                data.facultyId = program.faculty_id;
            }
        }

        // Validate department and faculty if being updated
        if (data.departmentId) {
            const department = await this.departmentRepository.findById(data.departmentId);
            if (!department) {
                throw new NotFoundError('Department not found');
            }
        }

        if (data.facultyId) {
            const faculty = await this.facultyRepository.findById(data.facultyId);
            if (!faculty) {
                throw new NotFoundError('Faculty not found');
            }
        }

        // Check if student ID is unique (if being updated)
        if (data.studentId && data.studentId !== student.student_id) {
            const existingStudentId = await this.studentRepository.findByStudentId(data.studentId);
            if (existingStudentId) {
                throw new ValidationError('Student ID already exists');
            }
        }

        // Update student
        const updateData = {
            ...data,
            updated_by: user.id,
            updated_at: new Date()
        };

        return await this.studentRepository.update(id, updateData);
    }

    async delete(id, user) {
        // Find existing student
        const student = await this.studentRepository.findById(id);
        if (!student) {
            throw new NotFoundError('Student not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin') {
            throw new ForbiddenError('Only system admins and university admins can delete students');
        }

        // For non-system admins, they can only delete students in their university
        if (user.role !== 'system_admin' && student.university_id !== user.universityId) {
            throw new ForbiddenError('You can only delete students in your university');
        }

        return await this.studentRepository.delete(id);
    }

    async findById(id, user) {
        const student = await this.studentRepository.findById(id);
        if (!student) {
            throw new NotFoundError('Student not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && student.university_id !== user.universityId) {
            throw new ForbiddenError('You can only view students in your university');
        }

        return student;
    }

    async findAll(options = {}, user) {
        const { universityId, facultyId, departmentId, programId, academicStatus, enrollmentYear, page = 1, limit = 10 } = options;

        // Determine university scope based on user role
        let targetUniversityId = universityId;
        if (user.role !== 'system_admin') {
            targetUniversityId = user.universityId;
        }

        if (!targetUniversityId) {
            throw new ValidationError('University ID is required for non-system admins');
        }

        const offset = (page - 1) * limit;

        // Build filter conditions
        const filters = {
            university_id: targetUniversityId
        };

        if (facultyId) {
            filters.faculty_id = facultyId;
        }

        if (departmentId) {
            filters.department_id = departmentId;
        }

        if (programId) {
            filters.program_id = programId;
        }

        if (academicStatus) {
            filters.academic_status = academicStatus;
        }

        if (enrollmentYear) {
            filters.enrollment_year = enrollmentYear;
        }

        const students = await this.studentRepository.findAll(filters, {
            limit,
            offset,
            orderBy: 'first_name',
            orderDirection: 'ASC'
        });

        const total = await this.studentRepository.count(filters);

        return {
            students,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async enrollInProgram(studentId, programId, user) {
        // Find existing student
        const student = await this.studentRepository.findById(studentId);
        if (!student) {
            throw new NotFoundError('Student not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin' && user.role !== 'exam_officer') {
            throw new ForbiddenError('Only system admins, university admins, and exam officers can enroll students');
        }

        // For non-system admins, they can only enroll students in their university
        if (user.role !== 'system_admin' && student.university_id !== user.universityId) {
            throw new ForbiddenError('You can only enroll students in your university');
        }

        // Validate program exists
        const program = await this.programRepository.findById(programId);
        if (!program) {
            throw new NotFoundError('Program not found');
        }

        // Check if program belongs to the same university
        if (program.university_id !== student.university_id) {
            throw new ValidationError('Program does not belong to the student\'s university');
        }

        return await this.studentRepository.update(studentId, {
            program_id: programId,
            department_id: program.department_id,
            faculty_id: program.faculty_id,
            academic_status: 'active',
            updated_by: user.id,
            updated_at: new Date()
        });
    }

    async updateAcademicStatus(studentId, academicStatus, user) {
        // Find existing student
        const student = await this.studentRepository.findById(studentId);
        if (!student) {
            throw new NotFoundError('Student not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin' && user.role !== 'exam_officer') {
            throw new ForbiddenError('Only system admins, university admins, and exam officers can update academic status');
        }

        // For non-system admins, they can only update students in their university
        if (user.role !== 'system_admin' && student.university_id !== user.universityId) {
            throw new ForbiddenError('You can only update students in your university');
        }

        const validStatuses = ['active', 'inactive', 'graduated', 'suspended', 'expelled', 'withdrawn'];
        if (!validStatuses.includes(academicStatus)) {
            throw new ValidationError('Invalid academic status');
        }

        const updateData = {
            academic_status: academicStatus,
            updated_by: user.id,
            updated_at: new Date()
        };

        // Set graduation year if status is graduated
        if (academicStatus === 'graduated') {
            updateData.graduation_year = new Date().getFullYear();
        }

        return await this.studentRepository.update(studentId, updateData);
    }

    async bulkUpload(studentData, user) {
        const results = {
            successful: [],
            failed: []
        };

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin' && user.role !== 'exam_officer') {
            throw new ForbiddenError('Only system admins, university admins, and exam officers can bulk upload students');
        }

        for (const student of studentData) {
            try {
                // For non-system admins, force university_id to their university
                if (user.role !== 'system_admin') {
                    student.universityId = user.universityId;
                }

                const createdStudent = await this.create(student, user);
                results.successful.push({
                    email: student.email,
                    studentId: createdStudent.student_id,
                    id: createdStudent.id
                });
            } catch (error) {
                results.failed.push({
                    email: student.email,
                    error: error.message
                });
            }
        }

        return results;
    }

    async getStats(universityId, user) {
        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== universityId) {
            throw new ForbiddenError('You can only view stats for your university');
        }

        const stats = {};

        // Count students by academic status
        const statuses = ['active', 'inactive', 'graduated', 'suspended', 'expelled', 'withdrawn'];
        for (const status of statuses) {
            const count = await this.studentRepository.count({
                university_id: universityId,
                academic_status: status
            });
            stats[status] = count;
        }

        // Total students
        stats.total = Object.values(stats).reduce((sum, count) => sum + count, 0);

        // Enrollment year distribution
        const currentYear = new Date().getFullYear();
        stats.enrollment_years = {};
        for (let year = currentYear - 5; year <= currentYear; year++) {
            const count = await this.studentRepository.count({
                university_id: universityId,
                enrollment_year: year
            });
            if (count > 0) {
                stats.enrollment_years[year] = count;
            }
        }

        return stats;
    }

    async generateStudentId(universityId) {
        const university = await this.universityRepository.findById(universityId);
        const universityCode = university.name.substring(0, 3).toUpperCase();

        const currentYear = new Date().getFullYear();
        const yearCode = currentYear.toString().slice(-2);

        // Find the next available sequence number
        let sequence = 1;
        let studentId;

        do {
            studentId = `${universityCode}${yearCode}${sequence.toString().padStart(4, '0')}`;
            const existing = await this.studentRepository.findByStudentId(studentId);
            if (!existing) break;
            sequence++;
        } while (sequence < 9999);

        if (sequence >= 9999) {
            throw new Error('Unable to generate unique student ID');
        }

        return studentId;
    }

    async createStudent(studentData, tenantId) {
        try {
            // Validate required fields
            if (!studentData.firstName || !studentData.firstName.trim()) {
                throw new Error('First name is required');
            }
            if (!studentData.lastName || !studentData.lastName.trim()) {
                throw new Error('Last name is required');
            }
            if (!studentData.email || !studentData.email.trim()) {
                throw new Error('Email is required');
            }

            // Validate email format
            if (!isValidEmail(studentData.email.trim())) {
                throw new Error('Invalid email format');
            }

            // Check for duplicate email
            const existingStudent = await this.studentRepository.findByEmail(studentData.email.trim());
            if (existingStudent) {
                throw new Error('A student with this email already exists');
            }

            // Validate university if provided
            if (studentData.universityId) {
                const universityExists = await this.universityRepository.exists(studentData.universityId);
                if (!universityExists) {
                    throw new Error('Invalid university ID');
                }
            }

            // Validate faculty/department/program relationships if provided
            if (studentData.facultyId) {
                const facultyExists = await this.facultyRepository.exists(studentData.facultyId);
                if (!facultyExists) {
                    throw new Error('Invalid faculty ID');
                }
            }

            if (studentData.departmentId) {
                const departmentExists = await this.departmentRepository.exists(studentData.departmentId);
                if (!departmentExists) {
                    throw new Error('Invalid department ID');
                }
            }

            if (studentData.programId) {
                const programExists = await this.programRepository.exists(studentData.programId);
                if (!programExists) {
                    throw new Error('Invalid program ID');
                }
            }

            // Generate student ID if not provided
            const studentId = studentData.studentId || await this.generateStudentId(studentData.universityId);

            // Prepare student data
            const data = {
                first_name: sanitizeInput(studentData.firstName),
                last_name: sanitizeInput(studentData.lastName),
                email: studentData.email.trim().toLowerCase(),
                phone: studentData.phone ? sanitizeInput(studentData.phone) : null,
                date_of_birth: studentData.dateOfBirth || null,
                gender: studentData.gender || null,
                address: studentData.address ? sanitizeInput(studentData.address) : null,
                student_id: studentId,
                university_id: studentData.universityId,
                faculty_id: studentData.facultyId || null,
                department_id: studentData.departmentId || null,
                program_id: studentData.programId || null,
                enrollment_year: studentData.enrollmentYear || new Date().getFullYear(),
                graduation_year: studentData.graduationYear || null,
                academic_status: studentData.academicStatus || 'active',
                gpa: studentData.gpa || null,
                total_credits: studentData.totalCredits || 0,
                emergency_contact: studentData.emergencyContact ? JSON.stringify(studentData.emergencyContact) : null,
                nationality: studentData.nationality ? sanitizeInput(studentData.nationality) : null,
                is_active: studentData.isActive !== undefined ? studentData.isActive : true
            };

            const student = await this.studentRepository.create(data);
            return {
                success: true,
                data: student,
                message: 'Student created successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async updateStudent(id, studentData, tenantId, universityId = null) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('Invalid student ID');
            }

            // Check if student exists
            const existingStudent = await this.studentRepository.findById(id);
            if (!existingStudent) {
                throw new Error('Student not found');
            }

            // Check university scoping if provided
            if (universityId && existingStudent.university_id !== parseInt(universityId)) {
                throw new Error('Student not found in specified university');
            }

            // Check for duplicate email if email is being updated
            if (studentData.email && studentData.email.trim().toLowerCase() !== existingStudent.email) {
                const duplicateStudent = await this.studentRepository.findByEmail(studentData.email.trim());
                if (duplicateStudent) {
                    throw new Error('A student with this email already exists');
                }
            }

            // Validate email format if provided
            if (studentData.email && !isValidEmail(studentData.email.trim())) {
                throw new Error('Invalid email format');
            }

            // Validate relationships if provided
            if (studentData.universityId) {
                const universityExists = await this.universityRepository.exists(studentData.universityId);
                if (!universityExists) {
                    throw new Error('Invalid university ID');
                }
            }

            if (studentData.facultyId) {
                const facultyExists = await this.facultyRepository.exists(studentData.facultyId);
                if (!facultyExists) {
                    throw new Error('Invalid faculty ID');
                }
            }

            if (studentData.departmentId) {
                const departmentExists = await this.departmentRepository.exists(studentData.departmentId);
                if (!departmentExists) {
                    throw new Error('Invalid department ID');
                }
            }

            if (studentData.programId) {
                const programExists = await this.programRepository.exists(studentData.programId);
                if (!programExists) {
                    throw new Error('Invalid program ID');
                }
            }

            // Prepare update data
            const data = {};
            if (studentData.firstName !== undefined) data.first_name = sanitizeInput(studentData.firstName);
            if (studentData.lastName !== undefined) data.last_name = sanitizeInput(studentData.lastName);
            if (studentData.email !== undefined) data.email = studentData.email.trim().toLowerCase();
            if (studentData.phone !== undefined) data.phone = studentData.phone ? sanitizeInput(studentData.phone) : null;
            if (studentData.dateOfBirth !== undefined) data.date_of_birth = studentData.dateOfBirth || null;
            if (studentData.gender !== undefined) data.gender = studentData.gender || null;
            if (studentData.address !== undefined) data.address = studentData.address ? sanitizeInput(studentData.address) : null;
            if (studentData.studentId !== undefined) data.student_id = studentData.studentId;
            if (studentData.universityId !== undefined) data.university_id = studentData.universityId;
            if (studentData.facultyId !== undefined) data.faculty_id = studentData.facultyId || null;
            if (studentData.departmentId !== undefined) data.department_id = studentData.departmentId || null;
            if (studentData.programId !== undefined) data.program_id = studentData.programId || null;
            if (studentData.enrollmentYear !== undefined) data.enrollment_year = studentData.enrollmentYear;
            if (studentData.graduationYear !== undefined) data.graduation_year = studentData.graduationYear;
            if (studentData.academicStatus !== undefined) data.academic_status = studentData.academicStatus;
            if (studentData.gpa !== undefined) data.gpa = studentData.gpa;
            if (studentData.totalCredits !== undefined) data.total_credits = studentData.totalCredits;
            if (studentData.emergencyContact !== undefined) data.emergency_contact = studentData.emergencyContact ? JSON.stringify(studentData.emergencyContact) : null;
            if (studentData.nationality !== undefined) data.nationality = studentData.nationality ? sanitizeInput(studentData.nationality) : null;
            if (studentData.isActive !== undefined) data.is_active = studentData.isActive;

            const student = await this.studentRepository.update(id, data);
            return {
                success: true,
                data: student,
                message: 'Student updated successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async deleteStudent(id, tenantId, universityId = null) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('Invalid student ID');
            }

            // Check if student exists
            const student = await this.studentRepository.findById(id);
            if (!student) {
                throw new Error('Student not found');
            }

            // Check university scoping if provided
            if (universityId && student.university_id !== parseInt(universityId)) {
                throw new Error('Student not found in specified university');
            }

            await this.studentRepository.delete(id);
            return {
                success: true,
                message: 'Student deleted successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async enrollInProgram(id, programId, enrollmentDate, tenantId, universityId = null) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('Invalid student ID');
            }
            if (!programId || isNaN(programId)) {
                throw new Error('Invalid program ID');
            }

            // Check if student exists
            const student = await this.studentRepository.findById(id);
            if (!student) {
                throw new Error('Student not found');
            }

            // Check university scoping if provided
            if (universityId && student.university_id !== parseInt(universityId)) {
                throw new Error('Student not found in specified university');
            }

            // Check if program exists
            const program = await this.programRepository.findById(programId);
            if (!program) {
                throw new Error('Program not found');
            }

            // Check if student is already enrolled in this program
            if (student.program_id === parseInt(programId)) {
                throw new Error('Student is already enrolled in this program');
            }

            // Update student's program enrollment
            const updateData = {
                program_id: programId,
                department_id: program.department_id,
                faculty_id: program.faculty_id,
                enrollment_date: enrollmentDate || new Date().toISOString().split('T')[0],
                academic_status: 'active'
            };

            const updatedStudent = await this.studentRepository.update(id, updateData);
            return {
                success: true,
                data: updatedStudent,
                message: 'Student enrolled in program successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async updateAcademicStatus(id, academicStatus, reason, tenantId, universityId = null) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('Invalid student ID');
            }

            // Check if student exists
            const student = await this.studentRepository.findById(id);
            if (!student) {
                throw new Error('Student not found');
            }

            // Check university scoping if provided
            if (universityId && student.university_id !== parseInt(universityId)) {
                throw new Error('Student not found in specified university');
            }

            const updateData = {
                academic_status: academicStatus
            };

            // Add graduation year if status is graduated
            if (academicStatus === 'graduated') {
                updateData.graduation_year = new Date().getFullYear();
            }

            const updatedStudent = await this.studentRepository.update(id, updateData);
            return {
                success: true,
                data: updatedStudent,
                message: `Student academic status updated to ${academicStatus}`
            };
        } catch (error) {
            throw error;
        }
    }

    async updateGPA(id, gpa, tenantId, universityId = null) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('Invalid student ID');
            }
            if (gpa < 0 || gpa > 4.0) {
                throw new Error('GPA must be between 0.0 and 4.0');
            }

            // Check if student exists
            const student = await this.studentRepository.findById(id);
            if (!student) {
                throw new Error('Student not found');
            }

            // Check university scoping if provided
            if (universityId && student.university_id !== parseInt(universityId)) {
                throw new Error('Student not found in specified university');
            }

            const updatedStudent = await this.studentRepository.updateGPA(id, gpa);
            return {
                success: true,
                data: updatedStudent,
                message: 'Student GPA updated successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async updateCredits(id, credits, tenantId, universityId = null) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('Invalid student ID');
            }
            if (credits < 0) {
                throw new Error('Credits cannot be negative');
            }

            // Check if student exists
            const student = await this.studentRepository.findById(id);
            if (!student) {
                throw new Error('Student not found');
            }

            // Check university scoping if provided
            if (universityId && student.university_id !== parseInt(universityId)) {
                throw new Error('Student not found in specified university');
            }

            const updatedStudent = await this.studentRepository.updateCredits(id, credits);
            return {
                success: true,
                data: updatedStudent,
                message: 'Student credits updated successfully'
            };
        } catch (error) {
            throw error;
        }
    }

    async getAllStudents(tenantId, universityId = null, filters = {}, options = {}) {
        try {
            let students;
            if (universityId) {
                students = await this.studentRepository.findByUniversityId(universityId, options);
            } else {
                students = await this.studentRepository.findAll(filters, options);
            }

            return {
                success: true,
                data: students,
                count: students.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getStudentById(id, tenantId, universityId = null) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('Invalid student ID');
            }

            const student = await this.studentRepository.findById(id);
            if (!student) {
                throw new Error('Student not found');
            }

            // Check university scoping if provided
            if (universityId && student.university_id !== parseInt(universityId)) {
                throw new Error('Student not found in specified university');
            }

            return {
                success: true,
                data: student
            };
        } catch (error) {
            throw error;
        }
    }

    async getStudentsByUniversity(universityId, tenantId, options = {}) {
        try {
            if (!universityId || isNaN(universityId)) {
                throw new Error('Invalid university ID');
            }

            const students = await this.studentRepository.findByUniversityId(universityId, options);
            return {
                success: true,
                data: students,
                count: students.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getStudentsByFaculty(facultyId, tenantId, universityId = null, options = {}) {
        try {
            if (!facultyId || isNaN(facultyId)) {
                throw new Error('Invalid faculty ID');
            }

            const students = await this.studentRepository.findByFacultyId(facultyId, options);

            // Filter by university if specified
            let filteredStudents = students;
            if (universityId) {
                filteredStudents = students.filter(s => s.university_id === parseInt(universityId));
            }

            return {
                success: true,
                data: filteredStudents,
                count: filteredStudents.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getStudentsByDepartment(departmentId, tenantId, universityId = null, options = {}) {
        try {
            if (!departmentId || isNaN(departmentId)) {
                throw new Error('Invalid department ID');
            }

            const students = await this.studentRepository.findByDepartmentId(departmentId, options);

            // Filter by university if specified
            let filteredStudents = students;
            if (universityId) {
                filteredStudents = students.filter(s => s.university_id === parseInt(universityId));
            }

            return {
                success: true,
                data: filteredStudents,
                count: filteredStudents.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getStudentsByProgram(programId, tenantId, universityId = null, options = {}) {
        try {
            if (!programId || isNaN(programId)) {
                throw new Error('Invalid program ID');
            }

            const students = await this.studentRepository.findByProgramId(programId, options);

            // Filter by university if specified
            let filteredStudents = students;
            if (universityId) {
                filteredStudents = students.filter(s => s.university_id === parseInt(universityId));
            }

            return {
                success: true,
                data: filteredStudents,
                count: filteredStudents.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getStudentsByEnrollmentYear(universityId, year, tenantId) {
        try {
            if (!universityId || isNaN(universityId)) {
                throw new Error('Invalid university ID');
            }
            if (!year || isNaN(year)) {
                throw new Error('Invalid year');
            }

            const students = await this.studentRepository.getStudentsByEnrollmentYear(universityId, year);
            return {
                success: true,
                data: students,
                count: students.length
            };
        } catch (error) {
            throw error;
        }
    }

    async getGraduatingStudents(universityId, year, tenantId) {
        try {
            if (!universityId || isNaN(universityId)) {
                throw new Error('Invalid university ID');
            }
            if (!year || isNaN(year)) {
                throw new Error('Invalid year');
            }

            const students = await this.studentRepository.getGraduatingStudents(universityId, year);
            return {
                success: true,
                data: students,
                count: students.length
            };
        } catch (error) {
            throw error;
        }
    }

    async bulkUploadStudents(students, tenantId) {
        try {
            if (!Array.isArray(students) || students.length === 0) {
                throw new Error('Students array is required and cannot be empty');
            }

            if (students.length > 1000) {
                throw new Error('Cannot upload more than 1000 students at once');
            }

            const results = {
                success: [],
                errors: [],
                total: students.length
            };

            for (let i = 0; i < students.length; i++) {
                try {
                    const student = students[i];
                    const result = await this.createStudent(student, tenantId);
                    results.success.push({
                        index: i,
                        studentId: result.data.student_id,
                        email: result.data.email
                    });
                } catch (error) {
                    results.errors.push({
                        index: i,
                        email: students[i].email,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                data: results,
                message: `Bulk upload completed. ${results.success.length} successful, ${results.errors.length} errors`
            };
        } catch (error) {
            throw error;
        }
    }

    async getStudentStats(tenantId, universityId = null) {
        try {
            const filters = {};
            if (universityId) {
                filters.university_id = universityId;
            }

            const totalStudents = await this.studentRepository.count(filters);

            // Get status distribution
            const statusStats = await this.db.query(`
                SELECT academic_status, COUNT(*) as count
                FROM students
                WHERE (${universityId ? 'university_id = $1' : '1=1'})
                GROUP BY academic_status
            `, universityId ? [universityId] : []);

            // Get enrollment year distribution
            const enrollmentStats = await this.db.query(`
                SELECT enrollment_year, COUNT(*) as count
                FROM students
                WHERE (${universityId ? 'university_id = $1' : '1=1'})
                GROUP BY enrollment_year
                ORDER BY enrollment_year DESC
                LIMIT 10
            `, universityId ? [universityId] : []);

            // Get faculty distribution
            const facultyStats = await this.db.query(`
                SELECT f.name as faculty_name, COUNT(s.id) as count
                FROM students s
                LEFT JOIN faculties f ON s.faculty_id = f.id
                WHERE (${universityId ? 's.university_id = $1' : '1=1'})
                GROUP BY f.id, f.name
                ORDER BY count DESC
            `, universityId ? [universityId] : []);

            // Get average GPA
            const gpaStats = await this.db.query(`
                SELECT AVG(gpa) as average_gpa, MIN(gpa) as min_gpa, MAX(gpa) as max_gpa
                FROM students
                WHERE gpa IS NOT NULL AND (${universityId ? 'university_id = $1' : '1=1'})
            `, universityId ? [universityId] : []);

            return {
                success: true,
                data: {
                    totalStudents,
                    statusDistribution: statusStats.rows,
                    enrollmentYearDistribution: enrollmentStats.rows,
                    facultyDistribution: facultyStats.rows,
                    gpaStats: gpaStats.rows[0] || { average_gpa: null, min_gpa: null, max_gpa: null }
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new StudentService();