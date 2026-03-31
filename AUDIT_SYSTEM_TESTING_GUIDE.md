# Audit System Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Audit Logging System. The audit system tracks all user actions including result updates and approvals, ensuring compliance and accountability.

## Prerequisites

1. **Database Setup**: Run `node db-init.js` to create audit tables
2. **Server Running**: Start the server with `npm start`
3. **Test Data**: Generate some audit logs by performing actions (result uploads, approvals, etc.)
4. **Postman**: Import the provided collection
5. **Node.js**: For running automated tests

## Testing Tools

### 1. Postman Collection
- **File**: `Audit_System_Postman_Collection.json`
- **Import**: Open Postman → Import → Upload Files → Select the JSON file

### 2. Automated Test Script
- **File**: `test-audit-system.js`
- **Run**: `node test-audit-system.js`

## Authentication Setup

### In Postman:
1. Set the `base_url` variable to your API endpoint (default: `http://localhost:3000/api`)
2. Run the "Login (Get Auth Token)" request
3. The auth token will be automatically saved to the `auth_token` collection variable

### For Automated Tests:
The test script automatically logs in with admin credentials.

## Test Categories

### 1. Basic Functionality Tests

#### Get All Audit Logs
- **Endpoint**: `GET /api/audit/logs`
- **Expected**: Returns paginated list of audit logs
- **Test Cases**:
  - Default pagination (page=1, limit=10)
  - Custom pagination
  - Empty result set

#### Get Filtered Audit Logs
- **Filters Available**:
  - `userId`: Filter by specific user
  - `action`: Filter by action type (upload_scores, approve_submission, etc.)
  - `entityType`: Filter by entity type (result, student, course, etc.)
  - `status`: Filter by status (success, failed, warning)
  - `startDate/endDate`: Date range filtering
  - `universityId`: Filter by university

#### Get Audit Statistics
- **Endpoint**: `GET /api/audit/stats`
- **Expected**: Returns aggregated statistics by action and entity type
- **Test Cases**:
  - Overall statistics
  - Date-filtered statistics

#### Get User Activity
- **Endpoint**: `GET /api/audit/user-activity/:userId`
- **Expected**: Returns activity logs for specific user
- **Test Cases**:
  - Own activity (any authenticated user)
  - Other user's activity (admin only)
  - Access denied for non-admin

#### Get Specific Audit Log
- **Endpoint**: `GET /api/audit/logs/:id`
- **Expected**: Returns detailed information for specific audit log
- **Test Cases**:
  - Valid ID
  - Invalid ID (404 error)

### 2. Export Functionality Tests

#### JSON Export
- **Endpoint**: `GET /api/audit/export?format=json`
- **Expected**: Downloads JSON file with audit logs
- **Test Cases**:
  - Full export
  - Filtered export
  - Date range export

#### CSV Export
- **Endpoint**: `GET /api/audit/export?format=csv`
- **Expected**: Downloads CSV file with audit logs
- **Test Cases**:
  - CSV format validation
  - Special character handling

### 3. Validation Tests

#### Date Range Validation
- **Test**: `startDate=2024-12-31&endDate=2024-01-01`
- **Expected**: 400 Bad Request with "Start date cannot be after end date"

#### Limit Validation
- **Test**: `limit=150`
- **Expected**: 400 Bad Request with "Limit cannot exceed 100"

#### Parameter Validation
- **Test**: Invalid parameter types (page="abc", limit=-1)
- **Expected**: 400 Bad Request with validation errors

### 4. Security Tests

#### Authentication Required
- **Test**: Access endpoints without Authorization header
- **Expected**: 401 Unauthorized

#### Role-Based Access Control
- **Test**: Access admin-only endpoints with non-admin token
- **Expected**: 403 Forbidden

#### Tenant Isolation
- **Test**: Access logs from different tenant
- **Expected**: Only current tenant's logs returned

### 5. Error Handling Tests

#### Database Connection Issues
- **Test**: Stop database during request
- **Expected**: 500 Internal Server Error with proper error message

#### Invalid Parameters
- **Test**: Malformed JSON, invalid IDs
- **Expected**: Appropriate error responses

## Generating Test Data

To create audit logs for testing, perform these actions:

### 1. Create Result Submission
```bash
POST /api/results/submissions
{
  "courseId": 1,
  "semester": "fall",
  "academicYear": 2024
}
```

### 2. Upload Scores
```bash
PUT /api/results/submissions/{submissionId}/scores
{
  "scores": [
    {
      "studentId": "STU001",
      "score": 85,
      "midtermScore": 80,
      "finalScore": 90
    }
  ]
}
```

### 3. Submit for Approval
```bash
POST /api/results/submissions/{submissionId}/submit
```

### 4. Approve/Reject Submission
```bash
POST /api/results/submissions/{submissionId}/approve
{
  "remarks": "Approved with minor corrections"
}
```

## Postman Test Scripts

The Postman collection includes automatic tests that:

1. **Validate Response Structure**: Check for required fields
2. **Validate Status Codes**: Ensure correct HTTP status codes
3. **Validate Pagination**: Check pagination metadata
4. **Validate Data Types**: Ensure correct data types in responses

Example test script:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success status", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("success");
});

pm.test("Response has data array", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.be.an("array");
});

pm.test("Pagination metadata present", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.pagination).to.have.property("page");
    pm.expect(jsonData.pagination).to.have.property("limit");
    pm.expect(jsonData.pagination).to.have.property("total");
});
```

## Automated Testing

### Running the Test Script

```bash
# Install axios if not already installed
npm install axios

# Run the test script
node test-audit-system.js
```

The script will:
1. Login automatically
2. Test all endpoints
3. Validate responses
4. Generate a detailed test report
5. Save results to `audit-system-test-results.json`

### Test Results

The test script generates:
- **Console Output**: Real-time test progress
- **JSON Report**: Detailed results in `audit-system-test-results.json`
- **Summary**: Pass/fail counts and recommendations

## Performance Testing

### Load Testing
```bash
# Use Apache Bench for basic load testing
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/audit/logs
```

### Query Performance
Monitor database query performance for:
- Large result sets
- Complex filters
- Date range queries

## Troubleshooting

### Common Issues

#### No Audit Logs Appearing
- Check if actions are actually creating logs
- Verify database connection
- Check server logs for audit service errors

#### Authentication Failures
- Verify token is valid and not expired
- Check user has required permissions
- Ensure tenant context is correct

#### Validation Errors
- Check parameter types and formats
- Verify date formats (ISO 8601)
- Ensure IDs are numeric where required

#### Performance Issues
- Check database indexes
- Monitor query execution plans
- Consider pagination limits

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=audit:* npm start
```

## Compliance Testing

### GDPR Compliance
- Verify personal data is properly masked
- Test data export functionality
- Check retention policy enforcement

### Audit Trail Integrity
- Verify logs cannot be modified
- Test chronological ordering
- Validate data consistency

## Integration Testing

### With Result Management
1. Create result submission → Check audit log created
2. Upload scores → Verify audit entry
3. Submit for approval → Confirm workflow tracking
4. Approve/reject → Validate approval logging

### With User Management
1. Create user → Check audit log
2. Update user profile → Verify change tracking
3. Change password → Confirm security logging

## Monitoring and Alerts

### Key Metrics to Monitor
- Audit log volume trends
- Error rates in audit operations
- Query performance metrics
- Storage utilization

### Alert Conditions
- High error rates (>5%)
- Unusual activity patterns
- Storage capacity warnings
- Performance degradation

## Best Practices

1. **Test Regularly**: Run automated tests after deployments
2. **Monitor Logs**: Set up alerts for audit system issues
3. **Review Access**: Regularly audit who can access audit logs
4. **Backup Data**: Ensure audit logs are included in backups
5. **Performance**: Monitor and optimize query performance
6. **Compliance**: Regularly review compliance requirements

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Review the API documentation
3. Run the automated test script for diagnostics
4. Check database connectivity and permissions