const resultSubmissionRepository = require('../repositories/resultSubmissionRepository');
const courseEnrollmentRepository = require('../repositories/courseEnrollmentRepository');
const { AppError } = require('../utils/helpers');

class ResultApprovalWorkflowService {
    /**
     * Submit results to exam officer for validation
     * Lecturer → Exam Officer
     */
    async submitToExamOfficer(submissionId, submittedBy) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'draft' && submission.status !== 'rejected_by_exam_officer') {
            throw new AppError('Only draft or exam officer rejected submissions can be submitted to exam officer', 400);
        }

        if (submission.locked_for_editing) {
            throw new AppError('This submission is locked and cannot be submitted', 400);
        }

        // Parse submission data
        const submissionData = JSON.parse(submission.submission_data || '{}');
        const studentCount = Object.keys(submissionData).length;

        if (studentCount === 0) {
            throw new AppError('Cannot submit empty submission. Please upload scores first.', 400);
        }

        const updated = await resultSubmissionRepository.update(submissionId, {
            status: 'submitted_to_exam_officer',
            submitted_to_exam_officer_at: new Date().toISOString(),
            submitted_by_lecture_id: submittedBy,
            total_students: studentCount,
            submission_rounds: (submission.submission_rounds || 0) + 1
        });

        return updated;
    }

    /**
     * Exam officer validates the submission
     * Can either reject back to lecturer or approve and forward to HOD
     */
    async validateByExamOfficer(submissionId, validatedBy, action, remarks = null) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'submitted_to_exam_officer') {
            throw new AppError('Submission must be in submitted_to_exam_officer status', 400);
        }

        if (action === 'approve') {
            // Move to HOD approval
            const updated = await resultSubmissionRepository.update(submissionId, {
                status: 'validated_by_exam_officer',
                validated_by_exam_officer_at: new Date().toISOString(),
                validated_by_exam_officer_id: validatedBy,
                exam_officer_remarks: remarks,
                approval_rounds: (submission.approval_rounds || 0) + 1
            });
            return updated;
        } else if (action === 'reject') {
            if (!remarks) {
                throw new AppError('Rejection remarks are required', 400);
            }
            // Return to lecturer for revision
            const updated = await resultSubmissionRepository.update(submissionId, {
                status: 'rejected_by_exam_officer',
                rejected_at: new Date().toISOString(),
                rejected_by_id: validatedBy,
                rejected_stage: 'exam_officer',
                rejection_reason: 'Failed exam officer validation',
                rejection_notes: remarks,
                locked_for_editing: false
            });
            return updated;
        } else {
            throw new AppError('Action must be either approve or reject', 400);
        }
    }

    /**
     * Forward validated submission to HOD for approval
     */
    async submitToHOD(submissionId, submittedBy) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'validated_by_exam_officer') {
            throw new AppError('Submission must be validated by exam officer first', 400);
        }

        const updated = await resultSubmissionRepository.update(submissionId, {
            status: 'submitted_to_hod',
            submitted_to_hod_at: new Date().toISOString(),
            submitted_to_hod_by_id: submittedBy,
            locked_for_editing: true // Lock while awaiting HOD approval
        });

        return updated;
    }

    /**
     * HOD approves or rejects the submission
     */
    async approveByHOD(submissionId, approvedBy, action, remarks = null) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'submitted_to_hod') {
            throw new AppError('Submission must be in submitted_to_hod status', 400);
        }

        if (action === 'approve') {
            // Move to Dean approval
            const updated = await resultSubmissionRepository.update(submissionId, {
                status: 'approved_by_hod',
                approved_by_hod_at: new Date().toISOString(),
                approved_by_hod_id: approvedBy,
                hod_remarks: remarks,
                approval_rounds: (submission.approval_rounds || 0) + 1
            });
            return updated;
        } else if (action === 'reject') {
            if (!remarks) {
                throw new AppError('Rejection remarks are required', 400);
            }
            // Return to lecturer for revision
            const updated = await resultSubmissionRepository.update(submissionId, {
                status: 'rejected_by_hod',
                rejected_at: new Date().toISOString(),
                rejected_by_id: approvedBy,
                rejected_stage: 'hod',
                rejection_reason: 'Failed HOD approval',
                rejection_notes: remarks,
                locked_for_editing: false
            });
            return updated;
        } else {
            throw new AppError('Action must be either approve or reject', 400);
        }
    }

    /**
     * Forward HOD approved submission to Dean
     */
    async submitToDean(submissionId, submittedBy) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'approved_by_hod') {
            throw new AppError('Submission must be approved by HOD first', 400);
        }

        const updated = await resultSubmissionRepository.update(submissionId, {
            status: 'submitted_to_dean',
            submitted_to_dean_at: new Date().toISOString(),
            submitted_to_dean_by_id: submittedBy,
            locked_for_editing: true // Lock while awaiting Dean approval
        });

        return updated;
    }

    /**
     * Dean approves or rejects the submission
     * If approved, automatically publishes the results
     */
    async approveByDean(submissionId, approvedBy, action, remarks = null) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'submitted_to_dean') {
            throw new AppError('Submission must be in submitted_to_dean status', 400);
        }

        if (action === 'approve') {
            // Approve and publish
            return this._publishResults(submissionId, approvedBy, remarks);
        } else if (action === 'reject') {
            if (!remarks) {
                throw new AppError('Rejection remarks are required', 400);
            }
            // Return to lecturer for revision
            const updated = await resultSubmissionRepository.update(submissionId, {
                status: 'rejected_by_dean',
                rejected_at: new Date().toISOString(),
                rejected_by_id: approvedBy,
                rejected_stage: 'dean',
                rejection_reason: 'Failed Dean approval',
                rejection_notes: remarks,
                locked_for_editing: false
            });
            return updated;
        } else {
            throw new AppError('Action must be either approve or reject', 400);
        }
    }

    /**
     * Publish approved results to course enrollments
     * Private method called by approveByDean
     */
    async _publishResults(submissionId, publishedBy, remarks) {
        const submission = await resultSubmissionRepository.findById(submissionId);

        // Parse submission data and apply to enrollments
        const submissionData = JSON.parse(submission.submission_data || '{}');

        const scoreUpdates = [];
        for (const [key, scoreInfo] of Object.entries(submissionData)) {
            const { score, midtermScore, finalScore } = scoreInfo;

            // Calculate grade and grade points
            let grade = '';
            let gradePoints = 0;

            if (score) {
                if (score >= 90) { grade = 'A'; gradePoints = 4.0; }
                else if (score >= 80) { grade = 'B'; gradePoints = 3.0; }
                else if (score >= 70) { grade = 'C'; gradePoints = 2.0; }
                else if (score >= 60) { grade = 'D'; gradePoints = 1.0; }
                else { grade = 'F'; gradePoints = 0.0; }
            }

            scoreUpdates.push({
                enrollmentId: scoreInfo.enrollmentId,
                studentId: scoreInfo.studentId,
                totalScore: score,
                gradePoints,
                grade,
                midtermScore,
                finalScore
            });
        }

        // Update all enrollments
        for (const update of scoreUpdates) {
            if (update.enrollmentId) {
                await courseEnrollmentRepository.update(update.enrollmentId, {
                    total_score: update.totalScore,
                    grade_points: update.gradePoints,
                    grade: update.grade,
                    midterm_score: update.midtermScore,
                    final_score: update.finalScore,
                    is_completed: true,
                    completion_date: new Date().toISOString().split('T')[0]
                });
            }
        }

        // Mark submission as published
        const updated = await resultSubmissionRepository.update(submissionId, {
            status: 'published',
            approved_by_dean_at: new Date().toISOString(),
            approved_by_dean_id: publishedBy,
            dean_remarks: remarks,
            published_at: new Date().toISOString(),
            published_by_id: publishedBy,
            locked_for_editing: true
        });

        return updated;
    }

    /**
     * Get submission workflow status and history
     */
    async getWorkflowStatus(submissionId) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        const workflowStages = [
            {
                stage: 'lecturer_submission',
                status: submission.status === 'submitted_to_exam_officer' ? 'completed' : 'pending',
                submittedAt: submission.submitted_to_exam_officer_at,
                submittedBy: submission.submitted_by_lecture_id,
                remarks: null
            },
            {
                stage: 'exam_officer_validation',
                status: submission.status === 'validated_by_exam_officer' ? 'completed' : 
                        submission.status === 'rejected_by_exam_officer' ? 'rejected' : 'pending',
                validatedAt: submission.validated_by_exam_officer_at,
                validatedBy: submission.validated_by_exam_officer_id,
                remarks: submission.exam_officer_remarks,
                rejectionReason: submission.rejected_stage === 'exam_officer' ? submission.rejection_reason : null,
                rejectionNotes: submission.rejected_stage === 'exam_officer' ? submission.rejection_notes : null
            },
            {
                stage: 'hod_approval',
                status: submission.status === 'approved_by_hod' ? 'completed' :
                        submission.status === 'rejected_by_hod' ? 'rejected' :
                        submission.status === 'submitted_to_hod' ? 'in_progress' : 'pending',
                approvedAt: submission.approved_by_hod_at,
                approvedBy: submission.approved_by_hod_id,
                remarks: submission.hod_remarks,
                rejectionReason: submission.rejected_stage === 'hod' ? submission.rejection_reason : null,
                rejectionNotes: submission.rejected_stage === 'hod' ? submission.rejection_notes : null
            },
            {
                stage: 'dean_approval',
                status: submission.status === 'published' ? 'completed' :
                        submission.status === 'rejected_by_dean' ? 'rejected' :
                        submission.status === 'submitted_to_dean' ? 'in_progress' : 'pending',
                approvedAt: submission.approved_by_dean_at,
                approvedBy: submission.approved_by_dean_id,
                remarks: submission.dean_remarks,
                rejectionReason: submission.rejected_stage === 'dean' ? submission.rejection_reason : null,
                rejectionNotes: submission.rejected_stage === 'dean' ? submission.rejection_notes : null
            },
            {
                stage: 'publishing',
                status: submission.status === 'published' ? 'completed' : 'pending',
                publishedAt: submission.published_at,
                publishedBy: submission.published_by_id
            }
        ];

        return {
            submissionId,
            currentStatus: submission.status,
            workflowStages,
            approvalRounds: submission.approval_rounds,
            totalStudents: submission.total_students,
            locked: submission.locked_for_editing
        };
    }

    /**
     * Recall submission from any approval stage back to draft
     * Only exam officer can recall from their level or above
     */
    async recallSubmission(submissionId, recalledBy, targetStatus = 'draft') {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status === 'published') {
            throw new AppError('Cannot recall published results', 400);
        }

        const updated = await resultSubmissionRepository.update(submissionId, {
            status: targetStatus,
            locked_for_editing: false
        });

        return updated;
    }

    /**
     * Get pending approvals for a specific approver role
     */
    async getPendingApprovalsByRole(role, universityId, options = {}) {
        let statusFilter;

        switch (role.toLowerCase()) {
            case 'exam_officer':
                statusFilter = 'submitted_to_exam_officer';
                break;
            case 'hod':
                statusFilter = 'submitted_to_hod';
                break;
            case 'dean':
                statusFilter = 'submitted_to_dean';
                break;
            default:
                throw new AppError('Invalid role for approval', 400);
        }

        return resultSubmissionRepository.findByStatus(statusFilter, universityId, options);
    }

    /**
     * Get rejections for a lecturer to resubmit
     */
    async getRejectedSubmissions(lecturerId, options = {}) {
        const statuses = ['rejected_by_exam_officer', 'rejected_by_hod', 'rejected_by_dean'];
        
        const result = await resultSubmissionRepository.findByLecturer(lecturerId, {
            ...options,
            status: 'rejected_by_exam_officer' // Get first batch
        });

        return result;
    }

    /**
     * Get workflow statistics for a semester
     */
    async getWorkflowStats(universityId, semester, academicYear) {
        const submitted = await resultSubmissionRepository.countByStatus('submitted_to_exam_officer', universityId);
        const validatedByExamOfficer = await resultSubmissionRepository.countByStatus('validated_by_exam_officer', universityId);
        const rejectedByExamOfficer = await resultSubmissionRepository.countByStatus('rejected_by_exam_officer', universityId);
        const submittedToHOD = await resultSubmissionRepository.countByStatus('submitted_to_hod', universityId);
        const approvedByHOD = await resultSubmissionRepository.countByStatus('approved_by_hod', universityId);
        const rejectedByHOD = await resultSubmissionRepository.countByStatus('rejected_by_hod', universityId);
        const submittedToDean = await resultSubmissionRepository.countByStatus('submitted_to_dean', universityId);
        const published = await resultSubmissionRepository.countByStatus('published', universityId);
        const rejectedByDean = await resultSubmissionRepository.countByStatus('rejected_by_dean', universityId);

        return {
            universityId,
            semester,
            academicYear,
            workflow: {
                pendingExamOfficerValidation: submitted,
                validatedByExamOfficer,
                rejectedByExamOfficer,
                pendingHODApproval: submittedToHOD,
                approvedByHOD,
                rejectedByHOD,
                pendingDeanApproval: submittedToDean,
                published,
                rejectedByDean,
                totalSubmissions: submitted + validatedByExamOfficer + rejectedByExamOfficer + 
                                 submittedToHOD + approvedByHOD + rejectedByHOD + 
                                 submittedToDean + published + rejectedByDean
            }
        };
    }
}

module.exports = new ResultApprovalWorkflowService();
