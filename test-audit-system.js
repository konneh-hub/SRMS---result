// Audit System Test Script
// Run with: node test-audit-system.js

const axios = require('axios');
const fs = require('fs');

class AuditSystemTester {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.authToken = null;
    this.testResults = [];
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${status}] ${message}`);
    this.testResults.push({ timestamp, status, message });
  }

  async login() {
    try {
      this.log('Attempting to login...');
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: 'admin@university.edu',
        password: 'admin123'
      });

      if (response.data.status === 'success') {
        this.authToken = response.data.data.token;
        this.log('Login successful', 'SUCCESS');
        return true;
      } else {
        this.log('Login failed: ' + response.data.message, 'ERROR');
        return false;
      }
    } catch (error) {
      this.log('Login error: ' + error.message, 'ERROR');
      return false;
    }
  }

  async makeRequest(method, url, data = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${url}`,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  async testAuditLogsEndpoint() {
    this.log('Testing GET /audit/logs endpoint...');

    const result = await this.makeRequest('GET', '/audit/logs?page=1&limit=5');

    if (result.success) {
      this.log('Audit logs retrieved successfully', 'SUCCESS');
      if (result.data.data && Array.isArray(result.data.data)) {
        this.log(`Retrieved ${result.data.data.length} audit log entries`);
      }
    } else {
      this.log(`Failed to get audit logs: ${JSON.stringify(result.error)}`, 'ERROR');
    }
  }

  async testAuditStatsEndpoint() {
    this.log('Testing GET /audit/stats endpoint...');

    const result = await this.makeRequest('GET', '/audit/stats');

    if (result.success) {
      this.log('Audit statistics retrieved successfully', 'SUCCESS');
      if (result.data.data && Array.isArray(result.data.data)) {
        this.log(`Retrieved ${result.data.data.length} statistic entries`);
      }
    } else {
      this.log(`Failed to get audit stats: ${JSON.stringify(result.error)}`, 'ERROR');
    }
  }

  async testUserActivityEndpoint() {
    this.log('Testing GET /audit/user-activity/:id endpoint...');

    const result = await this.makeRequest('GET', '/audit/user-activity/1?limit=5');

    if (result.success) {
      this.log('User activity retrieved successfully', 'SUCCESS');
      if (result.data.data && Array.isArray(result.data.data)) {
        this.log(`Retrieved ${result.data.data.length} activity entries`);
      }
    } else {
      this.log(`Failed to get user activity: ${JSON.stringify(result.error)}`, 'ERROR');
    }
  }

  async testAuditLogDetailsEndpoint() {
    this.log('Testing GET /audit/logs/:id endpoint...');

    // First get a list to find a valid ID
    const listResult = await this.makeRequest('GET', '/audit/logs?page=1&limit=1');

    if (listResult.success && listResult.data.data && listResult.data.data.length > 0) {
      const logId = listResult.data.data[0].id;
      this.log(`Testing with audit log ID: ${logId}`);

      const result = await this.makeRequest('GET', `/audit/logs/${logId}`);

      if (result.success) {
        this.log('Audit log details retrieved successfully', 'SUCCESS');
      } else {
        this.log(`Failed to get audit log details: ${JSON.stringify(result.error)}`, 'ERROR');
      }
    } else {
      this.log('No audit logs available to test details endpoint', 'WARNING');
    }
  }

  async testExportEndpoint() {
    this.log('Testing GET /audit/export endpoint...');

    const result = await this.makeRequest('GET', '/audit/export?format=json&limit=10');

    if (result.success) {
      this.log('Audit logs exported successfully', 'SUCCESS');
      if (Array.isArray(result.data)) {
        this.log(`Exported ${result.data.length} audit log entries`);
      }
    } else {
      this.log(`Failed to export audit logs: ${JSON.stringify(result.error)}`, 'ERROR');
    }
  }

  async testValidation() {
    this.log('Testing validation errors...');

    // Test invalid date range
    const invalidDateResult = await this.makeRequest('GET', '/audit/logs?startDate=2024-12-31&endDate=2024-01-01');

    if (!invalidDateResult.success && invalidDateResult.status === 400) {
      this.log('Date validation working correctly', 'SUCCESS');
    } else {
      this.log('Date validation not working as expected', 'WARNING');
    }

    // Test invalid limit
    const invalidLimitResult = await this.makeRequest('GET', '/audit/logs?limit=150');

    if (!invalidLimitResult.success && invalidLimitResult.status === 400) {
      this.log('Limit validation working correctly', 'SUCCESS');
    } else {
      this.log('Limit validation not working as expected', 'WARNING');
    }
  }

  async testAccessControl() {
    this.log('Testing access control...');

    // Test without authentication
    try {
      await axios.get(`${this.baseURL}/audit/logs`);
      this.log('Access control failed - endpoint accessible without auth', 'ERROR');
    } catch (error) {
      if (error.response?.status === 401) {
        this.log('Access control working - authentication required', 'SUCCESS');
      } else {
        this.log('Unexpected error during access control test', 'WARNING');
      }
    }
  }

  async runAllTests() {
    this.log('Starting Audit System Tests...');

    // Login first
    if (!(await this.login())) {
      this.log('Cannot proceed with tests - login failed', 'ERROR');
      return;
    }

    // Run all tests
    await this.testAuditLogsEndpoint();
    await this.testAuditStatsEndpoint();
    await this.testUserActivityEndpoint();
    await this.testAuditLogDetailsEndpoint();
    await this.testExportEndpoint();
    await this.testValidation();
    await this.testAccessControl();

    this.log('Audit System Tests completed');

    // Generate summary
    this.generateSummary();
  }

  generateSummary() {
    const successCount = this.testResults.filter(r => r.status === 'SUCCESS').length;
    const errorCount = this.testResults.filter(r => r.status === 'ERROR').length;
    const warningCount = this.testResults.filter(r => r.status === 'WARNING').length;
    const totalTests = this.testResults.filter(r => ['SUCCESS', 'ERROR', 'WARNING'].includes(r.status)).length;

    console.log('\n=== AUDIT SYSTEM TEST SUMMARY ===');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Warnings: ${warningCount}`);

    if (errorCount === 0) {
      console.log('✅ All critical tests passed!');
    } else {
      console.log('❌ Some tests failed. Check the logs above for details.');
    }

    // Save detailed results to file
    const report = {
      summary: {
        totalTests,
        successCount,
        errorCount,
        warningCount,
        timestamp: new Date().toISOString()
      },
      results: this.testResults
    };

    fs.writeFileSync('audit-system-test-results.json', JSON.stringify(report, null, 2));
    console.log('Detailed test results saved to audit-system-test-results.json');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AuditSystemTester();
  tester.runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = AuditSystemTester;