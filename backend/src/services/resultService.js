const resultSubmissionRepository = require('../repositories/resultSubmissionRepository');
const CourseRepository = require('../repositories/CourseRepository');
const courseEnrollmentRepository = require('../repositories/courseEnrollmentRepository');
const { AppError } = require('../utils/helpers');

class ResultService {
    async createDraftSubmission(submissionData) {
        const { courseId, universityId, departmentId, semester, academicYear, lecturerId, tenantId, createdBy } = submissionData;

        // Validate course exists
        const course = await CourseRepository.findById(courseId);
        if (!course) {
            throw new AppError('Course not found', 404);
        }

        // Check if a submission already exists for this course/semester/year
        const existingSubmission = await resultSubmissionRepository.findByCourseSemesterYear(courseId, semester, academicYear);
        if (existingSubmission && existingSubmission.status !== 'rejected' && existingSubmission.status !== 'recalled') {
            throw new AppError('A result submission already exists for this course and semester', 400);
        }

        // Create draft submission
        const submission = await resultSubmissionRepository.create({
            course_id: courseId,
            university_id: universityId,
            department_id: departmentId,
            semester,
            academic_year: academicYear,
            lecturer_id: lecturerId,
            status: 'draft',
            submission_type: 'scores',
            submission_data: JSON.stringify({}),
            total_students: 0,
            tenant_id: tenantId,
            created_by: createdBy,
            updated_by: createdBy
        });

        return submission;
    }

    async uploadScores(submissionId, scoresData) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'draft' && submission.status !== 'rejected') {
            throw new AppError('Can only upload scores to draft or rejected submissions', 400);
        }

        if (submission.locked_for_editing) {
            throw new AppError('This submission is locked and cannot be edited', 400);
        }

        // Validate enrolled students exist for the course/semester
        const enrolledStudents = await courseEnrollmentRepository.findByCourse(
            submission.course_id,
            {
                semester: submission.semester,
                academicYear: submission.academic_year,
                status: 'enrolled'
            }
        );

        if (enrolledStudents.length === 0) {
            throw new AppError('No enrolled students found for this course/semester', 404);
        }

        // Validate and process scores data
        const processedScores = {};
        const errors = [];

        for (const score of scoresData) {
            const { enrollmentId, studentId, score: studentScore, midtermScore, finalScore, remarks } = score;

            // Validate score range (0-100)
            if (studentScore !== undefined && (studentScore < 0 || studentScore > 100)) {
                errors.push(`Invalid score for student ${studentId}: must be between 0 and 100`);
                continue;
            }

            // Validate midterm/final scores
            if (midtermScore && (midtermScore < 0 || midtermScore > 100)) {
                errors.push(`Invalid midterm score for student ${studentId}: must be between 0 and 100`);
                continue;
            }
            if (finalScore && (finalScore < 0 || finalScore > 100)) {
                errors.push(`Invalid final score for student ${studentId}: must be between 0 and 100`);
                continue;
            }

            processedScores[enrollmentId || studentId] = {
                studentId,
                enrollmentId,
                score: studentScore,
                midtermScore,
                finalScore,
                remarks,
                uploadedAt: new Date().toISOString()
            };
        }

        if (errors.length > 0) {
            throw new AppError(`Score validation failed: ${errors.join('; ')}`, 400);
        }

        // Update submission with scores
        const updated = await resultSubmissionRepository.update(submissionId, {
            submission_data: JSON.stringify(processedScores),
            total_students: Object.keys(processedScores).length,
            submission_type: 'scores'
        });

        return updated;
    }

    async updateScores(submissionId, updatedScoresData) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'draft' && submission.status !== 'rejected') {
            throw new AppError('Can only update scores in draft or rejected submissions', 400);
        }

        if (submission.locked_for_editing) {
            throw new AppError('This submission is locked and cannot be edited', 400);
        }

        // Get existing scores
        let existingScores = {};
        try {
            existingScores = JSON.parse(submission.submission_data || '{}');
        } catch (e) {
            existingScores = {};
        }

        // Merge updates with existing scores
        const mergedScores = { ...existingScores };

        for (const update of updatedScoresData) {
            const { enrollmentId, studentId, score, midtermScore, finalScore, remarks } = update;
            const key = enrollmentId || studentId;

            // Validate scores
            if (score !== undefined && (score < 0 || score > 100)) {
                throw new AppError(`Invalid score for student ${studentId}: must be between 0 and 100`, 400);
            }

            if (!mergedScores[key]) {
                throw new AppError(`No record found for enrollment/student ${key}`, 404);
            }

            mergedScores[key] = {
                ...mergedScores[key],
                score: score !== undefined ? score : mergedScores[key].score,
                midtermScore: midtermScore !== undefined ? midtermScore : mergedScores[key].midtermScore,
                finalScore: finalScore !== undefined ? finalScore : mergedScores[key].finalScore,
                remarks: remarks || mergedScores[key].remarks,
                lastUpdatedAt: new Date().toISOString()
            };
        }

        const updated = await resultSubmissionRepository.update(submissionId, {
            submission_data: JSON.stringify(mergedScores)
        });

        return updated;
    }

    async submitForApproval(submissionId, submittedBy) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'draft' && submission.status !== 'rejected') {
            throw new AppError('Only draft or rejected submissions can be submitted', 400);
        }

        // Parse submission data
        const submissionData = JSON.parse(submission.submission_data || '{}');
        const studentCount = Object.keys(submissionData).length;

        if (studentCount === 0) {
            throw new AppError('Cannot submit empty submission. Please upload scores first.', 400);
        }

        const updated = await resultSubmissionRepository.updateStatus(submissionId, 'submitted', {
            submitted_at: new Date().toISOString(),
            submitted_by: submittedBy,
            total_students: studentCount,
            submission_rounds: (submission.submission_rounds || 0) + 1
        });

        return updated;
    }

    async approveSubmission(submissionId, approvedBy, remarks = null) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'submitted') {
            throw new AppError('Only submitted submissions can be approved', 400);
        }

        // Parse scores and apply to course_enrollments
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

        // Update enrollments with approved scores
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

        // Mark submission as approved and locked
        const updated = await resultSubmissionRepository.updateStatus(submissionId, 'approved', {
            approved_at: new Date().toISOString(),
            approved_by: approvedBy,
            locked_for_editing: true,
            remarks
        });

        return updated;
    }

    async rejectSubmission(submissionId, rejectedBy, rejectionReason, rejectionNotes = null) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'submitted') {
            throw new AppError('Only submitted submissions can be rejected', 400);
        }

        const updated = await resultSubmissionRepository.updateStatus(submissionId, 'rejected', {
            rejected_reason: rejectionReason,
            rejection_notes: rejectionNotes,
            locked_for_editing: false
        });

        return updated;
    }

    async recallSubmission(submissionId, recalledBy) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        if (submission.status !== 'submitted') {
            throw new AppError('Only submitted submissions can be recalled', 400);
        }

        const updated = await resultSubmissionRepository.updateStatus(submissionId, 'recalled', {
            locked_for_editing: false
        });

        return updated;
    }

    async getSubmissionDetails(submissionId) {
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

        return {
            ...submission,
            scores: submissionData,
            scoreCount: Object.keys(submissionData).length
        };
    }

    async getLecturerSubmissions(lecturerId, options = {}) {
        return resultSubmissionRepository.findByLecturer(lecturerId, options);
    }

    async getUniversitySemesterSubmissions(universityId, semester, academicYear, options = {}) {
        return resultSubmissionRepository.findByUniversitySemester(universityId, semester, academicYear, options);
    }

    async getPendingApprovals(universityId, options = {}) {
        return resultSubmissionRepository.findByStatus('submitted', universityId, options);
    }

    async getSubmissionStats(universityId, semester, academicYear) {
        return resultSubmissionRepository.getSubmissionStats(universityId, semester, academicYear);
    }

    async downloadSubmission(submissionId) {
        const submission = await resultSubmissionRepository.findById(submissionId);
        if (!submission) {
            throw new AppError('Submission not found', 404);
        }

        // Increment download count
        await resultSubmissionRepository.incrementDownloadCount(submissionId);

        let submissionData = {};
        try {
            submissionData = JSON.parse(submission.submission_data || '{}');
        } catch (e) {
            submissionData = {};
        }

        return {
            submission,
            data: submissionData
        };
    }
}

module.exports = new ResultService();
