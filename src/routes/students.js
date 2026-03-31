const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateStudent, validateStudentUpdate, validateEnrollment, validateAcademicStatus, validateGPA, validateCredits, validateBulkUpload } = require('../middleware/validation');
const { studentRateLimit } = require('../middleware/security');

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(studentRateLimit);

// Routes for students

// Basic CRUD operations
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.post('/', authorize(['system_admin', 'university_admin']), validateStudent, studentController.createStudent);
router.put('/:id', authorize(['system_admin', 'university_admin']), validateStudentUpdate, studentController.updateStudent);
router.delete('/:id', authorize(['system_admin', 'university_admin']), studentController.deleteStudent);

// Enrollment and academic management
router.post('/:id/enroll', authorize(['system_admin', 'university_admin']), validateEnrollment, studentController.enrollInProgram);
router.put('/:id/academic-status', authorize(['system_admin', 'university_admin', 'dean', 'hod', 'exam_officer']), validateAcademicStatus, studentController.updateAcademicStatus);
router.put('/:id/gpa', authorize(['system_admin', 'university_admin', 'dean', 'hod', 'exam_officer']), validateGPA, studentController.updateGPA);
router.put('/:id/credits', authorize(['system_admin', 'university_admin', 'dean', 'hod', 'exam_officer']), validateCredits, studentController.updateCredits);

// Bulk operations
router.post('/bulk-upload', authorize(['system_admin', 'university_admin']), validateBulkUpload, studentController.bulkUploadStudents);

// Hierarchical queries
router.get('/university/:universityId', studentController.getStudentsByUniversity);
router.get('/faculty/:facultyId', studentController.getStudentsByFaculty);
router.get('/department/:departmentId', studentController.getStudentsByDepartment);
router.get('/program/:programId', studentController.getStudentsByProgram);

// Specialized queries
router.get('/university/:universityId/enrollment-year/:year', studentController.getStudentsByEnrollmentYear);
router.get('/university/:universityId/graduating/:year', studentController.getGraduatingStudents);

// Statistics
router.get('/stats', studentController.getStudentStats);

module.exports = router;