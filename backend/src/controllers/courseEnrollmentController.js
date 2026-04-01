const courseEnrollmentService = require('../services/courseEnrollmentService');
const { AppError } = require('../utils/helpers');

class CourseEnrollmentController {
    async enrollStudent(req, res, next) {
        try {
            const { studentId, courseId, semester, academicYear } = req.body;
            const { universityId, departmentId } = req.query;
            
            const enrollment = await courseEnrollmentService.enrollStudent({
                studentId,
                courseId,
                universityId: universityId || req.user.university_id,
                departmentId,
                semester,
                academicYear,
                tenantId: req.user.tenant_id,
                createdBy: req.user.id
            });

            res.status(201).json({
                status: 'success',
                message: 'Student enrolled successfully',
                data: enrollment
            });
        } catch (error) {
            next(error);
        }
    }

    async dropCourse(req, res, next) {
        try {
            const { enrollmentId } = req.params;
            const { reason } = req.body;

            const updated = await courseEnrollmentService.dropCourse(enrollmentId, reason);

            res.status(200).json({
                status: 'success',
                message: 'Course dropped successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    async recordGrade(req, res, next) {
        try {
            const { enrollmentId } = req.params;
            const gradeData = req.body;

            const updated = await courseEnrollmentService.recordGrade(enrollmentId, gradeData);

            res.status(200).json({
                status: 'success',
                message: 'Grade recorded successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    async recordAttendance(req, res, next) {
        try {
            const { enrollmentId } = req.params;
            const { attendancePercentage } = req.body;

            const updated = await courseEnrollmentService.recordAttendance(enrollmentId, {
                attendancePercentage
            });

            res.status(200).json({
                status: 'success',
                message: 'Attendance recorded successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    async getStudentEnrollments(req, res, next) {
        try {
            const { studentId } = req.params;
            const { semester, academicYear, status, limit, offset } = req.query;

            const enrollments = await courseEnrollmentService.getStudentEnrollments(
                studentId,
                {
                    semester,
                    academicYear: academicYear ? parseInt(academicYear) : null,
                    status,
                    limit: limit ? parseInt(limit) : null,
                    offset: offset ? parseInt(offset) : null
                }
            );

            res.status(200).json({
                status: 'success',
                message: 'Student enrollments retrieved successfully',
                data: enrollments,
                count: enrollments.length
            });
        } catch (error) {
            next(error);
        }
    }

    async getCourseEnrollments(req, res, next) {
        try {
            const { courseId } = req.params;
            const { semester, academicYear, status, limit, offset } = req.query;

            const enrollments = await courseEnrollmentService.getCourseEnrollments(
                courseId,
                {
                    semester,
                    academicYear: academicYear ? parseInt(academicYear) : null,
                    status,
                    limit: limit ? parseInt(limit) : null,
                    offset: offset ? parseInt(offset) : null
                }
            );

            res.status(200).json({
                status: 'success',
                message: 'Course enrollments retrieved successfully',
                data: enrollments,
                count: enrollments.length
            });
        } catch (error) {
            next(error);
        }
    }

    async getStudentTranscript(req, res, next) {
        try {
            const { studentId } = req.params;
            const { academicYear } = req.query;

            const transcript = await courseEnrollmentService.getStudentTranscript(
                studentId,
                academicYear ? parseInt(academicYear) : null
            );

            res.status(200).json({
                status: 'success',
                message: 'Student transcript retrieved successfully',
                data: transcript
            });
        } catch (error) {
            next(error);
        }
    }

    async getStudentGPA(req, res, next) {
        try {
            const { studentId } = req.params;

            const gpaData = await courseEnrollmentService.getStudentGPA(studentId);

            res.status(200).json({
                status: 'success',
                message: 'Student GPA retrieved successfully',
                data: gpaData
            });
        } catch (error) {
            next(error);
        }
    }

    async getSemesterGPA(req, res, next) {
        try {
            const { studentId, semester, academicYear } = req.params;

            const semesterGPA = await courseEnrollmentService.getSemesterGPA(
                studentId,
                semester,
                parseInt(academicYear)
            );

            res.status(200).json({
                status: 'success',
                message: 'Semester GPA calculated successfully',
                data: semesterGPA
            });
        } catch (error) {
            next(error);
        }
    }

    async getStudentCGPA(req, res, next) {
        try {
            const { studentId } = req.params;
            const { upToAcademicYear, upToSemester } = req.query;

            const cgpaData = await courseEnrollmentService.getStudentCGPA(
                studentId,
                upToAcademicYear ? parseInt(upToAcademicYear) : null,
                upToSemester
            );

            res.status(200).json({
                status: 'success',
                message: 'Student CGPA calculated successfully',
                data: cgpaData
            });
        } catch (error) {
            next(error);
        }
    }

    async getGPAProjection(req, res, next) {
        try {
            const { studentId } = req.params;
            const { remainingCourses } = req.body;

            if (!remainingCourses || !Array.isArray(remainingCourses)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'remainingCourses array is required'
                });
            }

            const projection = await courseEnrollmentService.getGPAProjection(
                studentId,
                remainingCourses
            );

            res.status(200).json({
                status: 'success',
                message: 'GPA projection calculated successfully',
                data: projection
            });
        } catch (error) {
            next(error);
        }
    }

    async getSemesterEnrollments(req, res, next) {
        try {
            const { semester, academicYear } = req.params;
            const { department, limit, offset } = req.query;
            const universityId = req.query.universityId || req.user.university_id;

            const enrollments = await courseEnrollmentService.getSemesterEnrollments(
                universityId,
                semester,
                parseInt(academicYear),
                {
                    department: department ? parseInt(department) : null,
                    limit: limit ? parseInt(limit) : null,
                    offset: offset ? parseInt(offset) : null
                }
            );

            res.status(200).json({
                status: 'success',
                message: 'Semester enrollments retrieved successfully',
                data: enrollments,
                count: enrollments.length
            });
        } catch (error) {
            next(error);
        }
    }

    async bulkEnrollStudents(req, res, next) {
        try {
            const { enrollments } = req.body;

            if (!Array.isArray(enrollments) || enrollments.length === 0) {
                throw new AppError('Enrollments array is required and must not be empty', 400);
            }

            const result = await courseEnrollmentService.bulkEnrollStudents(
                enrollments,
                req.user.tenant_id,
                req.user.id
            );

            res.status(201).json({
                status: 'success',
                message: 'Bulk enrollment completed',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getCourseStatistics(req, res, next) {
        try {
            const { courseId } = req.params;
            const { semester, academicYear } = req.query;

            if (!semester || !academicYear) {
                throw new AppError('Semester and academicYear are required', 400);
            }

            const stats = await courseEnrollmentService.getCourseStatistics(
                courseId,
                semester,
                parseInt(academicYear)
            );

            res.status(200).json({
                status: 'success',
                message: 'Course statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    async generateAcademicReport(req, res, next) {
        try {
            const { studentId } = req.params;
            const { academicYear } = req.query;

            if (!academicYear) {
                throw new AppError('Academic year is required', 400);
            }

            const report = await courseEnrollmentService.generateAcademicReport(
                studentId,
                parseInt(academicYear)
            );

            res.status(200).json({
                status: 'success',
                message: 'Academic report generated successfully',
                data: report
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteEnrollment(req, res, next) {
        try {
            const { enrollmentId } = req.params;

            const deleted = await courseEnrollmentService.deleteEnrollment(enrollmentId);

            res.status(200).json({
                status: 'success',
                message: 'Enrollment deleted successfully',
                data: deleted
            });
        } catch (error) {
            next(error);
        }
    }

    async getEnrollmentById(req, res, next) {
        try {
            const { enrollmentId } = req.params;

            const courseEnrollmentRepository = require('../repositories/courseEnrollmentRepository');
            const enrollment = await courseEnrollmentRepository.findById(enrollmentId);

            if (!enrollment) {
                throw new AppError('Enrollment not found', 404);
            }

            res.status(200).json({
                status: 'success',
                message: 'Enrollment retrieved successfully',
                data: enrollment
            });
        } catch (error) {
            next(error);
        }
    }

    async updateEnrollment(req, res, next) {
        try {
            const { enrollmentId } = req.params;
            const updateData = req.body;

            const courseEnrollmentRepository = require('../repositories/courseEnrollmentRepository');
            const updated = await courseEnrollmentRepository.update(enrollmentId, {
                ...updateData,
                updated_at: new Date().toISOString()
            });

            res.status(200).json({
                status: 'success',
                message: 'Enrollment updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CourseEnrollmentController();
