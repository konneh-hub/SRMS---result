const Joi = require('joi');

// Student validation schemas
const validateStudent = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    dateOfBirth: Joi.date().iso().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    address: Joi.string().max(255).optional(),
    studentId: Joi.string().min(1).max(20).required(),
    universityId: Joi.number().integer().positive().required(),
    facultyId: Joi.number().integer().positive().optional(),
    departmentId: Joi.number().integer().positive().optional(),
    programId: Joi.number().integer().positive().optional(),
    enrollmentYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).optional(),
    graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 20).optional(),
    academicStatus: Joi.string().valid('active', 'inactive', 'suspended', 'graduated', 'withdrawn', 'probation').default('active'),
    gpa: Joi.number().min(0).max(4.0).optional(),
    totalCredits: Joi.number().integer().min(0).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      relationship: Joi.string().min(1).max(50).required(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
      email: Joi.string().email().optional()
    }).optional(),
    nationality: Joi.string().max(50).optional(),
    isActive: Joi.boolean().default(true)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateStudentUpdate = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().min(1).max(50).optional(),
    lastName: Joi.string().min(1).max(50).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    dateOfBirth: Joi.date().iso().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    address: Joi.string().max(255).optional(),
    studentId: Joi.string().min(1).max(20).optional(),
    universityId: Joi.number().integer().positive().optional(),
    facultyId: Joi.number().integer().positive().optional(),
    departmentId: Joi.number().integer().positive().optional(),
    programId: Joi.number().integer().positive().optional(),
    enrollmentYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).optional(),
    graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 20).optional(),
    academicStatus: Joi.string().valid('active', 'inactive', 'suspended', 'graduated', 'withdrawn', 'probation').optional(),
    gpa: Joi.number().min(0).max(4.0).optional(),
    totalCredits: Joi.number().integer().min(0).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      relationship: Joi.string().min(1).max(50).required(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
      email: Joi.string().email().optional()
    }).optional(),
    nationality: Joi.string().max(50).optional(),
    isActive: Joi.boolean().optional()
  }).min(1); // At least one field must be provided

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateEnrollment = (req, res, next) => {
  const schema = Joi.object({
    programId: Joi.number().integer().positive().required(),
    enrollmentDate: Joi.date().iso().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateAcademicStatus = (req, res, next) => {
  const schema = Joi.object({
    academicStatus: Joi.string().valid('active', 'inactive', 'suspended', 'graduated', 'withdrawn', 'probation').required(),
    reason: Joi.string().max(500).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateGPA = (req, res, next) => {
  const schema = Joi.object({
    gpa: Joi.number().min(0).max(4.0).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateGPAProjection = (req, res, next) => {
  const schema = Joi.object({
    remainingCourses: Joi.array().items(
      Joi.object({
        credits: Joi.number().min(0.5).max(10).required(),
        targetGrade: Joi.string().valid('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F').required()
      })
    ).min(1).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateCredits = (req, res, next) => {
  const schema = Joi.object({
    credits: Joi.number().integer().min(0).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateBulkUpload = (req, res, next) => {
  const schema = Joi.object({
    students: Joi.array().items(
      Joi.object({
        firstName: Joi.string().min(1).max(50).required(),
        lastName: Joi.string().min(1).max(50).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
        dateOfBirth: Joi.date().iso().optional(),
        gender: Joi.string().valid('male', 'female', 'other').optional(),
        address: Joi.string().max(255).optional(),
        studentId: Joi.string().min(1).max(20).required(),
        universityId: Joi.number().integer().positive().required(),
        facultyId: Joi.number().integer().positive().optional(),
        departmentId: Joi.number().integer().positive().optional(),
        programId: Joi.number().integer().positive().optional(),
        enrollmentYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).optional(),
        graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 20).optional(),
        academicStatus: Joi.string().valid('active', 'inactive', 'suspended', 'graduated', 'withdrawn', 'probation').default('active'),
        gpa: Joi.number().min(0).max(4.0).optional(),
        totalCredits: Joi.number().integer().min(0).optional(),
        emergencyContact: Joi.object({
          name: Joi.string().min(1).max(100).required(),
          relationship: Joi.string().min(1).max(50).required(),
          phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
          email: Joi.string().email().optional()
        }).optional(),
        nationality: Joi.string().max(50).optional(),
        isActive: Joi.boolean().default(true)
      })
    ).min(1).max(1000).required() // Allow 1-1000 students per bulk upload
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

// Course Enrollment validation schemas
const validateCourseEnrollment = (req, res, next) => {
  const schema = Joi.object({
    studentId: Joi.number().integer().positive().required(),
    courseId: Joi.number().integer().positive().required(),
    semester: Joi.string().valid('fall', 'spring', 'summer', 'winter').required(),
    academicYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).required(),
    departmentId: Joi.number().integer().positive().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateGradeRecording = (req, res, next) => {
  const schema = Joi.object({
    grade: Joi.string().max(2).optional(),
    gradePoints: Joi.number().min(0).max(4).optional(),
    midtermScore: Joi.number().min(0).max(100).optional(),
    finalScore: Joi.number().min(0).max(100).optional(),
    totalScore: Joi.number().min(0).max(100).optional(),
    creditsEarned: Joi.number().min(0).optional()
  }).min(1); // At least one field must be provided

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateAttendanceRecording = (req, res, next) => {
  const schema = Joi.object({
    attendancePercentage: Joi.number().min(0).max(100).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateDropCourse = (req, res, next) => {
  const schema = Joi.object({
    reason: Joi.string().max(500).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateBulkEnrollment = (req, res, next) => {
  const schema = Joi.object({
    enrollments: Joi.array().items(
      Joi.object({
        student_id: Joi.number().integer().positive().required(),
        course_id: Joi.number().integer().positive().required(),
        semester: Joi.string().valid('fall', 'spring', 'summer', 'winter').required(),
        academic_year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).required(),
        university_id: Joi.number().integer().positive().required(),
        department_id: Joi.number().integer().positive().optional(),
        enrollment_date: Joi.date().iso().optional(),
        status: Joi.string().valid('enrolled', 'completed', 'dropped', 'failed', 'withdrawn', 'auditing').default('enrolled').optional()
      })
    ).min(1).max(1000).required() // Allow 1-1000 enrollments per bulk upload
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

// Result submission validation schemas
const validateResultSubmissionCreation = (req, res, next) => {
  const schema = Joi.object({
    courseId: Joi.number().integer().positive().required(),
    semester: Joi.string().valid('fall', 'spring', 'summer', 'winter').required(),
    academicYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateScoresUpload = (req, res, next) => {
  const schema = Joi.object({
    scores: Joi.array().items(
      Joi.object({
        enrollmentId: Joi.number().integer().optional(),
        studentId: Joi.alternatives().try(
          Joi.number().integer().positive(),
          Joi.string()
        ).required(),
        score: Joi.number().min(0).max(100).optional(),
        midtermScore: Joi.number().min(0).max(100).optional(),
        finalScore: Joi.number().min(0).max(100).optional(),
        remarks: Joi.string().max(500).optional()
      })
    ).min(1).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateScoresUpdate = (req, res, next) => {
  const schema = Joi.object({
    scores: Joi.array().items(
      Joi.object({
        enrollmentId: Joi.number().integer().optional(),
        studentId: Joi.alternatives().try(
          Joi.number().integer().positive(),
          Joi.string()
        ).required(),
        score: Joi.number().min(0).max(100).optional(),
        midtermScore: Joi.number().min(0).max(100).optional(),
        finalScore: Joi.number().min(0).max(100).optional(),
        remarks: Joi.string().max(500).optional()
      })
    ).min(1).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateSubmissionApproval = (req, res, next) => {
  const schema = Joi.object({
    remarks: Joi.string().max(500).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateSubmissionRejection = (req, res, next) => {
  const schema = Joi.object({
    rejectionReason: Joi.string().max(255).required(),
    rejectionNotes: Joi.string().max(1000).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

// Approval workflow validation schemas
const validateExamOfficerValidation = (req, res, next) => {
  const schema = Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    remarks: Joi.string().max(1000).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateHODApproval = (req, res, next) => {
  const schema = Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    remarks: Joi.string().max(1000).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateDeanApproval = (req, res, next) => {
  const schema = Joi.object({
    action: Joi.string().valid('approve', 'reject').required(),
    remarks: Joi.string().max(1000).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

const validateRecallSubmission = (req, res, next) => {
  const schema = Joi.object({
    targetStatus: Joi.string().valid('draft', 'submitted_to_exam_officer').optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`
    });
  }
  next();
};

module.exports = {
  validateStudent,
  validateStudentUpdate,
  validateEnrollment,
  validateAcademicStatus,
  validateGPA,
  validateGPAProjection,
  validateCredits,
  validateBulkUpload,
  validateCourseEnrollment,
  validateGradeRecording,
  validateAttendanceRecording,
  validateDropCourse,
  validateBulkEnrollment,
  validateResultSubmissionCreation,
  validateScoresUpload,
  validateScoresUpdate,
  validateSubmissionApproval,
  validateSubmissionRejection,
  validateExamOfficerValidation,
  validateHODApproval,
  validateDeanApproval,
  validateRecallSubmission
};