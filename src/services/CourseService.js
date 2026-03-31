const CourseRepository = require('../repositories/CourseRepository');
const DepartmentRepository = require('../repositories/DepartmentRepository');
const FacultyRepository = require('../repositories/FacultyRepository');
const UserRepository = require('../repositories/UserRepository');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

class CourseService {
    constructor() {
        this.courseRepository = new CourseRepository();
        this.departmentRepository = new DepartmentRepository();
        this.facultyRepository = new FacultyRepository();
        this.userRepository = new UserRepository();
    }

    async create(data, user) {
        // Validate required fields
        if (!data.name || !data.code || !data.departmentId || !data.credits) {
            throw new ValidationError('Name, code, department ID, and credits are required');
        }

        // Check if department exists and user has access
        const department = await this.departmentRepository.findById(data.departmentId);
        if (!department) {
            throw new NotFoundError('Department not found');
        }

        // Check permissions
        const faculty = await this.facultyRepository.findById(department.faculty_id);
        if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
            throw new ForbiddenError('You can only create courses in your university');
        }

        // Check if code is unique within department
        const existingCourse = await this.courseRepository.findByCode(data.code, data.departmentId);
        if (existingCourse) {
            throw new ValidationError('Course code already exists in this department');
        }

        // Validate lecturer if provided
        if (data.lecturerId) {
            const lecturer = await this.userRepository.findById(data.lecturerId);
            if (!lecturer || lecturer.role !== 'lecturer') {
                throw new ValidationError('Invalid lecturer ID');
            }
            if (user.role !== 'system_admin' && lecturer.university_id !== user.universityId) {
                throw new ForbiddenError('Lecturer must belong to your university');
            }
        }

        // Create course
        const courseData = {
            name: data.name,
            code: data.code,
            description: data.description || null,
            credits: data.credits,
            course_type: data.courseType || 'core',
            semester: data.semester || null,
            year: data.year || null,
            department_id: data.departmentId,
            faculty_id: department.faculty_id,
            university_id: faculty.university_id,
            lecturer_id: data.lecturerId || null,
            max_students: data.maxStudents || null,
            prerequisites: data.prerequisites || null,
            syllabus_url: data.syllabusUrl || null,
            status: data.status || 'active',
            created_by: user.id,
            updated_by: user.id
        };

        return await this.courseRepository.create(courseData);
    }

    async update(id, data, user) {
        // Find existing course
        const course = await this.courseRepository.findById(id);
        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== course.university_id) {
            throw new ForbiddenError('You can only update courses in your university');
        }

        // Check if code is unique within department (if being updated)
        if (data.code && data.code !== course.code) {
            const existingCourse = await this.courseRepository.findByCode(data.code, course.department_id);
            if (existingCourse) {
                throw new ValidationError('Course code already exists in this department');
            }
        }

        // Validate lecturer if provided
        if (data.lecturerId) {
            const lecturer = await this.userRepository.findById(data.lecturerId);
            if (!lecturer || lecturer.role !== 'lecturer') {
                throw new ValidationError('Invalid lecturer ID');
            }
            if (user.role !== 'system_admin' && lecturer.university_id !== user.universityId) {
                throw new ForbiddenError('Lecturer must belong to your university');
            }
        }

        // Update course
        const updateData = {
            ...data,
            updated_by: user.id,
            updated_at: new Date()
        };

        return await this.courseRepository.update(id, updateData);
    }

    async delete(id, user) {
        // Find existing course
        const course = await this.courseRepository.findById(id);
        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== course.university_id) {
            throw new ForbiddenError('You can only delete courses in your university');
        }

        // Check if course has enrolled students (would need to check enrollment table)
        // For now, we'll allow deletion but this should be checked in a real implementation

        return await this.courseRepository.delete(id);
    }

    async findById(id, user) {
        const course = await this.courseRepository.findById(id);
        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== course.university_id) {
            throw new ForbiddenError('You can only view courses in your university');
        }

        return course;
    }

    async findAll(options = {}, user) {
        const { departmentId, facultyId, lecturerId, universityId, semester, year, page = 1, limit = 10 } = options;

        // Determine scope based on user role
        let targetDepartmentId = departmentId;
        let targetFacultyId = facultyId;
        let targetLecturerId = lecturerId;
        let targetUniversityId = universityId;

        if (user.role !== 'system_admin') {
            targetUniversityId = user.universityId;
        }

        let courses;
        let total;

        if (targetLecturerId) {
            // Get courses for specific lecturer
            const lecturer = await this.userRepository.findById(targetLecturerId);
            if (!lecturer || lecturer.role !== 'lecturer') {
                throw new ValidationError('Invalid lecturer ID');
            }
            if (user.role !== 'system_admin' && lecturer.university_id !== user.universityId) {
                throw new ForbiddenError('You can only view courses for lecturers in your university');
            }

            const offset = (page - 1) * limit;
            courses = await this.courseRepository.findByLecturerId(targetLecturerId, {
                limit,
                offset,
                orderBy: 'name',
                orderDirection: 'ASC'
            });
            total = await this.courseRepository.countByLecturerId(targetLecturerId);
        } else if (targetDepartmentId) {
            // Get courses for specific department
            const department = await this.departmentRepository.findById(targetDepartmentId);
            if (!department) {
                throw new NotFoundError('Department not found');
            }

            const faculty = await this.facultyRepository.findById(department.faculty_id);
            if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
                throw new ForbiddenError('You can only view courses in your university');
            }

            const offset = (page - 1) * limit;
            courses = await this.courseRepository.findByDepartmentId(targetDepartmentId, {
                limit,
                offset,
                orderBy: 'name',
                orderDirection: 'ASC'
            });
            total = await this.courseRepository.countByDepartmentId(targetDepartmentId);
        } else if (targetFacultyId) {
            // Get courses for specific faculty
            const faculty = await this.facultyRepository.findById(targetFacultyId);
            if (!faculty) {
                throw new NotFoundError('Faculty not found');
            }

            if (user.role !== 'system_admin' && user.universityId !== faculty.university_id) {
                throw new ForbiddenError('You can only view courses in your university');
            }

            const offset = (page - 1) * limit;
            courses = await this.courseRepository.findByFacultyId(targetFacultyId, {
                limit,
                offset,
                orderBy: 'name',
                orderDirection: 'ASC'
            });
            total = await this.courseRepository.countByFacultyId(targetFacultyId);
        } else if (targetUniversityId) {
            // Get all courses for university
            const offset = (page - 1) * limit;
            courses = await this.courseRepository.findByUniversityId(targetUniversityId, {
                limit,
                offset,
                orderBy: 'name',
                orderDirection: 'ASC'
            });
            total = await this.courseRepository.countByUniversityId(targetUniversityId);
        } else {
            throw new ValidationError('Department ID, Faculty ID, Lecturer ID, or University ID is required');
        }

        return {
            courses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async assignLecturer(courseId, lecturerId, user) {
        // Find existing course
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== course.university_id) {
            throw new ForbiddenError('You can only assign lecturers to courses in your university');
        }

        // Validate lecturer
        const lecturer = await this.userRepository.findById(lecturerId);
        if (!lecturer || lecturer.role !== 'lecturer') {
            throw new ValidationError('Invalid lecturer ID');
        }

        if (user.role !== 'system_admin' && lecturer.university_id !== user.universityId) {
            throw new ForbiddenError('Lecturer must belong to your university');
        }

        return await this.courseRepository.assignLecturer(courseId, lecturerId);
    }

    async removeLecturer(courseId, user) {
        // Find existing course
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Check permissions
        if (user.role !== 'system_admin' && user.universityId !== course.university_id) {
            throw new ForbiddenError('You can only remove lecturers from courses in your university');
        }

        return await this.courseRepository.removeLecturer(courseId);
    }

    async getLecturer(courseId, user) {
        // Check course access
        const course = await this.findById(courseId, user);
        return await this.courseRepository.getLecturer(courseId);
    }

    async getDepartment(courseId, user) {
        // Check course access
        const course = await this.findById(courseId, user);
        return await this.courseRepository.getDepartment(courseId);
    }

    async getFaculty(courseId, user) {
        // Check course access
        const course = await this.findById(courseId, user);
        return await this.courseRepository.getFaculty(courseId);
    }

    async getAvailableCourses(options = {}, user) {
        const { semester, year, page = 1, limit = 10 } = options;

        if (user.role !== 'system_admin' && !user.universityId) {
            throw new ValidationError('University ID is required for non-system admins');
        }

        const universityId = user.role === 'system_admin' ? options.universityId : user.universityId;

        if (!universityId) {
            throw new ValidationError('University ID is required');
        }

        const offset = (page - 1) * limit;
        const courses = await this.courseRepository.findAvailableCourses(universityId, {
            semester,
            year,
            limit,
            offset
        });

        // For available courses, we don't need total count as it's a filtered query
        return {
            courses,
            pagination: {
                page,
                limit,
                total: courses.length, // This is approximate for available courses
                pages: Math.ceil(courses.length / limit)
            }
        };
    }

    async getStats(courseId, user) {
        // Check course access
        const course = await this.findById(courseId, user);

        return {
            courseId,
            currentStudents: course.current_students || 0,
            maxStudents: course.max_students,
            isFull: course.max_students ? course.current_students >= course.max_students : false
        };
    }
}

module.exports = CourseService;