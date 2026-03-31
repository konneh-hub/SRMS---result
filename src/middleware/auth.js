const AuthService = require('../services/authService');

const authService = new AuthService();

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
      universityId: decoded.universityId
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string|string[]} allowedRoles - Allowed roles
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Convert single role to array
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

/**
 * System Admin only - highest level access
 */
const requireSystemAdmin = authorize('system_admin');

/**
 * University Admin - can manage their university
 */
const requireUniversityAdmin = authorize('university_admin');

/**
 * Dean - academic leadership role
 */
const requireDean = authorize('dean');

/**
 * Head of Department - department-level management
 */
const requireHod = authorize('hod');

/**
 * Exam Officer - manages examinations and results
 */
const requireExamOfficer = authorize('exam_officer');

/**
 * Lecturer - teaching staff
 */
const requireLecturer = authorize('lecturer');

/**
 * Student - basic user role
 */
const requireStudent = authorize('student');

/**
 * Academic Staff - includes dean, hod, exam officer, lecturer
 */
const requireAcademicStaff = authorize(['dean', 'hod', 'exam_officer', 'lecturer']);

/**
 * Administrative Staff - includes system admin, university admin
 */
const requireAdministrativeStaff = authorize(['system_admin', 'university_admin']);

/**
 * Teaching Staff - includes hod, lecturer
 */
const requireTeachingStaff = authorize(['hod', 'lecturer']);

/**
 * Management Staff - includes dean, hod, exam officer
 */
const requireManagementStaff = authorize(['dean', 'hod', 'exam_officer']);

/**
 * University Staff - all staff roles except system admin
 */
const requireUniversityStaff = authorize(['university_admin', 'dean', 'hod', 'exam_officer', 'lecturer']);

/**
 * All authenticated users
 */
const requireAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

/**
 * University access control middleware
 * Ensures users can only access resources for their assigned university
 * System admins can access all universities
 */
const requireUniversityAccess = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // System admins can access all universities
    if (req.user.role === 'system_admin') {
      return next();
    }

    // Get university ID from request params, body, or query
    const universityId = req.params.universityId || req.body.universityId || req.query.universityId;

    // If no university ID in request, allow access (for general endpoints)
    if (!universityId) {
      return next();
    }

    // Check if user has access to this university
    if (req.user.universityId !== parseInt(universityId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access resources for your assigned university.'
      });
    }

    next();
  } catch (error) {
    console.error('University access control error:', error);
    res.status(500).json({
      success: false,
      message: 'Access control failed'
    });
  }
};

/**
 * Department access control middleware
 * Ensures users can only access resources for their department
 */
const requireDepartmentAccess = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // System admins and university admins can access all departments
    if (['system_admin', 'university_admin'].includes(req.user.role)) {
      return next();
    }

    // Get department from request
    const department = req.params.department || req.body.department || req.query.department;

    // If no department specified, allow access
    if (!department) {
      return next();
    }

    // For now, we'll need to extend this based on user profile
    // This is a placeholder for department-based access control
    next();
  } catch (error) {
    console.error('Department access control error:', error);
    res.status(500).json({
      success: false,
      message: 'Access control failed'
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  requireSystemAdmin,
  requireUniversityAdmin,
  requireDean,
  requireHod,
  requireExamOfficer,
  requireLecturer,
  requireStudent,
  requireAcademicStaff,
  requireAdministrativeStaff,
  requireTeachingStaff,
  requireManagementStaff,
  requireUniversityStaff,
  requireAuthenticated,
  requireUniversityAccess,
  requireDepartmentAccess
};