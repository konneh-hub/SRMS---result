const express = require('express');
const resultController = require('../controllers/resultController');
const resultApprovalWorkflowController = require('../controllers/resultApprovalWorkflowController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validateResultSubmissionCreation,
  validateScoresUpload,
  validateScoresUpdate,
  validateSubmissionApproval,
  validateSubmissionRejection,
  validateExamOfficerValidation,
  validateHODApproval,
  validateDeanApproval,
  validateRecallSubmission
} = require('../middleware/validation');
const { resultRateLimit } = require('../middleware/security');

const router = express.Router();

// All routes are protected by authentication and rate limiting
router.use(authenticate);
router.use(resultRateLimit);

// Lecturer Routes
/**
 * POST /results/submission
 * Create a new draft result submission
 * Requires: courseId, semester, academicYear
 * Roles: lecturer, exam_officer
 */
router.post(
  '/submission',
  authorize(['lecturer', 'exam_officer']),
  validateResultSubmissionCreation,
  resultController.createDraftSubmission
);

/**
 * GET /results/my-submissions
 * Get all submissions created by the current lecturer
 * Optional filters: semester, academicYear, status, limit, offset
 * Roles: lecturer, exam_officer
 */
router.get(
  '/my-submissions',
  authorize(['lecturer', 'exam_officer']),
  resultController.getMySubmissions
);

/**
 * POST /results/submission/:submissionId/upload
 * Upload scores for a submission (draft status)
 * Requires: array of score objects with studentId, score, midterm, final
 * Roles: lecturer (creator), exam_officer
 */
router.post(
  '/submission/:submissionId/upload',
  authorize(['lecturer', 'exam_officer']),
  validateScoresUpload,
  resultController.uploadScores
);

/**
 * PUT /results/submission/:submissionId/update
 * Update scores in a draft submission
 * Requires: array of partial score updates
 * Roles: lecturer (creator), exam_officer
 */
router.put(
  '/submission/:submissionId/update',
  authorize(['lecturer', 'exam_officer']),
  validateScoresUpdate,
  resultController.updateScores
);

/**
 * POST /results/submission/:submissionId/submit
 * Submit result submission for approval (draft → submitted)
 * Roles: lecturer (creator), exam_officer
 */
router.post(
  '/submission/:submissionId/submit',
  authorize(['lecturer', 'exam_officer']),
  resultController.submitForApproval
);

/**
 * POST /results/submission/:submissionId/recall
 * Recall a submitted submission back to draft status
 * Roles: lecturer (creator), exam_officer
 */
router.post(
  '/submission/:submissionId/recall',
  authorize(['lecturer', 'exam_officer']),
  resultController.recallSubmission
);

/**
 * DELETE /results/submission/:submissionId
 * Delete a draft submission
 * Roles: lecturer (creator)
 */
router.delete(
  '/submission/:submissionId',
  authorize(['lecturer', 'exam_officer']),
  resultController.deleteSubmission
);

// Exam Officer / Dean Routes
/**
 * POST /results/submission/:submissionId/approve
 * Approve a submitted result submission and apply scores to enrollments
 * Optional: remarks
 * Roles: exam_officer, dean, hod
 */
router.post(
  '/submission/:submissionId/approve',
  authorize(['exam_officer', 'dean', 'hod', 'university_admin']),
  validateSubmissionApproval,
  resultController.approveSubmission
);

/**
 * POST /results/submission/:submissionId/reject
 * Reject a submitted result submission with reason for revision
 * Requires: rejectionReason
 * Optional: rejectionNotes
 * Roles: exam_officer, dean, hod
 */
router.post(
  '/submission/:submissionId/reject',
  authorize(['exam_officer', 'dean', 'hod', 'university_admin']),
  validateSubmissionRejection,
  resultController.rejectSubmission
);

/**
 * GET /results/pending-approvals
 * Get all submitted result submissions awaiting approval
 * Optional filters: limit, offset, universityId
 * Roles: exam_officer, dean, hod, university_admin
 */
router.get(
  '/pending-approvals',
  authorize(['exam_officer', 'dean', 'hod', 'university_admin']),
  resultController.getPendingApprovals
);

/**
 * GET /results/semester/:semester/:academicYear
 * Get all result submissions for a specific semester and academic year
 * Optional filters: department, status, limit, offset, universityId
 * Roles: exam_officer, dean, hod, university_admin
 */
router.get(
  '/semester/:semester/:academicYear',
  authorize(['exam_officer', 'dean', 'hod', 'university_admin']),
  resultController.getSemesterSubmissions
);

/**
 * GET /results/stats
 * Get result submission statistics for a semester
 * Required query params: semester, academicYear
 * Optional: universityId
 * Roles: exam_officer, dean, hod, university_admin
 */
router.get(
  '/stats',
  authorize(['exam_officer', 'dean', 'hod', 'university_admin']),
  resultController.getSubmissionStats
);

// Shared Routes
/**
 * GET /results/submission/:submissionId
 * Get details of a specific result submission including all scores
 * Roles: any authenticated user (access control based on submission ownership/role)
 */
router.get(
  '/submission/:submissionId',
  resultController.getSubmissionDetails
);

/**
 * GET /results/lecturer/:lecturerId/submissions
 * Get all submissions from a specific lecturer
 * Optional filters: semester, academicYear, status, limit, offset
 * Roles: exam_officer, dean, hod, university_admin
 */
router.get(
  '/lecturer/:lecturerId/submissions',
  authorize(['exam_officer', 'dean', 'hod', 'university_admin']),
  resultController.getLecturerSubmissions
);

/**
 * GET /results/submission/:submissionId/download
 * Download result submission data as JSON
 * Roles: any authenticated user (access control based on submission ownership/role)
 */
router.get(
  '/submission/:submissionId/download',
  resultController.downloadSubmission
);

/**
 * GET /results/submission/:submissionId/export-csv
 * Export result submission data as CSV
 * Roles: any authenticated user (access control based on submission ownership/role)
 */
router.get(
  '/submission/:submissionId/export-csv',
  resultController.exportSubmissionCSV
);

/**
 * POST /results/submission/:submissionId/approval/send
 * Send a submission for approval
 * Body: { approverIds: string[] }
 * Roles: lecturer_admin, lecturer, exam_officer (optional)
 */
router.post(
  '/submission/:submissionId/approval/send',
  authorize(['lecturer_admin', 'lecturer', 'exam_officer']),
  resultController.sendForApproval
);

/**
 * GET /results/submission/:submissionId/approval/status
 * Get approval workflow status for a submission
 * Roles: any authenticated user (access control based on submission ownership/role)
 */
router.get(
  '/submission/:submissionId/approval/status',
  resultController.getApprovalStatus
);

/**
 * POST /results/submission/:submissionId/approval/:approverId/approve
 * Approve a submission
 * Body: { comments: string (optional) }
 * Roles: dean, hod, exam_officer, head_of_council, university_admin (based on hierarchy)
 */
router.post(
  '/submission/:submissionId/approval/:approverId/approve',
  resultController.approveSubmission
);

/**
 * POST /results/submission/:submissionId/approval/:approverId/reject
 * Reject a submission
 * Body: { reason: string, comments: string (optional) }
 * Roles: dean, hod, exam_officer, head_of_council, university_admin (based on hierarchy)
 */
router.post(
  '/submission/:submissionId/approval/:approverId/reject',
  resultController.rejectSubmission
);

/**
 * GET /results/submission/:submissionId/approval/history
 * Get complete approval workflow history for a submission
 * Roles: any authenticated user (access control based on submission ownership/role)
 */
router.get(
  '/submission/:submissionId/approval/history',
  resultController.getApprovalHistory
);

module.exports = router;
