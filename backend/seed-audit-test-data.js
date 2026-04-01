// Seed Audit Test Data
// Run this script to create sample audit logs for testing
// Usage: node seed-audit-test-data.js

const AuditService = require('./src/services/auditService');
const db = require('./src/config/database');

async function seedAuditTestData() {
  const auditService = new AuditService();

  console.log('Seeding audit test data...');

  try {
    // Sample users for testing
    const users = [
      { id: 1, email: 'admin@university.edu', role: 'admin', universityId: 1, tenantId: 'tenant1' },
      { id: 2, email: 'lecturer@university.edu', role: 'lecturer', universityId: 1, tenantId: 'tenant1' },
      { id: 3, email: 'student@university.edu', role: 'student', universityId: 1, tenantId: 'tenant1' }
    ];

    // Sample audit events
    const auditEvents = [
      // Result management events
      {
        user: users[1], // lecturer
        action: 'upload_scores',
        entityType: 'result',
        entityData: { submissionId: 1, courseName: 'Computer Science 101' },
        options: {
          entityId: 1,
          entityName: 'CS101 Result Submission',
          metadata: { scoreCount: 25, averageScore: 78.5 }
        }
      },
      {
        user: users[1], // lecturer
        action: 'submit_for_approval',
        entityType: 'result',
        entityData: { submissionId: 1 },
        options: {
          entityId: 1,
          entityName: 'CS101 Result Submission',
          metadata: { submittedAt: new Date().toISOString() }
        }
      },
      {
        user: users[0], // admin
        action: 'approve_submission',
        entityType: 'result',
        entityData: { submissionId: 1 },
        options: {
          entityId: 1,
          entityName: 'CS101 Result Submission',
          metadata: { approvedBy: 'admin', remarks: 'Approved with minor corrections' }
        }
      },
      {
        user: users[1], // lecturer
        action: 'reject_submission',
        entityType: 'result',
        entityData: { submissionId: 2 },
        options: {
          entityId: 2,
          entityName: 'Mathematics 201 Result Submission',
          metadata: { rejectionReason: 'Incomplete data', rejectionNotes: 'Missing grades for 3 students' }
        }
      },

      // User management events
      {
        user: users[0], // admin
        action: 'create',
        entityType: 'user',
        entityData: { email: 'newstudent@university.edu', firstName: 'John', lastName: 'Doe' },
        options: {
          entityId: 4,
          entityName: 'John Doe',
          metadata: { role: 'student', department: 'Computer Science' }
        }
      },
      {
        user: users[0], // admin
        action: 'update',
        entityType: 'user',
        entityData: { email: 'student@university.edu' },
        options: {
          entityId: 3,
          entityName: 'Jane Smith',
          oldValues: { gpa: 3.2 },
          newValues: { gpa: 3.5 },
          metadata: { updatedFields: ['gpa'] }
        }
      },

      // Course management events
      {
        user: users[0], // admin
        action: 'create',
        entityType: 'course',
        entityData: { name: 'Advanced Algorithms', code: 'CS301' },
        options: {
          entityId: 10,
          entityName: 'Advanced Algorithms (CS301)',
          metadata: { credits: 3, department: 'Computer Science' }
        }
      },

      // Authentication events
      {
        user: users[0], // admin
        action: 'login',
        entityType: 'authentication',
        entityData: {},
        options: {
          metadata: { ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0' }
        }
      },
      {
        user: users[1], // lecturer
        action: 'password_change',
        entityType: 'authentication',
        entityData: {},
        options: {
          metadata: { reason: 'Security policy' }
        }
      },

      // Failed operations (for testing error logging)
      {
        user: users[2], // student
        action: 'upload_scores',
        entityType: 'result',
        entityData: { submissionId: 999 },
        options: {
          status: 'failed',
          errorMessage: 'Permission denied: insufficient privileges',
          metadata: { attemptedAction: 'upload_scores', reason: 'role_restriction' }
        }
      }
    ];

    // Insert audit events
    for (const event of auditEvents) {
      try {
        await auditService.logAction(
          event.user,
          event.action,
          event.entityType,
          event.entityData,
          event.options
        );
        console.log(`✓ Logged: ${event.action} by ${event.user.email}`);
      } catch (error) {
        console.error(`✗ Failed to log: ${event.action} - ${error.message}`);
      }
    }

    // Add some historical data (backdated)
    const historicalEvents = [
      {
        user: users[1],
        action: 'upload_scores',
        entityType: 'result',
        entityData: { submissionId: 5, courseName: 'Database Systems' },
        options: {
          entityId: 5,
          entityName: 'DBS201 Result Submission',
          metadata: { scoreCount: 30 },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      },
      {
        user: users[1],
        action: 'upload_scores',
        entityType: 'result',
        entityData: { submissionId: 6, courseName: 'Web Development' },
        options: {
          entityId: 6,
          entityName: 'WEB101 Result Submission',
          metadata: { scoreCount: 28 },
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
        }
      }
    ];

    // Insert historical events with backdated timestamps
    for (const event of historicalEvents) {
      try {
        // Direct database insertion for historical data
        const auditData = {
          userId: event.user.id,
          universityId: event.user.universityId,
          action: event.action,
          entityType: event.entityType,
          entityId: event.options.entityId,
          entityName: event.options.entityName,
          metadata: JSON.stringify(event.options.metadata),
          tenantId: event.user.tenantId,
          created_at: event.options.createdAt
        };

        const query = `
          INSERT INTO audit_logs (
            user_id, university_id, action, entity_type, entity_id, entity_name,
            metadata, tenant_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        const values = [
          auditData.userId, auditData.universityId, auditData.action,
          auditData.entityType, auditData.entityId, auditData.entityName,
          auditData.metadata, auditData.tenantId, auditData.created_at
        ];

        await db.query(query, values);
        console.log(`✓ Logged historical: ${event.action} (${event.options.createdAt.toISOString().split('T')[0]})`);
      } catch (error) {
        console.error(`✗ Failed to log historical event: ${error.message}`);
      }
    }

    console.log('\n✅ Audit test data seeding completed!');
    console.log('📊 Generated audit logs for testing:');
    console.log('   - Result management actions (upload, approve, reject)');
    console.log('   - User management actions (create, update)');
    console.log('   - Course management actions');
    console.log('   - Authentication events');
    console.log('   - Error scenarios');
    console.log('   - Historical data (7 and 14 days ago)');
    console.log('\n🚀 You can now test the audit system using:');
    console.log('   - Postman collection: Audit_System_Postman_Collection.json');
    console.log('   - Automated tests: node test-audit-system.js');

  } catch (error) {
    console.error('❌ Error seeding audit test data:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedAuditTestData();
}

module.exports = seedAuditTestData;