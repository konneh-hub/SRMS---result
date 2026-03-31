const express = require('express');
const courseEnrollmentController = require('../controllers/courseEnrollmentController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateCourseEnrollment,
  validateGradeRecording,
  validateAttendanceRecording,
  validateDropCourse,
  validateBulkEnrollment,
  validateGPAProjection
} = require('../middleware/validation');
const { enrollmentRateLimit } = require('../middleware/security');

const router = express.Router();

// All routes are protected by authentication and rate limiting
router.use(authenticate);
router.use(enrollmentRateLimit);

// Student enrollment routes
/**
 * POST /enrollments
 * Enroll a student in a course for a specific semester
 * Requires: student_id, course_id, semester, academic_year
 * Roles: exam_officer, dean, hod, student (own enrollment only)
 */
router.post(
  '/',
  authorize(['exam_officer', 'dean', 'hod', 'lecturer', 'university_admin']),
  validateCourseEnrollment,
  courseEnrollmentController.enrollStudent
);

/**
 * POST /enrollments/bulk
 * Bulk enroll multiple students in courses
 * Requires: array of enrollment objects
 * Roles: exam_officer, university_admin
 */
router.post(
  '/bulk',
  authorize(['exam_officer', 'university_admin']),
  validateBulkEnrollment,
  courseEnrollmentController.bulkEnrollStudents
);

/**
 * GET /enrollments/student/:studentId
 * Get all enrollments for a specific student
 * Optional filters: semester, academicYear, status, limit, offset
 * Roles: any authenticated user (students can only view their own)
 */
router.get('/student/:studentId', courseEnrollmentController.getStudentEnrollments);

/**
 * GET /enrollments/course/:courseId
 * Get all student enrollments in a specific course
 * Optional filters: semester, academicYear, status, limit, offset
 * Roles: lecturer, exam_officer, dean, hod, university_admin
 */
router.get(
  '/course/:courseId',
  authorize(['exam_officer', 'dean', 'hod', 'lecturer', 'university_admin']),
  courseEnrollmentController.getCourseEnrollments
);

/**
 * GET /enrollments/transcript/:studentId
 * Get student academic transcript (completed courses)
 * Optional filter: academicYear
 * Roles: any authenticated user (students can only view their own)
 */
router.get(
  '/transcript/:studentId',
  courseEnrollmentController.getStudentTranscript
);

/**
 * GET /enrollments/gpa/:studentId
 * Get student cumulative GPA
 * Roles: any authenticated user (students can only view their own)
 */
router.get('/gpa/:studentId', courseEnrollmentController.getStudentGPA);

/**
 * GET /enrollments/semester-gpa/:studentId/:semester/:academicYear
 * Get student GPA for a specific semester
 * Roles: any authenticated user (students can only view their own)
 */
router.get(
  '/semester-gpa/:studentId/:semester/:academicYear',
  courseEnrollmentController.getSemesterGPA
);

/**
 * GET /enrollments/cgpa/:studentId
 * Get student cumulative GPA (CGPA)
 * Optional query params: upToAcademicYear, upToSemester
 * Roles: any authenticated user (students can only view their own)
 */
router.get('/cgpa/:studentId', courseEnrollmentController.getStudentCGPA);

/**
 * POST /enrollments/gpa-projection/:studentId
 * Calculate GPA projection for remaining courses
 * Body: { remainingCourses: [{ credits: number, targetGrade: string }] }
 * Roles: any authenticated user (students can only view their own)
 */
router.post(
  '/gpa-projection/:studentId',
  validateGPAProjection,
  courseEnrollmentController.getGPAProjection
);

/**
 * GET /enrollments/semester/:semester/:academicYear
 * Get all enrollments for a specific semester and academic year
 * Optional filters: department, limit, offset
 * Roles: exam_officer, dean, hod, university_admin
 */
router.get(
  '/semester/:semester/:academicYear',
  authorize(['exam_officer', 'dean', 'hod', 'university_admin']),
  courseEnrollmentController.getSemesterEnrollments
);

/**
 * GET /enrollments/stats/:courseId
 * Get course enrollment statistics
 * Required query params: semester, academicYear
 * Roles: lecturer, exam_officer, dean, hod, university_admin
 */
router.get(
  '/stats/:courseId',
  authorize(['exam_officer', 'lecturer', 'dean', 'hod', 'university_admin']),
  courseEnrollmentController.getCourseStatistics
);

/**
 * GET /enrollments/report/:studentId
 * Generate academic report for a student
 * Required query param: academicYear
 * Roles: exam_officer, dean, hod, student (own report only)
 */
router.get(
  '/report/:studentId',
  courseEnrollmentController.generateAcademicReport
);

/**
 * GET /enrollments/:enrollmentId
 * Get details of a specific enrollment
 * Roles: any authenticated user
 */
router.get('/:enrollmentId', courseEnrollmentController.getEnrollmentById);

/**
 * PUT /enrollments/:enrollmentId/grade
 * Record/update grades for a student in a course
 * Requires: grade, gradePoints, totalScore, creditsEarned (at least one)
 * Optional: midtermScore, finalScore
 * Roles: exam_officer, lecturer
 */
router.put(
  '/:enrollmentId/grade',
  authorize(['exam_officer', 'lecturer']),
  validateGradeRecording,
  courseEnrollmentController.recordGrade
);

/**
 * PUT /enrollments/:enrollmentId/attendance
 * Record attendance percentage for a student in a course
 * Requires: attendancePercentage (0-100)
 * Roles: exam_officer, lecturer
 */
router.put(
  '/:enrollmentId/attendance',
  authorize(['exam_officer', 'lecturer']),
  validateAttendanceRecording,
  courseEnrollmentController.recordAttendance
);

/**
 * PUT /enrollments/:enrollmentId
 * Update enrollment details (general update)
 * Roles: exam_officer, dean, hod, university_admin
 */
router.put(
  '/:enrollmentId',
  authorize(['exam_officer', 'dean', 'hod', 'university_admin']),
  courseEnrollmentController.updateEnrollment
);

/**
 * DELETE /enrollments/:enrollmentId
 * Drop/withdraw from a course
 * Optional: reason
 * Roles: exam_officer, student (own enrollment only)
 */
router.delete(
  '/:enrollmentId',
  authorize(['exam_officer', 'student', 'dean', 'hod']),
  validateDropCourse,
  courseEnrollmentController.dropCourse
);

module.exports = router;
