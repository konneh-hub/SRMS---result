const studentService = require('../services/studentService');

// Student Controller - Handles HTTP layer concerns only
const studentController = {
  // Get all students for the current tenant
  async getAllStudents(req, res) {
    try {
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;

      // System admins and university admins can see all students, others see only their university's students
      const universityId = (req.user?.role === 'system_admin' || req.user?.role === 'university_admin')
        ? null : userUniversityId;

      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        orderBy: req.query.orderBy || 'first_name',
        orderDirection: req.query.orderDirection || 'ASC'
      };

      const filters = {};
      if (req.query.faculty_id) filters.faculty_id = req.query.faculty_id;
      if (req.query.department_id) filters.department_id = req.query.department_id;
      if (req.query.program_id) filters.program_id = req.query.program_id;
      if (req.query.academic_status) filters.academic_status = req.query.academic_status;
      if (req.query.enrollment_year) filters.enrollment_year = req.query.enrollment_year;
      if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';

      const result = await studentService.getAllStudents(tenantId, universityId, filters, options);
      res.json(result);
    } catch (error) {
      console.error('Error in getAllStudents controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch students'
      });
    }
  },

  // Get a specific student by ID
  async getStudentById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;

      // System admins and university admins can access any student, others can only access students from their university
      const universityId = (req.user?.role === 'system_admin' || req.user?.role === 'university_admin')
        ? null : userUniversityId;

      const result = await studentService.getStudentById(id, tenantId, universityId);
      res.json(result);
    } catch (error) {
      console.error('Error in getStudentById controller:', error);

      if (error.message === 'Student not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Invalid student ID') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch student'
      });
    }
  },

  // Create a new student
  async createStudent(req, res) {
    try {
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins can create students for any university, university admins and other roles can only create for their university
      if (userRole !== 'system_admin' && userUniversityId) {
        // Ensure the student is being created for the user's university
        if (!req.body.universityId || parseInt(req.body.universityId) !== userUniversityId) {
          req.body.universityId = userUniversityId;
        }
      }

      const result = await studentService.createStudent(req.body, tenantId);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createStudent controller:', error);

      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('format')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create student'
      });
    }
  },

  // Update a student
  async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can update any student, others can only update students from their university
      const universityId = (userRole === 'system_admin' || userRole === 'university_admin')
        ? null : userUniversityId;

      const result = await studentService.updateStudent(id, req.body, tenantId, universityId);
      res.json(result);
    } catch (error) {
      console.error('Error in updateStudent controller:', error);

      if (error.message === 'Student not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('format')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update student'
      });
    }
  },

  // Delete a student
  async deleteStudent(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can delete any student, others can only delete students from their university
      const universityId = (userRole === 'system_admin' || userRole === 'university_admin')
        ? null : userUniversityId;

      const result = await studentService.deleteStudent(id, tenantId, universityId);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteStudent controller:', error);

      if (error.message === 'Student not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete student'
      });
    }
  },

  // Enroll student in a program
  async enrollInProgram(req, res) {
    try {
      const { id } = req.params;
      const { programId, enrollmentDate } = req.body;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can enroll any student, others can only enroll students from their university
      const universityId = (userRole === 'system_admin' || userRole === 'university_admin')
        ? null : userUniversityId;

      const result = await studentService.enrollInProgram(id, programId, enrollmentDate, tenantId, universityId);
      res.json(result);
    } catch (error) {
      console.error('Error in enrollInProgram controller:', error);

      if (error.message === 'Student not found' || error.message === 'Program not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('already enrolled')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to enroll student in program'
      });
    }
  },

  // Update student academic status
  async updateAcademicStatus(req, res) {
    try {
      const { id } = req.params;
      const { academicStatus, reason } = req.body;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can update any student, others can only update students from their university
      const universityId = (userRole === 'system_admin' || userRole === 'university_admin')
        ? null : userUniversityId;

      const result = await studentService.updateAcademicStatus(id, academicStatus, reason, tenantId, universityId);
      res.json(result);
    } catch (error) {
      console.error('Error in updateAcademicStatus controller:', error);

      if (error.message === 'Student not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update academic status'
      });
    }
  },

  // Update student GPA
  async updateGPA(req, res) {
    try {
      const { id } = req.params;
      const { gpa } = req.body;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can update any student, others can only update students from their university
      const universityId = (userRole === 'system_admin' || userRole === 'university_admin')
        ? null : userUniversityId;

      const result = await studentService.updateGPA(id, gpa, tenantId, universityId);
      res.json(result);
    } catch (error) {
      console.error('Error in updateGPA controller:', error);

      if (error.message === 'Student not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update GPA'
      });
    }
  },

  // Update student credits
  async updateCredits(req, res) {
    try {
      const { id } = req.params;
      const { credits } = req.body;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can update any student, others can only update students from their university
      const universityId = (userRole === 'system_admin' || userRole === 'university_admin')
        ? null : userUniversityId;

      const result = await studentService.updateCredits(id, credits, tenantId, universityId);
      res.json(result);
    } catch (error) {
      console.error('Error in updateCredits controller:', error);

      if (error.message === 'Student not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update credits'
      });
    }
  },

  // Get students by university
  async getStudentsByUniversity(req, res) {
    try {
      const { universityId } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can access any university's students, others can only access their own university
      if (userRole !== 'system_admin' && userRole !== 'university_admin' && userUniversityId && parseInt(universityId) !== userUniversityId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access students from your assigned university.'
        });
      }

      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        orderBy: req.query.orderBy || 'first_name',
        orderDirection: req.query.orderDirection || 'ASC'
      };

      const result = await studentService.getStudentsByUniversity(universityId, tenantId, options);
      res.json(result);
    } catch (error) {
      console.error('Error in getStudentsByUniversity controller:', error);

      if (error.message === 'University not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch students by university'
      });
    }
  },

  // Get students by faculty
  async getStudentsByFaculty(req, res) {
    try {
      const { facultyId } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can access any faculty's students, others can only access their own university
      const universityId = (userRole === 'system_admin' || userRole === 'university_admin')
        ? null : userUniversityId;

      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        orderBy: req.query.orderBy || 'first_name',
        orderDirection: req.query.orderDirection || 'ASC'
      };

      const result = await studentService.getStudentsByFaculty(facultyId, tenantId, universityId, options);
      res.json(result);
    } catch (error) {
      console.error('Error in getStudentsByFaculty controller:', error);

      if (error.message === 'Faculty not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch students by faculty'
      });
    }
  },

  // Get students by department
  async getStudentsByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can access any department's students, others can only access their own university
      const universityId = (userRole === 'system_admin' || userRole === 'university_admin')
        ? null : userUniversityId;

      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        orderBy: req.query.orderBy || 'first_name',
        orderDirection: req.query.orderDirection || 'ASC'
      };

      const result = await studentService.getStudentsByDepartment(departmentId, tenantId, universityId, options);
      res.json(result);
    } catch (error) {
      console.error('Error in getStudentsByDepartment controller:', error);

      if (error.message === 'Department not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch students by department'
      });
    }
  },

  // Get students by program
  async getStudentsByProgram(req, res) {
    try {
      const { programId } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can access any program's students, others can only access their own university
      const universityId = (userRole === 'system_admin' || userRole === 'university_admin')
        ? null : userUniversityId;

      const options = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        orderBy: req.query.orderBy || 'first_name',
        orderDirection: req.query.orderDirection || 'ASC'
      };

      const result = await studentService.getStudentsByProgram(programId, tenantId, universityId, options);
      res.json(result);
    } catch (error) {
      console.error('Error in getStudentsByProgram controller:', error);

      if (error.message === 'Program not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch students by program'
      });
    }
  },

  // Get students by enrollment year
  async getStudentsByEnrollmentYear(req, res) {
    try {
      const { universityId, year } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can access any university's students, others can only access their own university
      if (userRole !== 'system_admin' && userRole !== 'university_admin' && userUniversityId && parseInt(universityId) !== userUniversityId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access students from your assigned university.'
        });
      }

      const result = await studentService.getStudentsByEnrollmentYear(universityId, year, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getStudentsByEnrollmentYear controller:', error);

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch students by enrollment year'
      });
    }
  },

  // Get graduating students
  async getGraduatingStudents(req, res) {
    try {
      const { universityId, year } = req.params;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins and university admins can access any university's students, others can only access their own university
      if (userRole !== 'system_admin' && userRole !== 'university_admin' && userUniversityId && parseInt(universityId) !== userUniversityId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access students from your assigned university.'
        });
      }

      const result = await studentService.getGraduatingStudents(universityId, year, tenantId);
      res.json(result);
    } catch (error) {
      console.error('Error in getGraduatingStudents controller:', error);

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch graduating students'
      });
    }
  },

  // Bulk upload students
  async bulkUploadStudents(req, res) {
    try {
      const { students } = req.body;
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;
      const userRole = req.user?.role;

      // System admins can upload for any university, university admins can only upload for their university
      if (userRole !== 'system_admin' && userUniversityId) {
        // Ensure all students are uploaded for the user's university
        students.forEach(student => {
          if (!student.universityId || parseInt(student.universityId) !== userUniversityId) {
            student.universityId = userUniversityId;
          }
        });
      }

      const result = await studentService.bulkUploadStudents(students, tenantId);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in bulkUploadStudents controller:', error);

      if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('format')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to bulk upload students'
      });
    }
  },

  // Get student statistics
  async getStudentStats(req, res) {
    try {
      const tenantId = req.tenant.id;
      const userUniversityId = req.user?.universityId;

      // System admins and university admins can see all stats, others see only their university's stats
      const universityId = (req.user?.role === 'system_admin' || req.user?.role === 'university_admin')
        ? null : userUniversityId;

      const result = await studentService.getStudentStats(tenantId, universityId);
      res.json(result);
    } catch (error) {
      console.error('Error in getStudentStats controller:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch student statistics'
      });
    }
  }
};

module.exports = studentController;