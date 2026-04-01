const courseEnrollmentRepository = require('../repositories/courseEnrollmentRepository');
const CourseRepository = require('../repositories/CourseRepository');
const studentRepository = require('../repositories/studentRepository');
const gpaCalculationService = require('./gpaCalculationService');
const { AppError } = require('../utils/helpers');

class CourseEnrollmentService {
    async enrollStudent(enrollmentData) {
        const { studentId, courseId, universityId, departmentId, semester, academicYear, tenantId, createdBy } = enrollmentData;

        // Validate student exists
        const student = await studentRepository.findById(studentId);
        if (!student) {
            throw new AppError('Student not found', 404);
        }

        // Validate course exists
        const course = await CourseRepository.findById(courseId);
        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Check if student already enrolled in this course for the same semester/year
        const existingEnrollment = await courseEnrollmentRepository.findByStudentAndCourse(
            studentId,
            courseId,
            semester,
            academicYear
        );

        if (existingEnrollment && existingEnrollment.status !== 'dropped' && existingEnrollment.status !== 'failed') {
            throw new AppError('Student is already enrolled in this course for the specified semester/year', 400);
        }

        // Create enrollment
        const enrollment = await courseEnrollmentRepository.create({
            student_id: studentId,
            course_id: courseId,
            university_id: universityId,
            department_id: departmentId,
            semester,
            academic_year: academicYear,
            status: 'enrolled',
            enrollment_date: new Date().toISOString().split('T')[0],
            tenant_id: tenantId,
            created_by: createdBy,
            updated_by: createdBy
        });

        return enrollment;
    }

    async dropCourse(enrollmentId, reason = null) {
        const enrollment = await courseEnrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
            throw new AppError('Enrollment record not found', 404);
        }

        if (enrollment.status === 'completed' || enrollment.status === 'dropped') {
            throw new AppError('Cannot drop a completed or already dropped course', 400);
        }

        const updated = await courseEnrollmentRepository.update(enrollmentId, {
            status: 'dropped',
            drop_reason: reason
        });

        return updated;
    }

    async completeEnrollment(enrollmentId) {
        const enrollment = await courseEnrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
            throw new AppError('Enrollment record not found', 404);
        }

        const updated = await courseEnrollmentRepository.update(enrollmentId, {
            status: 'completed',
            is_completed: true,
            completion_date: new Date().toISOString().split('T')[0]
        });

        return updated;
    }

    async recordGrade(enrollmentId, gradeData) {
        const { grade, gradePoints, midtermScore, finalScore, totalScore, creditsEarned } = gradeData;

        const enrollment = await courseEnrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
            throw new AppError('Enrollment record not found', 404);
        }

        // Get student info for university grading scale
        const student = await studentRepository.findById(enrollment.student_id);
        if (!student) {
            throw new AppError('Student not found', 404);
        }

        // Validate scores
        if (midtermScore && (midtermScore < 0 || midtermScore > 100)) {
            throw new AppError('Midterm score must be between 0 and 100', 400);
        }
        if (finalScore && (finalScore < 0 || finalScore > 100)) {
            throw new AppError('Final score must be between 0 and 100', 400);
        }
        if (totalScore && (totalScore < 0 || totalScore > 100)) {
            throw new AppError('Total score must be between 0 and 100', 400);
        }

        const updateData = {
            midterm_score: midtermScore,
            final_score: finalScore,
            total_score: totalScore,
            credits_earned: creditsEarned
        };

        // If total score is provided, automatically determine grade and grade points
        if (totalScore !== undefined) {
            const gradeInfo = await gpaCalculationService.getGradeFromScore(totalScore, student.university_id);
            updateData.grade = gradeInfo.grade;
            updateData.grade_points = gradeInfo.gradePoint;

            // Determine status based on grade
            if (gradeInfo.grade === 'F') {
                updateData.status = 'failed';
            } else {
                updateData.status = 'completed';
            }
        } else if (grade && gradePoints) {
            // Manual grade entry
            updateData.grade = grade;
            updateData.grade_points = gradePoints;

            // Validate grade points
            if (gradePoints < 0 || gradePoints > 5.0) {
                throw new AppError('Grade points must be between 0 and 5.0', 400);
            }

            // Determine status based on grade
            if (grade === 'F') {
                updateData.status = 'failed';
            } else {
                updateData.status = 'completed';
            }
        }

        const updated = await courseEnrollmentRepository.update(enrollmentId, updateData);

        return updated;
    }

    async recordAttendance(enrollmentId, attendanceData) {
        const { attendancePercentage } = attendanceData;

        const enrollment = await courseEnrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
            throw new AppError('Enrollment record not found', 404);
        }

        if (attendancePercentage && (attendancePercentage < 0 || attendancePercentage > 100)) {
            throw new AppError('Attendance percentage must be between 0 and 100', 400);
        }

        const updated = await courseEnrollmentRepository.update(enrollmentId, {
            attendance_percentage: attendancePercentage
        });

        return updated;
    }

    async getStudentEnrollments(studentId, options = {}) {
        const enrollments = await courseEnrollmentRepository.findByStudent(studentId, options);
        return enrollments;
    }

    async getCourseEnrollments(courseId, options = {}) {
        const enrollments = await courseEnrollmentRepository.findByCourse(courseId, options);
        return enrollments;
    }

    async getStudentTranscript(studentId, academicYear = null) {
        // Use the comprehensive GPA calculation service for transcript generation
        const transcript = await gpaCalculationService.generateTranscript(studentId);

        // If specific academic year is requested, filter the results
        if (academicYear) {
            transcript.semesterPerformance = transcript.semesterPerformance.filter(
                semester => semester.academicYear === parseInt(academicYear)
            );
            // Recalculate summary for filtered data
            const filteredSemesters = transcript.semesterPerformance;
            if (filteredSemesters.length > 0) {
                const totalCredits = filteredSemesters.reduce((sum, sem) => sum + sem.creditsEarned, 0);
                const weightedGPASum = filteredSemesters.reduce((sum, sem) => sum + (sem.gpa * sem.creditsEarned), 0);
                transcript.academicSummary.cgpa = totalCredits > 0 ? parseFloat((weightedGPASum / totalCredits).toFixed(2)) : 0.0;
                transcript.academicSummary.totalCreditsEarned = totalCredits;
                transcript.academicSummary.totalCoursesCompleted = filteredSemesters.reduce((sum, sem) => sum + sem.coursesCount, 0);
                transcript.academicSummary.semestersCompleted = filteredSemesters.length;
            }
        }

        return transcript;
    }

    async getStudentGPA(studentId) {
        const gpaData = await courseEnrollmentRepository.getStudentGPA(studentId);
        return {
            studentId,
            gpa: parseFloat(gpaData.gpa || 0).toFixed(2),
            totalCredits: gpaData.total_credits || 0,
            coursesTaken: gpaData.courses_taken || 0,
            coursesCompleted: gpaData.courses_completed || 0
        };
    }

    /**
     * Calculate GPA for a specific semester
     * @param {number} studentId - Student ID
     * @param {string} semester - Semester (fall, spring, summer, winter)
     * @param {number} academicYear - Academic year
     * @returns {Object} Semester GPA data
     */
    async getSemesterGPA(studentId, semester, academicYear) {
        return await gpaCalculationService.calculateSemesterGPA(studentId, semester, academicYear);
    }

    /**
     * Calculate Cumulative GPA (CGPA) for a student
     * @param {number} studentId - Student ID
     * @param {number} upToAcademicYear - Optional: Calculate CGPA up to this academic year
     * @param {string} upToSemester - Optional: Calculate CGPA up to this semester
     * @returns {Object} CGPA data
     */
    async getStudentCGPA(studentId, upToAcademicYear = null, upToSemester = null) {
        return await gpaCalculationService.calculateCGPA(studentId, upToAcademicYear, upToSemester);
    }

    /**
     * Calculate GPA projection for remaining courses
     * @param {number} studentId - Student ID
     * @param {Array} remainingCourses - Array of {credits, targetGrade} objects
     * @returns {Object} GPA projection data
     */
    async getGPAProjection(studentId, remainingCourses) {
        return await gpaCalculationService.calculateGPAProjection(studentId, remainingCourses);
    }

    async getSemesterEnrollments(universityId, semester, academicYear, options = {}) {
        const enrollments = await courseEnrollmentRepository.findBySemesterAndYear(
            universityId,
            semester,
            academicYear,
            options
        );
        return enrollments;
    }

    async bulkEnrollStudents(enrollments, tenantId, createdBy) {
        // Validate all enrollments first
        for (const enrollment of enrollments) {
            const student = await studentRepository.findById(enrollment.student_id);
            if (!student) {
                throw new AppError(`Student ${enrollment.student_id} not found`, 404);
            }

            const course = await CourseRepository.findById(enrollment.course_id);
            if (!course) {
                throw new AppError(`Course ${enrollment.course_id} not found`, 404);
            }
        }

        // Add system fields
        const enrollmentsWithMetadata = enrollments.map(e => ({
            ...e,
            tenant_id: tenantId,
            created_by: createdBy,
            updated_by: createdBy
        }));

        const results = await courseEnrollmentRepository.bulkEnroll(enrollmentsWithMetadata);
        return {
            total: results.length,
            successful: results.length,
            enrollments: results
        };
    }

    async getCourseStatistics(courseId, semester, academicYear) {
        const enrolledCount = await courseEnrollmentRepository.countStudentsInCourse(courseId, semester, academicYear, 'enrolled');
        const completedCount = await courseEnrollmentRepository.countStudentsInCourse(courseId, semester, academicYear, 'completed');
        const failedCount = await courseEnrollmentRepository.countStudentsInCourse(courseId, semester, academicYear, 'failed');
        const droppedCount = await courseEnrollmentRepository.countStudentsInCourse(courseId, semester, academicYear, 'dropped');

        return {
            courseId,
            semester,
            academicYear,
            totalEnrollments: enrolledCount + completedCount + failedCount + droppedCount,
            enrolled: enrolledCount,
            completed: completedCount,
            failed: failedCount,
            dropped: droppedCount,
            activeEnrollments: enrolledCount
        };
    }

    async deleteEnrollment(enrollmentId) {
        const enrollment = await courseEnrollmentRepository.findById(enrollmentId);
        if (!enrollment) {
            throw new AppError('Enrollment record not found', 404);
        }

        // Only allow deletion if the enrollment is still in 'enrolled' status and recently created
        const enrollmentDate = new Date(enrollment.enrollment_date);
        const daysSinceEnrollment = (new Date() - enrollmentDate) / (1000 * 60 * 60 * 24);

        if (enrollment.status !== 'enrolled' || daysSinceEnrollment > 30) {
            throw new AppError('Cannot delete this enrollment. Use drop course instead.', 400);
        }

        const deleted = await courseEnrollmentRepository.delete(enrollmentId);
        return deleted;
    }

    async generateAcademicReport(studentId, academicYear) {
        const transcript = await this.getStudentTranscript(studentId, academicYear);
        const gpa = await this.getStudentGPA(studentId);

        const student = await studentRepository.findById(studentId);

        return {
            student: {
                id: student.id,
                studentId: student.student_id,
                name: `${student.first_name} ${student.last_name}`,
                email: student.email,
                program: student.program_id
            },
            academicYear,
            transcript: transcript.courses,
            gpa: gpa.gpa,
            totalCreditsEarned: transcript.summary.totalCreditsEarned,
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = new CourseEnrollmentService();
