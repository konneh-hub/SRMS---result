// Database initialization script
// Run this script to create the necessary tables for the university system

const db = require('./src/config/database');
const {
  universitySchema,
  studentSchema,
  userSchema,
  subscriptionPlansSchema,
  universitySubscriptionsSchema,
  billingRecordsSchema,
  paymentRecordsSchema,
  facultySchema,
  departmentSchema,
  programSchema,
  courseSchema
} = require('./src/models/schema');
const {
  notificationsSchema,
  notificationPreferencesSchema,
  notificationTemplatesSchema,
  eventLogsSchema,
  notificationChannelsSchema,
  notificationQueueSchema
} = require('./src/models/notificationSchema');
const { auditLogsSchema } = require('./src/models/auditSchema');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');

    // Test database connection
    const health = await db.healthCheck();
    if (health.status !== 'healthy') {
      throw new Error('Database connection failed');
    }
    console.log('✓ Database connection established');

    // Create users table
    await db.query(userSchema);
    console.log('✓ Users table created or already exists');

    // Create universities table
    await db.query(universitySchema);
    console.log('✓ Universities table created or already exists');

    // Create subscription plans table
    await db.query(subscriptionPlansSchema);
    console.log('✓ Subscription plans table created or already exists');

    // Create university subscriptions table
    await db.query(universitySubscriptionsSchema);
    console.log('✓ University subscriptions table created or already exists');

    // Create billing records table
    await db.query(billingRecordsSchema);
    console.log('✓ Billing records table created or already exists');

    // Create payment records table
    await db.query(paymentRecordsSchema);
    console.log('✓ Payment records table created or already exists');

    // Create faculties table
    await db.query(facultySchema);
    console.log('✓ Faculties table created or already exists');

    // Create departments table
    await db.query(departmentSchema);
    console.log('✓ Departments table created or already exists');

    // Create programs table
    await db.query(programSchema);
    console.log('✓ Programs table created or already exists');

    // Create courses table
    await db.query(courseSchema);
    console.log('✓ Courses table created or already exists');

    // Create students table
    await db.query(studentSchema);
    console.log('✓ Students table created or already exists');

    // Create notification tables
    await db.query(notificationsSchema);
    console.log('✓ Notifications table created or already exists');

    await db.query(notificationPreferencesSchema);
    console.log('✓ Notification preferences table created or already exists');

    await db.query(notificationTemplatesSchema);
    console.log('✓ Notification templates table created or already exists');

    await db.query(eventLogsSchema);
    console.log('✓ Event logs table created or already exists');

    await db.query(notificationChannelsSchema);
    console.log('✓ Notification channels table created or already exists');

    await db.query(notificationQueueSchema);
    console.log('✓ Notification queue table created or already exists');

    // Create audit logging table
    await db.query(auditLogsSchema);
    console.log('✓ Audit logs table created or already exists');

    // Create indexes for better performance
    await db.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_universities_tenant_created ON universities(tenant_id, created_at DESC)');
    await db.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_tenant_created ON students(tenant_id, created_at DESC)');
    await db.query('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_university_tenant ON students(university_id, tenant_id)');
    console.log('✓ Database indexes created');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run the initialization
initializeDatabase();