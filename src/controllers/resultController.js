const resultService = require('../services/resultService');
const AuditService = require('../services/auditService');
const { AppError } = require('../utils/helpers');

class ResultController {
    constructor() {
        this.auditService = new AuditService();
    }
    async createDraftSubmission(req, res, next) {
        try {
            const { courseId, semester, academicYear } = req.body;
            const { universityId, departmentId } = req.query;

            const submission = await resultService.createDraftSubmission({
                courseId,
                universityId: universityId || req.user.university_id,
                departmentId,
                semester,
                academicYear,
                lecturerId: req.user.id,
                tenantId: req.user.tenant_id,
                createdBy: req.user.id
            });

            res.status(201).json({
                status: 'success',
                message: 'Result submission created in draft status',
                data: submission
            });
        } catch (error) {
            next(error);
        }
    }

    async uploadScores(req, res, next) {
        try {
            const { submissionId } = req.params;
            const { scores } = req.body;

            if (!Array.isArray(scores) || scores.length === 0) {
                throw new AppError('Scores array is required and must not be empty', 400);
            }

            const updated = await resultService.uploadScores(submissionId, scores);

            // Audit logging
            await this.auditService.logResultAction(req.user, 'upload_scores', {
                submissionId,
                scoresCount: scores.length
            }, this.auditService.extractAuditContext(req));

            res.status(200).json({
                status: 'success',
                message: 'Scores uploaded successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    async updateScores(req, res, next) {
        try {
            const { submissionId } = req.params;
            const { scores } = req.body;

            if (!Array.isArray(scores) || scores.length === 0) {
                throw new AppError('Scores array is required and must not be empty', 400);
            }

            const updated = await resultService.updateScores(submissionId, scores);

            res.status(200).json({
                status: 'success',
                message: 'Scores updated successfully',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    }

    async submitForApproval(req, res, next) {
        try {
            const { submissionId } = req.params;

            const submitted = await resultService.submitForApproval(submissionId, req.user.id);

            // Audit logging
            await this.auditService.logResultAction(req.user, 'submit_for_approval', {
                submissionId
            }, this.auditService.extractAuditContext(req));

            res.status(200).json({
                status: 'success',
                message: 'Result submission sent for approval',
                data: submitted
            });
        } catch (error) {
            next(error);
        }
    }

    async approveSubmission(req, res, next) {
        try {
            const { submissionId } = req.params;
            const { remarks } = req.body;

            const approved = await resultService.approveSubmission(
                submissionId,
                req.user.id,
                remarks
            );

            // Audit logging
            await this.auditService.logResultAction(req.user, 'approve_submission', {
                submissionId,
                remarks
            }, this.auditService.extractAuditContext(req));

            res.status(200).json({
                status: 'success',
                message: 'Result submission approved and scores applied to enrollments',
                data: approved
            });
        } catch (error) {
            next(error);
        }
    }

    async rejectSubmission(req, res, next) {
        try {
            const { submissionId } = req.params;
            const { rejectionReason, rejectionNotes } = req.body;

            if (!rejectionReason) {
                throw new AppError('Rejection reason is required', 400);
            }

            const rejected = await resultService.rejectSubmission(
                submissionId,
                req.user.id,
                rejectionReason,
                rejectionNotes
            );

            // Audit logging
            await this.auditService.logResultAction(req.user, 'reject_submission', {
                submissionId,
                rejectionReason,
                rejectionNotes
            }, this.auditService.extractAuditContext(req));

            res.status(200).json({
                status: 'success',
                message: 'Result submission rejected',
                data: rejected
            });
        } catch (error) {
            next(error);
        }
    }

    async recallSubmission(req, res, next) {
        try {
            const { submissionId } = req.params;

            const recalled = await resultService.recallSubmission(submissionId, req.user.id);

            res.status(200).json({
                status: 'success',
                message: 'Result submission recalled and returned to draft status',
                data: recalled
            });
        } catch (error) {
            next(error);
        }
    }

    async getSubmissionDetails(req, res, next) {
        try {
            const { submissionId } = req.params;

            const details = await resultService.getSubmissionDetails(submissionId);

            res.status(200).json({
                status: 'success',
                message: 'Submission details retrieved',
                data: details
            });
        } catch (error) {
            next(error);
        }
    }

    async getLecturerSubmissions(req, res, next) {
        try {
            const { lecturerId } = req.params;
            const { semester, academicYear, status, limit, offset } = req.query;

            const submissions = await resultService.getLecturerSubmissions(lecturerId, {
                semester,
                academicYear: academicYear ? parseInt(academicYear) : null,
                status,
                limit: limit ? parseInt(limit) : null,
                offset: offset ? parseInt(offset) : null
            });

            res.status(200).json({
                status: 'success',
                message: 'Lecturer submissions retrieved',
                data: submissions,
                count: submissions.length
            });
        } catch (error) {
            next(error);
        }
    }

    async getSemesterSubmissions(req, res, next) {
        try {
            const { semester, academicYear } = req.params;
            const { department, status, limit, offset } = req.query;
            const universityId = req.query.universityId || req.user.university_id;

            const submissions = await resultService.getUniversitySemesterSubmissions(
                universityId,
                semester,
                parseInt(academicYear),
                {
                    department: department ? parseInt(department) : null,
                    status,
                    limit: limit ? parseInt(limit) : null,
                    offset: offset ? parseInt(offset) : null
                }
            );

            res.status(200).json({
                status: 'success',
                message: 'Semester submissions retrieved',
                data: submissions,
                count: submissions.length
            });
        } catch (error) {
            next(error);
        }
    }

    async getPendingApprovals(req, res, next) {
        try {
            const { limit, offset } = req.query;
            const universityId = req.query.universityId || req.user.university_id;

            const pending = await resultService.getPendingApprovals(universityId, {
                limit: limit ? parseInt(limit) : null,
                offset: offset ? parseInt(offset) : null
            });

            res.status(200).json({
                status: 'success',
                message: 'Pending approvals retrieved',
                data: pending,
                count: pending.length
            });
        } catch (error) {
            next(error);
        }
    }

    async getSubmissionStats(req, res, next) {
        try {
            const { semester, academicYear } = req.query;
            const universityId = req.query.universityId || req.user.university_id;

            if (!semester || !academicYear) {
                throw new AppError('Semester and academicYear are required', 400);
            }

            const stats = await resultService.getSubmissionStats(
                universityId,
                semester,
                parseInt(academicYear)
            );

            res.status(200).json({
                status: 'success',
                message: 'Submission statistics retrieved',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    async downloadSubmission(req, res, next) {
        try {
            const { submissionId } = req.params;

            const result = await resultService.downloadSubmission(submissionId);

            // Set response headers for file download
            const filename = `results_${result.submission.course_id}_${result.submission.semester}_${result.submission.academic_year}.json`;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            res.send(JSON.stringify({
                submission: result.submission,
                scores: result.data,
                downloadedAt: new Date().toISOString()
            }, null, 2));
        } catch (error) {
            next(error);
        }
    }

    async getMySubmissions(req, res, next) {
        try {
            const { semester, academicYear, status, limit, offset } = req.query;

            const submissions = await resultService.getLecturerSubmissions(req.user.id, {
                semester,
                academicYear: academicYear ? parseInt(academicYear) : null,
                status,
                limit: limit ? parseInt(limit) : null,
                offset: offset ? parseInt(offset) : null
            });

            res.status(200).json({
                status: 'success',
                message: 'Your submissions retrieved',
                data: submissions,
                count: submissions.length
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteSubmission(req, res, next) {
        try {
            const { submissionId } = req.params;
            const resultSubmissionRepository = require('../repositories/resultSubmissionRepository');

            const submission = await resultSubmissionRepository.findById(submissionId);
            if (!submission) {
                throw new AppError('Submission not found', 404);
            }

            // Only allow deletion if status is draft and created by the user
            if (submission.status !== 'draft') {
                throw new AppError('Can only delete draft submissions', 400);
            }

            if (submission.lecturer_id !== req.user.id) {
                throw new AppError('You can only delete your own submissions', 403);
            }

            const deleted = await resultSubmissionRepository.delete(submissionId);

            res.status(200).json({
                status: 'success',
                message: 'Submission deleted successfully',
                data: deleted
            });
        } catch (error) {
            next(error);
        }
    }

    async exportSubmissionCSV(req, res, next) {
        try {
            const { submissionId } = req.params;
            const resultSubmissionRepository = require('../repositories/resultSubmissionRepository');

            const submission = await resultSubmissionRepository.findById(submissionId);
            if (!submission) {
                throw new AppError('Submission not found', 404);
            }

            let submissionData = {};
            try {
                submissionData = JSON.parse(submission.submission_data || '{}');
            } catch (e) {
                submissionData = {};
            }

            // Convert to CSV format
            let csvContent = 'Student ID,Enrollment ID,Score,Midterm Score,Final Score,Remarks\n';
            for (const [key, scoreInfo] of Object.entries(submissionData)) {
                const { studentId, enrollmentId, score, midtermScore, finalScore, remarks } = scoreInfo;
                csvContent += `"${studentId}","${enrollmentId}","${score || ''}","${midtermScore || ''}","${finalScore || ''}","${remarks || ''}"\n`;
            }

            // Increment download count
            await resultSubmissionRepository.incrementDownloadCount(submissionId);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="results_${submissionId}.csv"`);
            res.send(csvContent);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ResultController();
