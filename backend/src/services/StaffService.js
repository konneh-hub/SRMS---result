const UserRepository = require('../repositories/userRepository');
const UniversityRepository = require('../repositories/universityRepository');
const DepartmentRepository = require('../repositories/departmentRepository');
const FacultyRepository = require('../repositories/facultyRepository');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

class StaffService {
    constructor() {
        this.userRepository = new UserRepository();
        this.universityRepository = new UniversityRepository();
        this.departmentRepository = new DepartmentRepository();
        this.facultyRepository = new FacultyRepository();
    }

    // Staff roles that can be managed
    get STAFF_ROLES() {
        return ['university_admin', 'dean', 'hod', 'exam_officer', 'lecturer'];
    }

    async create(data, user) {
        // Validate required fields
        if (!data.email || !data.password || !data.firstName || !data.lastName || !data.role) {
            throw new ValidationError('Email, password, first name, last name, and role are required');
        }

        // Validate role
        if (!this.STAFF_ROLES.includes(data.role)) {
            throw new ValidationError('Invalid staff role');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin') {
            throw new ForbiddenError('Only system admins and university admins can create staff');
        }

        // For non-system admins, they can only create staff in their university
        if (user.role !== 'system_admin') {
            if (!data.universityId || data.universityId !== user.universityId) {
                throw new ForbiddenError('You can only create staff for your university');
            }
        }

        // Validate university exists
        if (data.universityId) {
            const university = await this.universityRepository.findById(data.universityId);
            if (!university) {
                throw new NotFoundError('University not found');
            }
        }

        // Validate department and faculty relationships
        if (data.departmentId) {
            const department = await this.departmentRepository.findById(data.departmentId);
            if (!department) {
                throw new NotFoundError('Department not found');
            }

            // Auto-set faculty_id from department if not provided
            if (!data.facultyId) {
                data.facultyId = department.faculty_id;
            }

            // Validate faculty matches department
            if (data.facultyId && data.facultyId !== department.faculty_id) {
                throw new ValidationError('Faculty ID does not match department\'s faculty');
            }
        }

        // Validate faculty exists
        if (data.facultyId) {
            const faculty = await this.facultyRepository.findById(data.facultyId);
            if (!faculty) {
                throw new NotFoundError('Faculty not found');
            }
        }

        // Check if email is unique
        const existingUser = await this.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new ValidationError('Email already exists');
        }

        // Check if employee ID is unique (if provided)
        if (data.employeeId) {
            const existingEmployee = await this.userRepository.findByEmployeeId(data.employeeId);
            if (existingEmployee) {
                throw new ValidationError('Employee ID already exists');
            }
        }

        // Create staff member
        const staffData = {
            email: data.email,
            password_hash: await this.userRepository.hashPassword(data.password),
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
            university_id: data.universityId,
            department_id: data.departmentId,
            faculty_id: data.facultyId,
            employee_id: data.employeeId,
            phone: data.phone,
            date_of_birth: data.dateOfBirth,
            gender: data.gender,
            address: data.address,
            qualification: data.qualification,
            specialization: data.specialization,
            experience_years: data.experienceYears,
            joining_date: data.joiningDate,
            salary: data.salary,
            contract_type: data.contractType,
            emergency_contact_name: data.emergencyContactName,
            emergency_contact_phone: data.emergencyContactPhone,
            profile_picture_url: data.profilePictureUrl,
            is_active: data.isActive !== undefined ? data.isActive : true
        };

        return await this.userRepository.create(staffData);
    }

    async update(id, data, user) {
        // Find existing staff member
        const staff = await this.userRepository.findById(id);
        if (!staff) {
            throw new NotFoundError('Staff member not found');
        }

        // Check if user is staff (not student)
        if (staff.role === 'student') {
            throw new ValidationError('This user is a student, not staff');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin') {
            throw new ForbiddenError('Only system admins and university admins can update staff');
        }

        // For non-system admins, they can only update staff in their university
        if (user.role !== 'system_admin' && staff.university_id !== user.universityId) {
            throw new ForbiddenError('You can only update staff in your university');
        }

        // Validate department and faculty relationships if being updated
        if (data.departmentId) {
            const department = await this.departmentRepository.findById(data.departmentId);
            if (!department) {
                throw new NotFoundError('Department not found');
            }

            // Auto-set faculty_id from department if not provided
            if (!data.facultyId && !staff.faculty_id) {
                data.facultyId = department.faculty_id;
            }

            // Validate faculty matches department
            if (data.facultyId && data.facultyId !== department.faculty_id) {
                throw new ValidationError('Faculty ID does not match department\'s faculty');
            }
        }

        // Validate faculty exists if being updated
        if (data.facultyId) {
            const faculty = await this.facultyRepository.findById(data.facultyId);
            if (!faculty) {
                throw new NotFoundError('Faculty not found');
            }
        }

        // Check if employee ID is unique (if being updated)
        if (data.employeeId && data.employeeId !== staff.employee_id) {
            const existingEmployee = await this.userRepository.findByEmployeeId(data.employeeId);
            if (existingEmployee) {
                throw new ValidationError('Employee ID already exists');
            }
        }

        // Update staff member
        const updateData = {
            ...data,
            updated_at: new Date()
        };

        return await this.userRepository.update(id, updateData);
    }

    async delete(id, user) {
        // Find existing staff member
        const staff = await this.userRepository.findById(id);
        if (!staff) {
            throw new NotFoundError('Staff member not found');
        }

        // Check if user is staff (not student)
        if (staff.role === 'student') {
            throw new ValidationError('This user is a student, not staff');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin') {
            throw new ForbiddenError('Only system admins and university admins can delete staff');
        }

        // For non-system admins, they can only delete staff in their university
        if (user.role !== 'system_admin' && staff.university_id !== user.universityId) {
            throw new ForbiddenError('You can only delete staff in your university');
        }

        return await this.userRepository.delete(id);
    }

    async findById(id, user) {
        const staff = await this.userRepository.findById(id);
        if (!staff) {
            throw new NotFoundError('Staff member not found');
        }

        // Check if user is staff (not student)
        if (staff.role === 'student') {
            throw new NotFoundError('Staff member not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && staff.university_id !== user.universityId) {
            throw new ForbiddenError('You can only view staff in your university');
        }

        return staff;
    }

    async findAll(options = {}, user) {
        const { universityId, facultyId, departmentId, role, page = 1, limit = 10 } = options;

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
            university_id: targetUniversityId,
            role: this.STAFF_ROLES // Only staff roles, not students
        };

        if (facultyId) {
            filters.faculty_id = facultyId;
        }

        if (departmentId) {
            filters.department_id = departmentId;
        }

        if (role && this.STAFF_ROLES.includes(role)) {
            filters.role = role;
        }

        const staff = await this.userRepository.findAll(filters, {
            limit,
            offset,
            orderBy: 'first_name',
            orderDirection: 'ASC'
        });

        const total = await this.userRepository.count(filters);

        return {
            staff,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async assignRole(id, role, user) {
        // Validate role
        if (!this.STAFF_ROLES.includes(role)) {
            throw new ValidationError('Invalid staff role');
        }

        // Find existing staff member
        const staff = await this.userRepository.findById(id);
        if (!staff) {
            throw new NotFoundError('Staff member not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin') {
            throw new ForbiddenError('Only system admins and university admins can assign roles');
        }

        // For non-system admins, they can only assign roles to staff in their university
        if (user.role !== 'system_admin' && staff.university_id !== user.universityId) {
            throw new ForbiddenError('You can only assign roles to staff in your university');
        }

        return await this.userRepository.update(id, { role, updated_at: new Date() });
    }

    async assignDepartment(id, departmentId, user) {
        // Find existing staff member
        const staff = await this.userRepository.findById(id);
        if (!staff) {
            throw new NotFoundError('Staff member not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin') {
            throw new ForbiddenError('Only system admins and university admins can assign departments');
        }

        // For non-system admins, they can only assign departments to staff in their university
        if (user.role !== 'system_admin' && staff.university_id !== user.universityId) {
            throw new ForbiddenError('You can only assign departments to staff in your university');
        }

        // Validate department exists and belongs to the same university
        const department = await this.departmentRepository.findById(departmentId);
        if (!department) {
            throw new NotFoundError('Department not found');
        }

        const faculty = await this.facultyRepository.findById(department.faculty_id);
        if (faculty.university_id !== staff.university_id) {
            throw new ValidationError('Department does not belong to the staff member\'s university');
        }

        return await this.userRepository.update(id, {
            department_id: departmentId,
            faculty_id: department.faculty_id,
            updated_at: new Date()
        });
    }

    async bulkUpload(staffData, user) {
        const results = {
            successful: [],
            failed: []
        };

        // Check permissions
        if (user.role !== 'system_admin' && user.role !== 'university_admin') {
            throw new ForbiddenError('Only system admins and university admins can bulk upload staff');
        }

        for (const staff of staffData) {
            try {
                // For non-system admins, force university_id to their university
                if (user.role !== 'system_admin') {
                    staff.universityId = user.universityId;
                }

                const createdStaff = await this.create(staff, user);
                results.successful.push({
                    email: staff.email,
                    id: createdStaff.id,
                    role: staff.role
                });
            } catch (error) {
                results.failed.push({
                    email: staff.email,
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

        // Count staff by role
        for (const role of this.STAFF_ROLES) {
            const count = await this.userRepository.count({
                university_id: universityId,
                role: role,
                is_active: true
            });
            stats[role] = count;
        }

        // Total active staff
        stats.total_active = Object.values(stats).reduce((sum, count) => sum + count, 0);

        return stats;
    }
}

module.exports = StaffService;