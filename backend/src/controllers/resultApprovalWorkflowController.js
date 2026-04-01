const resultApprovalWorkflowService = require('../services/resultApprovalWorkflowService');
const AuditService = require('../services/auditService');
const { AppError } = require('../utils/helpers');

class ResultApprovalWorkflowController {
    constructor() {
        this.auditService = new AuditService();
    }
    /**
     * Lecturer submits to exam officer
     */
    async submitToExamOfficer(req, res, next) {
        try {
            const { submissionId } = req.params;

            const submitted = await resultApprovalWorkflowService.submitToExamOfficer(
                submissionId,
                req.user.id
            );

            // Audit logging
            await this.auditService.logResultAction(req.user, 'submit_to_exam_officer', {
                submissionId
            }, this.auditService.extractAuditContext(req));

            res.status(200).json({
                status: 'success',
                message: 'Result submission sent to exam officer for validation',
                data: submitted
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Exam officer validates submission
     */
    async validateByExamOfficer(req, res, next) {
        try {
            const { submissionId } = req.params;
            const { action, remarks } = req.body;

            if (!action || !['approve', 'reject'].includes(action)) {
                throw new AppError('Action must be either approve or reject', 400);
            }

            const result = await resultApprovalWorkflowService.validateByExamOfficer(
                submissionId,
                req.user.id,
                action,
                remarks
            );

            // Audit logging
            await this.auditService.logApproval(req.user, 'result', {
                submissionId,
                action: action === 'approve' ? 'exam_officer_approve' : 'exam_officer_reject',
                remarks
            }, action === 'approve' ? 'exam_officer_approve' : 'exam_officer_reject', this.auditService.extractAuditContext(req));

            res.status(200).json({
                status: 'success',
                message: `Submission ${action === 'approve' ? 'validated and forwarded' : 'rejected'} by exam officer`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Forward to HOD for approval
     */
    async submitToHOD(req, res, next) {
        try {
            const { submissionId } = req.params;

            const submitted = await resultApprovalWorkflowService.submitToHOD(
                submissionId,
                req.user.id
            );

            res.status(200).json({
                status: 'success',
                message: 'Submission forwarded to HOD for approval',
                data: submitted
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * HOD approves or rejects submission
     */
    async approveByHOD(req, res, next) {
        try {
            const { submissionId } = req.params;
            const { action, remarks } = req.body;

            if (!action || !['approve', 'reject'].includes(action)) {
                throw new AppError('Action must be either approve or reject', 400);
            }

            const result = await resultApprovalWorkflowService.approveByHOD(
                submissionId,
                req.user.id,
                action,
                remarks
            );

            res.status(200).json({
                status: 'success',
                message: `Submission ${action === 'approve' ? 'approved by HOD and forwarded' : 'rejected by'} HOD`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Forward to Dean for approval
     */
    async submitToDean(req, res, next) {
        try {
            const { submissionId } = req.params;

            const submitted = await resultApprovalWorkflowService.submitToDean(
                submissionId,
                req.user.id
            );

            res.status(200).json({
                status: 'success',
                message: 'Submission forwarded to Dean for final approval',
                data: submitted
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Dean approves or rejects submission (final approval)
     */
    async approveByDean(req, res, next) {
        try {
            const { submissionId } = req.params;
            const { action, remarks } = req.body;

            if (!action || !['approve', 'reject'].includes(action)) {
                throw new AppError('Action must be either approve or reject', 400);
            }

            const result = await resultApprovalWorkflowService.approveByDean(
                submissionId,
                req.user.id,
                action,
                remarks
            );

            res.status(200).json({
                status: 'success',
                message: action === 'approve' 
                    ? 'Submission approved and published to student records' 
                    : 'Submission rejected by Dean',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get workflow status and history
     */
    async getWorkflowStatus(req, res, next) {
        try {
            const { submissionId } = req.params;

            const workflow = await resultApprovalWorkflowService.getWorkflowStatus(submissionId);

            res.status(200).json({
                status: 'success',
                message: 'Workflow status retrieved',
                data: workflow
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get pending approvals for a user's role
     */
    async getPendingApprovals(req, res, next) {
        try {
            const { role } = req.query;
            const { limit, offset } = req.query;
            const universityId = req.query.universityId || req.user.university_id;

            if (!role) {
                throw new AppError('Role query parameter is required', 400);
            }

            const approvals = await resultApprovalWorkflowService.getPendingApprovalsByRole(
                role,
                universityId,
                {
                    limit: limit ? parseInt(limit) : null,
                    offset: offset ? parseInt(offset) : null
                }
            );

            res.status(200).json({
                status: 'success',
                message: `Pending ${role} approvals retrieved`,
                data: approvals,
                count: approvals.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get rejected submissions for lecturer to resubmit
     */
    async getRejectedSubmissions(req, res, next) {
        try {
            const { limit, offset } = req.query;

            const rejections = await resultApprovalWorkflowService.getRejectedSubmissions(
                req.user.id,
                {
                    limit: limit ? parseInt(limit) : null,
                    offset: offset ? parseInt(offset) : null
                }
            );

            res.status(200).json({
                status: 'success',
                message: 'Rejected submissions retrieved',
                data: rejections,
                count: rejections.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recall submission
     */
    async recallSubmission(req, res, next) {
        try {
            const { submissionId } = req.params;
            const { targetStatus } = req.body;

            const recalled = await resultApprovalWorkflowService.recallSubmission(
                submissionId,
                req.user.id,
                targetStatus || 'draft'
            );

            res.status(200).json({
                status: 'success',
                message: 'Submission recalled',
                data: recalled
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get workflow statistics
     */
    async getWorkflowStats(req, res, next) {
        try {
            const { semester, academicYear } = req.query;
            const universityId = req.query.universityId || req.user.university_id;

            if (!semester || !academicYear) {
                throw new AppError('Semester and academicYear are required', 400);
            }

            const stats = await resultApprovalWorkflowService.getWorkflowStats(
                universityId,
                semester,
                parseInt(academicYear)
            );

            res.status(200).json({
                status: 'success',
                message: 'Workflow statistics retrieved',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get summary dashboard for admin
     */
    async getApprovalDashboard(req, res, next) {
        try {
            const { semester, academicYear } = req.query;
            const universityId = req.query.universityId || req.user.university_id;

            if (!semester || !academicYear) {
                throw new AppError('Semester and academicYear are required', 400);
            }

            const stats = await resultApprovalWorkflowService.getWorkflowStats(
                universityId,
                semester,
                parseInt(academicYear)
            );

            // Calculate completion percentage
            const total = stats.workflow.totalSubmissions;
            const published = stats.workflow.published;
            const rejected = stats.workflow.rejectedByExamOfficer + 
                           stats.workflow.rejectedByHOD + 
                           stats.workflow.rejectedByDean;
            const pending = total - published - rejected;
            const completionPercentage = total > 0 ? Math.round((published / total) * 100) : 0;

            res.status(200).json({
                status: 'success',
                message: 'Approval workflow dashboard',
                data: {
                    period: {
                        semester,
                        academicYear
                    },
                    summary: {
                        totalSubmissions: total,
                        published,
                        rejected,
                        pending,
                        completionPercentage
                    },
                    stages: {
                        examOfficer: {
                            pending: stats.workflow.pendingExamOfficerValidation,
                            completed: stats.workflow.validatedByExamOfficer,
                            rejected: stats.workflow.rejectedByExamOfficer
                        },
                        hod: {
                            pending: stats.workflow.pendingHODApproval,
                            completed: stats.workflow.approvedByHOD,
                            rejected: stats.workflow.rejectedByHOD
                        },
                        dean: {
                            pending: stats.workflow.pendingDeanApproval,
                            completed: stats.workflow.published,
                            rejected: stats.workflow.rejectedByDean
                        }
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ResultApprovalWorkflowController();
