const courseEnrollmentRepository = require('../repositories/courseEnrollmentRepository');
const gradingScaleRepository = require('../repositories/gradingScaleRepository');
const semesterGPARepository = require('../repositories/semesterGPARepository');
const studentRepository = require('../repositories/studentRepository');

class GPACalculationService {
    constructor() {
        // Default Nigerian grading scale (fallback)
        this.defaultGradingScale = [
            { grade: 'A', gradePoint: 5.0, minScore: 70, maxScore: 100, description: 'Excellent' },
            { grade: 'B', gradePoint: 4.0, minScore: 60, maxScore: 69, description: 'Very Good' },
            { grade: 'C', gradePoint: 3.0, minScore: 50, maxScore: 59, description: 'Good' },
            { grade: 'D', gradePoint: 2.0, minScore: 45, maxScore: 49, description: 'Fair' },
            { grade: 'E', gradePoint: 1.0, minScore: 40, maxScore: 44, description: 'Pass' },
            { grade: 'F', gradePoint: 0.0, minScore: 0, maxScore: 39, description: 'Fail' }
        ];
    }

    /**
     * Get the active grading scale for a university
     * @param {number} universityId - University ID
     * @returns {Object} Grading scale with details
     */
    async getGradingScale(universityId) {
        const scale = await gradingScaleRepository.getActiveScaleForUniversity(universityId);
        if (scale) {
            return scale;
        }

        // Return default scale if no custom scale exists
        return {
            id: null,
            name: 'Default Nigerian Scale',
            details: this.defaultGradingScale
        };
    }

    /**
     * Convert score to grade and grade point using university's grading scale
     * @param {number} score - Student score
     * @param {number} universityId - University ID
     * @returns {Object} Grade information
     */
    async getGradeFromScore(score, universityId) {
        const gradingScale = await this.getGradingScale(universityId);

        // Find the appropriate grade for the score
        for (const gradeDetail of gradingScale.details) {
            if (score >= gradeDetail.minScore && score <= gradeDetail.maxScore) {
                return {
                    grade: gradeDetail.grade,
                    gradePoint: gradeDetail.gradePoint,
                    description: gradeDetail.description
                };
            }
        }

        // Default to F if no grade found
        return {
            grade: 'F',
            gradePoint: 0.0,
            description: 'Fail'
        };
    }

    /**
     * Calculate GPA for a specific semester
     * GPA = Σ(GP × CU) / ΣCU
     * @param {number} studentId - Student ID
     * @param {string} semester - Semester (fall, spring, summer, winter)
     * @param {number} academicYear - Academic year
     * @param {Object} options - Additional options
     * @returns {Object} Semester GPA data
     */
    async calculateSemesterGPA(studentId, semester, academicYear, options = {}) {
        const { storeResult = false } = options;

        // Get student info for university ID
        const student = await studentRepository.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        // Get enrollments for the semester
        const enrollments = await courseEnrollmentRepository.findByStudentAndSemester(
            studentId, semester, academicYear
        );

        // Filter only completed courses with valid scores
        const completedCourses = enrollments.filter(e =>
            e.is_completed &&
            e.grade_points !== null &&
            e.total_score !== null
        );

        if (completedCourses.length === 0) {
            const emptyResult = {
                studentId: parseInt(studentId),
                semester,
                academicYear,
                gpa: 0.0,
                totalCredits: 0.0,
                coursesCount: 0,
                gradeDistribution: {},
                courses: []
            };

            if (storeResult) {
                await semesterGPARepository.upsertSemesterGPA({
                    ...emptyResult,
                    universityId: student.university_id,
                    tenantId: student.tenant_id
                });
            }

            return emptyResult;
        }

        let totalQualityPoints = 0; // Σ(GP × CU)
        let totalCredits = 0; // ΣCU
        const gradeDistribution = {};
        const courses = [];

        for (const course of completedCourses) {
            const credits = parseFloat(course.credits_earned || course.course_credits || 0);
            const gradePoint = parseFloat(course.grade_points || 0);
            const score = parseFloat(course.total_score || 0);

            // Calculate quality points for this course
            const qualityPoints = gradePoint * credits;
            totalQualityPoints += qualityPoints;
            totalCredits += credits;

            // Update grade distribution
            const grade = course.grade || 'F';
            gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;

            courses.push({
                courseId: course.course_id,
                courseCode: course.course_code,
                courseName: course.course_name,
                credits: credits,
                score: score,
                grade: grade,
                gradePoint: gradePoint,
                qualityPoints: qualityPoints
            });
        }

        // Calculate GPA
        const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

        const result = {
            studentId: parseInt(studentId),
            semester,
            academicYear,
            gpa: parseFloat(gpa.toFixed(2)),
            totalCredits: parseFloat(totalCredits.toFixed(1)),
            coursesCount: completedCourses.length,
            gradeDistribution,
            courses
        };

        // Store result if requested
        if (storeResult) {
            await semesterGPARepository.upsertSemesterGPA({
                ...result,
                universityId: student.university_id,
                tenantId: student.tenant_id
            });
        }

        return result;
    }

    /**
     * Calculate Cumulative GPA (CGPA) for a student
     * @param {number} studentId - Student ID
     * @param {number} upToAcademicYear - Optional: Calculate CGPA up to this academic year
     * @param {string} upToSemester - Optional: Calculate CGPA up to this semester
     * @returns {Object} CGPA data
     */
    async calculateCGPA(studentId, upToAcademicYear = null, upToSemester = null) {
        let query = `
            SELECT ce.*, c.code as course_code, c.name as course_name, c.credits as course_credits
            FROM course_enrollments ce
            INNER JOIN courses c ON ce.course_id = c.id
            WHERE ce.student_id = $1 AND ce.is_completed = true AND ce.grade_points IS NOT NULL
        `;

        const params = [studentId];
        let paramIndex = 2;

        // Add filters for up to specific academic year/semester
        if (upToAcademicYear) {
            if (upToSemester) {
                // Include all semesters up to and including the specified semester in the academic year
                const semesterOrder = { 'winter': 1, 'spring': 2, 'summer': 3, 'fall': 4 };
                const targetOrder = semesterOrder[upToSemester.toLowerCase()] || 4;

                query += ` AND (
                    ce.academic_year < $${paramIndex} OR
                    (ce.academic_year = $${paramIndex} AND
                     CASE LOWER(ce.semester)
                       WHEN 'winter' THEN 1
                       WHEN 'spring' THEN 2
                       WHEN 'summer' THEN 3
                       WHEN 'fall' THEN 4
                       ELSE 5
                     END <= $${paramIndex + 1})
                )`;
                params.push(upToAcademicYear, targetOrder);
                paramIndex += 2;
            } else {
                // Include all semesters in academic years up to the specified year
                query += ` AND ce.academic_year <= $${paramIndex}`;
                params.push(upToAcademicYear);
                paramIndex++;
            }
        }

        query += ` ORDER BY ce.academic_year, ce.semester`;

        const result = await courseEnrollmentRepository.db.query(query, params);
        const enrollments = result.rows;

        if (enrollments.length === 0) {
            return {
                cgpa: 0.0,
                totalCredits: 0,
                coursesCount: 0,
                semestersCount: 0,
                semesters: []
            };
        }

        // Group by semester
        const semestersMap = new Map();
        let overallTotalGradePoints = 0;
        let overallTotalCredits = 0;

        enrollments.forEach(course => {
            const semesterKey = `${course.academic_year}-${course.semester}`;
            if (!semestersMap.has(semesterKey)) {
                semestersMap.set(semesterKey, {
                    academicYear: course.academic_year,
                    semester: course.semester,
                    courses: [],
                    totalGradePoints: 0,
                    totalCredits: 0
                });
            }

            const semester = semestersMap.get(semesterKey);
            const credits = parseFloat(course.credits_earned || 0);
            const gradePoints = parseFloat(course.grade_points || 0);
            const weightedPoints = gradePoints * credits;

            semester.courses.push({
                courseId: course.course_id,
                courseCode: course.course_code,
                courseName: course.course_name,
                credits: credits,
                grade: course.grade,
                gradePoints: gradePoints,
                weightedPoints: weightedPoints
            });

            semester.totalGradePoints += weightedPoints;
            semester.totalCredits += credits;
            overallTotalGradePoints += weightedPoints;
            overallTotalCredits += credits;
        });

        // Calculate semester GPAs and overall CGPA
        const semesters = Array.from(semestersMap.values()).map(semester => ({
            ...semester,
            gpa: semester.totalCredits > 0 ? parseFloat((semester.totalGradePoints / semester.totalCredits).toFixed(2)) : 0.0,
            coursesCount: semester.courses.length
        }));

        const cgpa = overallTotalCredits > 0 ? overallTotalGradePoints / overallTotalCredits : 0;

        return {
            cgpa: parseFloat(cgpa.toFixed(2)),
            totalCredits: parseFloat(overallTotalCredits.toFixed(1)),
            coursesCount: enrollments.length,
            semestersCount: semesters.length,
            semesters: semesters.sort((a, b) => {
                if (a.academicYear !== b.academicYear) {
                    return a.academicYear - b.academicYear;
                }
                const semesterOrder = { 'winter': 1, 'spring': 2, 'summer': 3, 'fall': 4 };
                return semesterOrder[a.semester.toLowerCase()] - semesterOrder[b.semester.toLowerCase()];
            })
        };
    }

    /**
     * Generate comprehensive student transcript
     * @param {number} studentId - Student ID
     * @returns {Object} Complete transcript data
     */
    async generateTranscript(studentId) {
        // Get student information
        const student = await studentRepository.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        // Calculate CGPA
        const cgpaData = await this.calculateCGPA(studentId);

        // Get degree classification
        const degreeClassification = this.getDegreeClassification(cgpaData.cgpa);

        // Get semester-wise performance
        const semesterPerformance = cgpaData.semesters.map(semester => ({
            academicYear: semester.academicYear,
            semester: semester.semester,
            gpa: semester.gpa,
            creditsEarned: semester.totalCredits,
            coursesCount: semester.coursesCount,
            gradeDistribution: semester.gradeDistribution,
            courses: semester.courses
        }));

        return {
            student: {
                id: student.id,
                studentId: student.student_id,
                firstName: student.first_name,
                lastName: student.last_name,
                fullName: `${student.first_name} ${student.last_name}`,
                program: student.program_name,
                faculty: student.faculty_name,
                department: student.department_name,
                enrollmentYear: student.enrollment_year,
                currentSemester: student.current_semester,
                academicStatus: student.academic_status
            },
            academicSummary: {
                cgpa: cgpaData.cgpa,
                totalCreditsEarned: cgpaData.totalCredits,
                totalCoursesCompleted: cgpaData.coursesCount,
                semestersCompleted: cgpaData.semestersCount,
                degreeClassification: degreeClassification,
                gradeDistribution: cgpaData.gradeDistribution
            },
            semesterPerformance,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Determine degree classification based on CGPA
     * @param {number} cgpa - Cumulative GPA
     * @returns {Object} Degree classification data
     */
    getDegreeClassification(cgpa) {
        let classification, description;

        if (cgpa >= 4.5) {
            classification = 'First Class Honours';
            description = 'Distinction';
        } else if (cgpa >= 3.5) {
            classification = 'Second Class Honours (Upper Division)';
            description = 'Upper Credit';
        } else if (cgpa >= 2.4) {
            classification = 'Second Class Honours (Lower Division)';
            description = 'Lower Credit';
        } else if (cgpa >= 1.5) {
            classification = 'Third Class Honours';
            description = 'Pass';
        } else {
            classification = 'Fail';
            description = 'No Award';
        }

        return {
            classification,
            description,
            cgpa: parseFloat(cgpa.toFixed(2))
        };
    }

    /**
     * Calculate GPA projection for remaining courses
     * @param {number} studentId - Student ID
     * @param {Array} remainingCourses - Array of {credits, targetGrade} objects
     * @returns {Object} GPA projection data
     */
    async calculateGPAProjection(studentId, remainingCourses) {
        const currentCGPA = await this.calculateCGPA(studentId);

        // Get student for university grading scale
        const student = await studentRepository.findById(studentId);
        const gradingScale = await this.getGradingScale(student.university_id);

        let projectedQualityPoints = currentCGPA.cgpa * currentCGPA.totalCredits;
        let projectedCredits = currentCGPA.totalCredits;

        const courseProjections = remainingCourses.map(course => {
            // Find grade point for target grade
            const gradeDetail = gradingScale.details.find(g => g.grade === course.targetGrade);
            const gradePoint = gradeDetail ? gradeDetail.gradePoint : 0;

            const qualityPoints = gradePoint * course.credits;
            projectedQualityPoints += qualityPoints;
            projectedCredits += course.credits;

            return {
                ...course,
                gradePoint,
                qualityPoints
            };
        });

        const projectedCGPA = projectedCredits > 0 ? projectedQualityPoints / projectedCredits : 0;

        return {
            currentCGPA: currentCGPA.cgpa,
            currentCredits: currentCGPA.totalCredits,
            projectedCGPA: parseFloat(projectedCGPA.toFixed(2)),
            projectedCredits: projectedCredits,
            additionalCredits: remainingCourses.reduce((sum, course) => sum + course.credits, 0),
            remainingCourses: courseProjections,
            gradingScale: gradingScale.details
        };
    }

    /**
     * Recalculate and store GPA for all semesters of a student
     * @param {number} studentId - Student ID
     * @returns {Object} Recalculation results
     */
    async recalculateAllSemesterGPAs(studentId) {
        // Get all completed semesters for the student
        const query = `
            SELECT DISTINCT semester, academic_year
            FROM course_enrollments
            WHERE student_id = $1 AND is_completed = true
            ORDER BY academic_year, semester
        `;

        const result = await courseEnrollmentRepository.db.query(query, [studentId]);
        const semesters = result.rows;

        const results = [];

        for (const semester of semesters) {
            try {
                const gpaData = await this.calculateSemesterGPA(
                    studentId,
                    semester.semester,
                    semester.academic_year,
                    { storeResult: true }
                );
                results.push({
                    semester: semester.semester,
                    academicYear: semester.academic_year,
                    success: true,
                    gpa: gpaData.gpa,
                    coursesCount: gpaData.coursesCount
                });
            } catch (error) {
                results.push({
                    semester: semester.semester,
                    academicYear: semester.academic_year,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            studentId: parseInt(studentId),
            totalSemesters: semesters.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }
}

module.exports = new GPACalculationService();