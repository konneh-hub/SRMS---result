const express = require('express');
const resultApprovalWorkflowController = require('../controllers/resultApprovalWorkflowController');
const { authenticate, authorize } = require('../middleware/auth');
const {
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

// ===== LECTURER ROUTES =====
/**
 * POST /results/approval/submit-to-exam-officer/:submissionId
 * Lecturer submits draft submission to exam officer for validation
 * Roles: lecturer (submission creator)
 */
router.post(
  '/submit-to-exam-officer/:submissionId',
  authorize(['lecturer', 'exam_officer']),
  resultApprovalWorkflowController.submitToExamOfficer
);

/**
 * GET /results/approval/rejected-submissions
 * Lecturer gets their rejected submissions to resubmit
 * Optional: limit, offset
 * Roles: lecturer
 */
router.get(
  '/rejected-submissions',
  authorize(['lecturer']),
  resultApprovalWorkflowController.getRejectedSubmissions
);

/**
 * POST /results/approval/recall/:submissionId
 * Lecturer recalls submission from approval process
 * Optional: targetStatus (default: draft)
 * Roles: lecturer, exam_officer
 */
router.post(
  '/recall/:submissionId',
  authorize(['lecturer', 'exam_officer']),
  validateRecallSubmission,
  resultApprovalWorkflowController.recallSubmission
);

// ===== EXAM OFFICER ROUTES =====
/**
 * GET /results/approval/pending-exam-officer
 * Exam officer gets all submissions awaiting their validation
 * Optional: limit, offset, universityId
 * Roles: exam_officer
 */
router.get(
  '/pending-exam-officer',
  authorize(['exam_officer', 'university_admin']),
  (req, res, next) => {
    req.query.role = 'exam_officer';
    resultApprovalWorkflowController.getPendingApprovals(req, res, next);
  }
);

/**
 * POST /results/approval/validate-by-exam-officer/:submissionId
 * Exam officer validates submission (approve/reject)
 * Requires: action (approve|reject), remarks (optional)
 * Roles: exam_officer
 */
router.post(
  '/validate-by-exam-officer/:submissionId',
  authorize(['exam_officer', 'university_admin']),
  validateExamOfficerValidation,
  resultApprovalWorkflowController.validateByExamOfficer
);

/**
 * POST /results/approval/submit-to-hod/:submissionId
 * Exam officer forwards validated submission to HOD
 * Roles: exam_officer
 */
router.post(
  '/submit-to-hod/:submissionId',
  authorize(['exam_officer', 'university_admin']),
  resultApprovalWorkflowController.submitToHOD
);

// ===== HOD ROUTES =====
/**
 * GET /results/approval/pending-hod
 * HOD gets all submissions awaiting their approval
 * Optional: limit, offset, universityId
 * Roles: hod
 */
router.get(
  '/pending-hod',
  authorize(['hod', 'dean', 'university_admin']),
  (req, res, next) => {
    req.query.role = 'hod';
    resultApprovalWorkflowController.getPendingApprovals(req, res, next);
  }
);

/**
 * POST /results/approval/approve-by-hod/:submissionId
 * HOD approves or rejects submission
 * Requires: action (approve|reject), remarks (optional)
 * Roles: hod
 */
router.post(
  '/approve-by-hod/:submissionId',
  authorize(['hod', 'dean', 'university_admin']),
  validateHODApproval,
  resultApprovalWorkflowController.approveByHOD
);

/**
 * POST /results/approval/submit-to-dean/:submissionId
 * HOD forwards approved submission to Dean
 * Roles: hod, dean
 */
router.post(
  '/submit-to-dean/:submissionId',
  authorize(['hod', 'dean', 'university_admin']),
  resultApprovalWorkflowController.submitToDean
);

// ===== DEAN ROUTES =====
/**
 * GET /results/approval/pending-dean
 * Dean gets all submissions awaiting their approval
 * Optional: limit, offset, universityId
 * Roles: dean
 */
router.get(
  '/pending-dean',
  authorize(['dean', 'university_admin']),
  (req, res, next) => {
    req.query.role = 'dean';
    resultApprovalWorkflowController.getPendingApprovals(req, res, next);
  }
);

/**
 * POST /results/approval/approve-by-dean/:submissionId
 * Dean approves (publishes results) or rejects submission - FINAL APPROVAL
 * Requires: action (approve|reject), remarks (optional)
 * Roles: dean
 */
router.post(
  '/approve-by-dean/:submissionId',
  authorize(['dean', 'university_admin']),
  validateDeanApproval,
  resultApprovalWorkflowController.approveByDean
);

// ===== SHARED ROUTES =====
/**
 * GET /results/approval/workflow-status/:submissionId
 * Get complete workflow status and history for a submission
 * Roles: all authenticated users (with access control)
 */
router.get(
  '/workflow-status/:submissionId',
  resultApprovalWorkflowController.getWorkflowStatus
);

/**
 * GET /results/approval/stats
 * Get workflow statistics for admin dashboard
 * Required: semester, academicYear
 * Optional: universityId
 * Roles: exam_officer, hod, dean, university_admin
 */
router.get(
  '/stats',
  authorize(['exam_officer', 'hod', 'dean', 'university_admin']),
  resultApprovalWorkflowController.getWorkflowStats
);

/**
 * GET /results/approval/dashboard
 * Get approval workflow dashboard with completion metrics
 * Required: semester, academicYear
 * Optional: universityId
 * Roles: exam_officer, hod, dean, university_admin
 */
router.get(
  '/dashboard',
  authorize(['exam_officer', 'hod', 'dean', 'university_admin']),
  resultApprovalWorkflowController.getApprovalDashboard
);

/**
 * GET /results/approval/pending-approvals
 * Generic endpoint to get pending approvals based on user role and query param
 * Requires: role query parameter (exam_officer|hod|dean)
 * Optional: limit, offset, universityId
 * Roles: exam_officer, hod, dean, university_admin
 */
router.get(
  '/pending-approvals',
  authorize(['exam_officer', 'hod', 'dean', 'university_admin']),
  resultApprovalWorkflowController.getPendingApprovals
);

module.exports = router;
