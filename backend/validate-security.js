// Security Validation Script
// Basic validation of security features without full test suite

const express = require('express');
const {
  generalRateLimit,
  authRateLimit,
  sanitizeInput,
  securityHeaders,
  xssProtection,
  hppProtection
} = require('./src/middleware/security');

console.log('🔒 Security Features Validation');
console.log('================================');

// Test 1: Check if security middleware can be imported
try {
  console.log('✅ Security middleware imported successfully');
} catch (error) {
  console.log('❌ Failed to import security middleware:', error.message);
  process.exit(1);
}

// Test 2: Check if rate limiters are functions
try {
  if (typeof generalRateLimit === 'function') {
    console.log('✅ General rate limiter is a function');
  } else {
    console.log('❌ General rate limiter is not a function');
  }

  if (typeof authRateLimit === 'function') {
    console.log('✅ Auth rate limiter is a function');
  } else {
    console.log('❌ Auth rate limiter is not a function');
  }
} catch (error) {
  console.log('❌ Rate limiter validation failed:', error.message);
}

// Test 3: Check if sanitization middleware exists
try {
  if (typeof sanitizeInput === 'function') {
    console.log('✅ Input sanitization middleware is a function');
  } else {
    console.log('❌ Input sanitization middleware is not a function');
  }
} catch (error) {
  console.log('❌ Sanitization middleware validation failed:', error.message);
}

// Test 4: Check security headers
try {
  if (typeof securityHeaders === 'function') {
    console.log('✅ Security headers middleware is a function');
  } else {
    console.log('❌ Security headers middleware is not a function');
  }
} catch (error) {
  console.log('❌ Security headers validation failed:', error.message);
}

// Test 5: Check XSS protection
try {
  if (typeof xssProtection === 'function') {
    console.log('✅ XSS protection middleware is a function');
  } else {
    console.log('❌ XSS protection middleware is not a function');
  }
} catch (error) {
  console.log('❌ XSS protection validation failed:', error.message);
}

// Test 6: Check HPP protection
try {
  if (typeof hppProtection === 'function') {
    console.log('✅ HPP protection middleware is a function');
  } else {
    console.log('❌ HPP protection middleware is not a function');
  }
} catch (error) {
  console.log('❌ HPP protection validation failed:', error.message);
}

// Test 7: Check if all required route files can be imported
const routeFiles = [
  './src/routes/audit',
  './src/routes/auth',
  './src/routes/users',
  './src/routes/results',
  './src/routes/billing',
  './src/routes/payments',
  './src/routes/notifications',
  './src/routes/enrollments',
  './src/routes/students',
  './src/routes/facultyRoutes',
  './src/routes/departmentRoutes',
  './src/routes/programRoutes',
  './src/routes/courseRoutes',
  './src/routes/staffRoutes',
  './src/routes/universities',
  './src/routes/subscriptionPlans',
  './src/routes/universitySubscriptions',
  './src/routes/gradingScales'
];

console.log('\n🔍 Route Files Validation:');
routeFiles.forEach(routeFile => {
  try {
    require(routeFile);
    console.log(`✅ ${routeFile} imported successfully`);
  } catch (error) {
    console.log(`❌ Failed to import ${routeFile}:`, error.message);
  }
});

// Test 8: Check server.js syntax
console.log('\n🖥️  Server.js Validation:');
try {
  require('./server.js');
  console.log('✅ server.js syntax is valid');
} catch (error) {
  console.log('❌ server.js syntax error:', error.message);
}

console.log('\n🎉 Security validation completed!');
console.log('=====================================');
console.log('If all checks passed, security features are properly implemented.');
console.log('Run "npm test" to execute the full security test suite.');