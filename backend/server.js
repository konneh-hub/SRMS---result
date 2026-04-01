const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Import security middleware
const {
  generalRateLimit,
  authRateLimit,
  speedLimiter,
  sanitizeInput,
  requestSizeLimit,
  sqlInjectionProtection,
  securityHeaders,
  csrfProtection,
  timeoutProtection,
  securityLogger,
  xssProtection,
  hppProtection
} = require('./src/middleware/security');

// Security Middleware (Order is important!)
app.use(securityLogger); // Log all requests first
app.use(timeoutProtection); // Set request timeouts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
})); // Security headers
app.use(securityHeaders); // Additional security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ?
    process.env.ALLOWED_ORIGINS.split(',') :
    ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
})); // CORS configuration
app.use(hppProtection); // HTTP Parameter Pollution protection
app.use(xssProtection); // XSS protection
app.use(requestSizeLimit); // Request size limiting
app.use(sanitizeInput); // Input sanitization
app.use(sqlInjectionProtection); // SQL injection protection
app.use(speedLimiter); // Progressive delay for brute force protection
app.use(generalRateLimit); // General rate limiting

// Logging and body parsing
app.use(morgan('combined')); // Request logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Multi-tenant Middleware
app.use(require('./src/middleware/tenant'));

// CSRF protection for state-changing operations
app.use('/api', csrfProtection);

// Auth Routes (public)
app.use('/api/auth', require('./src/routes/auth'));

// Protected Routes
const { authenticate } = require('./src/middleware/auth');
app.use('/api', authenticate, require('./src/routes'));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.APP_PORT || process.env.PORT || 3000;

// Ensure database host is not localhost inside Docker network
console.log(`DB connection config zone: host=${process.env.DB_HOST}, port=${process.env.DB_PORT}, db=${process.env.DB_NAME}, user=${process.env.DB_USER}`);
if (process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1') {
  console.warn('Warning: DB_HOST is set to localhost; within Docker this should be set to service name `postgres`');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});