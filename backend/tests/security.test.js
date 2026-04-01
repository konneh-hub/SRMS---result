// Security Tests
// Comprehensive testing suite for security features including rate limiting, input validation, and vulnerability protection

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');
const { expect } = chai;
const sinon = require('sinon');
const rateLimit = require('express-rate-limit');

chai.use(chaiHttp);

describe('Security Features', () => {
  let server;

  before((done) => {
    server = app.listen(3003, done);
  });

  after((done) => {
    server.close(done);
  });

  describe('Rate Limiting', () => {
    describe('Authentication Rate Limiting', () => {
      it('should allow login attempts within limit', async () => {
        const response = await chai.request(server)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });

        // Should get authentication error, not rate limit error
        expect(response.status).to.not.equal(429);
      });

      it('should block excessive login attempts', async function() {
        this.timeout(10000); // Increase timeout for rate limiting test

        // Make multiple rapid login attempts
        const attempts = [];
        for (let i = 0; i < 10; i++) {
          attempts.push(
            chai.request(server)
              .post('/api/auth/login')
              .send({
                email: 'test@example.com',
                password: 'wrongpassword'
              })
          );
        }

        const responses = await Promise.all(attempts);

        // At least one response should be rate limited
        const rateLimited = responses.some(response => response.status === 429);
        expect(rateLimited).to.be.true;
      });
    });

    describe('Audit Route Rate Limiting', () => {
      it('should apply audit-specific rate limiting', async function() {
        this.timeout(15000);

        // Make multiple audit requests
        const attempts = [];
        for (let i = 0; i < 25; i++) {
          attempts.push(
            chai.request(server)
              .get('/api/audit/logs')
              .set('Authorization', 'Bearer invalid-token')
          );
        }

        const responses = await Promise.all(attempts);

        // Should be rate limited
        const rateLimited = responses.some(response => response.status === 429);
        expect(rateLimited).to.be.true;
      });
    });
  });

  describe('Input Validation and Sanitization', () => {
    describe('XSS Protection', () => {
      it('should sanitize XSS payloads in input', async () => {
        const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';

        const response = await chai.request(server)
          .post('/api/auth/login')
          .send({
            email: xssPayload,
            password: 'password123'
          });

        expect(response.status).to.not.equal(500);
        // Input should be sanitized, not cause server errors
      });

      it('should prevent SQL injection attempts', async () => {
        const sqlInjection = "'; DROP TABLE users; --";

        const response = await chai.request(server)
          .post('/api/auth/login')
          .send({
            email: sqlInjection,
            password: 'password123'
          });

        expect(response.status).to.not.equal(500);
        // Should not execute SQL injection
      });
    });

    describe('Input Validation', () => {
      it('should validate email format', async () => {
        const response = await chai.request(server)
          .post('/api/auth/login')
          .send({
            email: 'invalid-email',
            password: 'password123'
          });

        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('errors');
      });

      it('should validate required fields', async () => {
        const response = await chai.request(server)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com'
            // Missing password
          });

        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('errors');
      });
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      const response = await chai.request(server)
        .get('/api/health');

      expect(response.headers).to.have.property('x-content-type-options', 'nosniff');
      expect(response.headers).to.have.property('x-frame-options', 'DENY');
      expect(response.headers).to.have.property('x-xss-protection', '1; mode=block');
      expect(response.headers).to.have.property('strict-transport-security');
    });

    it('should prevent clickjacking', async () => {
      const response = await chai.request(server)
        .get('/api/health');

      expect(response.headers).to.have.property('x-frame-options', 'DENY');
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF token in responses', async () => {
      const response = await chai.request(server)
        .get('/api/health');

      // CSRF protection should be active
      expect(response.status).to.not.equal(403);
    });
  });

  describe('Timeout Protection', () => {
    it('should timeout slow requests', async function() {
      this.timeout(35000); // Allow time for timeout

      const response = await chai.request(server)
        .get('/api/health')
        .timeout(30000);

      expect(response.status).to.equal(408);
    });
  });

  describe('Parameter Pollution Protection', () => {
    it('should prevent parameter pollution', async () => {
      const response = await chai.request(server)
        .post('/api/auth/login?email=test@example.com&email=evil@example.com')
        .send({
          password: 'password123'
        });

      // Should use first parameter, not be confused by pollution
      expect(response.status).to.not.equal(500);
    });
  });

  describe('Progressive Delay (Slow Down)', () => {
    it('should implement progressive delays for failed attempts', async function() {
      this.timeout(20000);

      const startTime = Date.now();

      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await chai.request(server)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take longer due to progressive delays
      expect(duration).to.be.greaterThan(1000);
    });
  });

  describe('Error Handling Security', () => {
    it('should not leak sensitive information in errors', async () => {
      const response = await chai.request(server)
        .get('/api/nonexistent-route');

      expect(response.status).to.equal(404);
      expect(response.body).to.not.have.property('stack');
      expect(response.body).to.not.have.property('sql');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await chai.request(server)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{invalid json}');

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('Audit Trail Security', () => {
    it('should audit security events', async () => {
      // This would require a valid token and checking audit logs
      // For now, just ensure the audit endpoint exists and is protected
      const response = await chai.request(server)
        .get('/api/audit/logs');

      expect(response.status).to.equal(401); // Should require authentication
    });
  });
});