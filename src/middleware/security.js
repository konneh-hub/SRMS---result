// Security Middleware
// Comprehensive security features for the application

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');
const xss = require('xss-clean');
const { body, param, query, validationResult } = require('express-validator');

// Rate limiting configurations
const createRateLimit = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
    max: options.max || 100, // Limit each IP to 100 requests per windowMs
    message: {
      status: 'error',
      message: options.message || 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
      // Skip rate limiting for health checks and static assets
      return req.path === '/health' || req.path.startsWith('/static');
    },
    handler: (req, res) => {
      res.status(429).json({
        status: 'error',
        message: options.message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// General API rate limiting
const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later.'
});

// Strict rate limiting for authentication endpoints
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.'
});

// Rate limiting for audit endpoints (admin operations)
const auditRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 audit requests per 15 minutes
  message: 'Too many audit requests, please try again later.'
});

// Progressive delay for brute force protection
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Allow 10 requests per window without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipFailedRequests: false,
  skipSuccessfulRequests: false
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential script tags and other dangerous content
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }

  next();
};

// Request size limiting
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length']);

  // Limit request body to 10MB
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && contentLength > maxSize) {
    return res.status(413).json({
      status: 'error',
      message: 'Request entity too large'
    });
  }

  next();
};

// Timeout protection
const timeoutProtection = (req, res, next) => {
  // Set a timeout for each request (30 seconds)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        status: 'error',
        message: 'Request timeout'
      });
    }
  }, 30000); // 30 seconds

  // Clear timeout when response is finished
  res.on('finish', () => {
    clearTimeout(timeout);
  });

  res.on('close', () => {
    clearTimeout(timeout);
  });

  next();
};

// Security headers middleware (additional to helmet)
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (restrict features)
  res.setHeader('Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), magnetometer=(), gyroscope=(), speaker=(), fullscreen=()'
  );

  // HSTS (HTTP Strict Transport Security) - only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // For API endpoints, we can use Origin/Referer header validation
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const allowedOrigins = process.env.ALLOWED_ORIGINS ?
    process.env.ALLOWED_ORIGINS.split(',') :
    ['http://localhost:3000', 'http://localhost:3001'];

  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check Origin header
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      status: 'error',
      message: 'Origin not allowed'
    });
  }

  // Additional check for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Verify that the request comes from an allowed origin
    if (!origin && !referer) {
      return res.status(403).json({
        status: 'error',
        message: 'Missing origin or referer header'
      });
    }
  }

  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Common validation rules
const validationRules = {
  // ID validation
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),

  // User ID validation
  userId: param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),

  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  // Password validation
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Date validation
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO date')
      .custom((endDate, { req }) => {
        if (req.query.startDate && endDate) {
          if (new Date(endDate) < new Date(req.query.startDate)) {
            throw new Error('End date cannot be before start date');
          }
        }
        return true;
      })
  ]
};

// SQL injection protection (additional layer)
const sqlInjectionProtection = (req, res, next) => {
  const dangerousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\\x23)|(\-\-)|(\;)|(\*\/)|(\*))/i,
    /(<script|javascript:|vbscript:|onload=|onerror=)/i
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          return true; // Found dangerous pattern
        }
      }
    }
    return false;
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && checkValue(obj[key])) {
        return true;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  // Check request body, query, and params
  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid input detected'
    });
  }

  next();
};

// Log security events
const securityLogger = (req, res, next) => {
  const originalSend = res.send;
  const startTime = Date.now();

  res.send = function(data) {
    const duration = Date.now() - startTime;

    // Log suspicious activities
    if (res.statusCode >= 400) {
      console.warn(`Security Event: ${req.method} ${req.path} - Status: ${res.statusCode} - IP: ${req.ip} - Duration: ${duration}ms`);
    }

    // Log rate limited requests
    if (res.statusCode === 429) {
      console.warn(`Rate Limit Exceeded: ${req.method} ${req.path} - IP: ${req.ip}`);
    }

    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  // Rate limiting
  generalRateLimit,
  authRateLimit,
  auditRateLimit,
  speedLimiter,

  // Input protection
  sanitizeInput,
  requestSizeLimit,
  sqlInjectionProtection,

  // Security headers
  securityHeaders,

  // Protection middleware
  csrfProtection,
  timeoutProtection,
  securityLogger,

  // Validation
  handleValidationErrors,
  validationRules,

  // XSS protection (to be used with xss-clean)
  xssProtection: xss(),

  // HTTP Parameter Pollution protection
  hppProtection: hpp({
    whitelist: ['page', 'limit', 'sort', 'order'] // Allow multiple values for these params
  })
};