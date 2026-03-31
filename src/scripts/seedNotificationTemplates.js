/**
 * Notification Templates Seeder
 * Initializes default notification templates for the system
 */

const db = require('../config/database');

async function seedNotificationTemplates() {
    try {
        console.log('Seeding notification templates...');

        const tenantId = 'default'; // You may need to adjust this

        const templates = [
            {
                eventType: 'result_published',
                name: 'Result Published',
                description: 'Notification sent when student grades are published',
                emailSubject: 'Your grades have been published - {{courseName}}',
                emailTemplate: `<h2>Grade Published</h2><p>Your grade for {{courseName}} has been published:</p><p><strong>Grade: {{grade}}</strong> ({{score}}%)</p>`,
                smsTemplate: 'Your {{courseName}} grade: {{grade}} ({{score}}%)',
                pushTitle: 'Grade Published',
                pushBody: '{{courseName}}: {{grade}}',
                inAppTemplate: 'Your grade for {{courseName}} has been published: {{grade}} ({{score}}%)',
                variables: ['courseName', 'grade', 'score']
            },
            {
                eventType: 'account_created',
                name: 'Account Created',
                description: 'Notification sent when new account is created',
                emailSubject: 'Welcome {{userName}} - Your account has been created',
                emailTemplate: `<h2>Welcome {{userName}}</h2><p>Your {{role}} account has been created successfully.</p><p>You can now log in to the system with your credentials.</p>`,
                smsTemplate: 'Welcome {{userName}}! Your {{role}} account is ready.',
                pushTitle: 'Account Created',
                pushBody: 'Welcome! Your account is ready.',
                inAppTemplate: 'Welcome {{userName}}! Your {{role}} account has been created.',
                variables: ['userName', 'role']
            },
            {
                eventType: 'approval_pending',
                name: 'Approval Pending',
                description: 'Notification sent when approval is pending',
                emailSubject: 'Action Required: {{approvalType}} approval needed',
                emailTemplate: `<h2>Approval Required</h2><p>A new {{approvalType}} approval request requires your attention:</p><p>{{entityName}}</p>`,
                smsTemplate: 'New {{approvalType}} approval needed: {{entityName}}',
                pushTitle: 'Approval Needed',
                pushBody: '{{approvalType}}: {{entityName}}',
                inAppTemplate: 'A new {{approvalType}} approval request has been submitted: {{entityName}}',
                variables: ['approvalType', 'entityName']
            },
            {
                eventType: 'approval_approved',
                name: 'Approval Approved',
                description: 'Notification sent when approval is granted',
                emailSubject: 'Approved: {{approvalType}} request has been approved',
                emailTemplate: `<h2>Request Approved</h2><p>Your {{approvalType}} request has been approved by {{approverName}}.</p><p>{{entityName}}</p>`,
                smsTemplate: '{{approvalType}} approved by {{approverName}}',
                pushTitle: 'Approval Granted',
                pushBody: '{{approvalType}} approved',
                inAppTemplate: 'Your {{approvalType}} request has been approved by {{approverName}}: {{entityName}}',
                variables: ['approvalType', 'approverName', 'entityName']
            },
            {
                eventType: 'approval_rejected',
                name: 'Approval Rejected',
                description: 'Notification sent when approval is rejected',
                emailSubject: 'Rejected: {{approvalType}} request has been rejected',
                emailTemplate: `<h2>Request Rejected</h2><p>Your {{approvalType}} request has been rejected by {{approverName}}.</p><p>Reason: {{rejectionReason}}</p>`,
                smsTemplate: '{{approvalType}} rejected. Reason: {{rejectionReason}}',
                pushTitle: 'Approval Rejected',
                pushBody: '{{approvalType}} rejected',
                inAppTemplate: 'Your {{approvalType}} request has been rejected. Reason: {{rejectionReason}}',
                variables: ['approvalType', 'approverName', 'rejectionReason']
            },
            {
                eventType: 'enrollment_confirmed',
                name: 'Enrollment Confirmed',
                description: 'Notification sent when student enrollment is confirmed',
                emailSubject: 'Enrollment Confirmed - {{courseName}}',
                emailTemplate: `<h2>Enrollment Confirmed</h2><p>Your enrollment for {{courseName}} ({{semester}}) has been confirmed.</p>`,
                smsTemplate: 'Enrolled: {{courseName}} - {{semester}}',
                pushTitle: 'Enrollment Confirmed',
                pushBody: '{{courseName}} - {{semester}}',
                inAppTemplate: 'Your enrollment for {{courseName}} ({{semester}}) has been confirmed.',
                variables: ['courseName', 'semester']
            },
            {
                eventType: 'course_registered',
                name: 'Course Registered',
                description: 'Notification sent when student registers for course',
                emailSubject: 'Course Registration Confirmed - {{courseCode}}',
                emailTemplate: `<h2>Course Registered</h2><p>You have successfully registered for:</p><p><strong>{{courseCode}}: {{courseName}}</strong></p>`,
                smsTemplate: 'Registered: {{courseCode}} - {{courseName}}',
                pushTitle: 'Course Registered',
                pushBody: '{{courseCode}}: {{courseName}}',
                inAppTemplate: 'You have successfully registered for {{courseCode}}: {{courseName}}',
                variables: ['courseCode', 'courseName']
            },
            {
                eventType: 'grade_updated',
                name: 'Grade Updated',
                description: 'Notification sent when student grade is updated',
                emailSubject: 'Grade Updated - {{courseName}}',
                emailTemplate: `<h2>Grade Updated</h2><p>Your grade for {{courseName}} has been updated.</p><p>Old Grade: {{oldGrade}} → New Grade: {{newGrade}}</p>`,
                smsTemplate: 'Grade changed: {{oldGrade}} → {{newGrade}}',
                pushTitle: 'Grade Updated',
                pushBody: '{{courseName}}: {{newGrade}}',
                inAppTemplate: 'Your grade for {{courseName}} has been updated from {{oldGrade}} to {{newGrade}}',
                variables: ['courseName', 'oldGrade', 'newGrade']
            },
            {
                eventType: 'deadline_approaching',
                name: 'Deadline Approaching',
                description: 'Notification sent when important deadline is approaching',
                emailSubject: 'Deadline Approaching: {{deadlineName}}',
                emailTemplate: `<h2>Deadline Approaching</h2><p>{{deadlineName}} deadline is approaching in {{daysRemaining}} days.</p><p>Please complete the required action soon.</p>`,
                smsTemplate: '{{deadlineName}} due in {{daysRemaining}} days',
                pushTitle: 'Deadline Approaching',
                pushBody: '{{deadlineName}} - {{daysRemaining}} days left',
                inAppTemplate: '{{deadlineName}} deadline is approaching in {{daysRemaining}} days',
                variables: ['deadlineName', 'daysRemaining']
            },
            {
                eventType: 'system_announcement',
                name: 'System Announcement',
                description: 'Notification sent for system announcements',
                emailSubject: '{{title}}',
                emailTemplate: `<h2>{{title}}</h2><p>{{message}}</p>`,
                smsTemplate: '{{title}}: {{message}}',
                pushTitle: '{{title}}',
                pushBody: '{{message}}',
                inAppTemplate: '{{title}}: {{message}}',
                variables: ['title', 'message']
            }
        ];

        for (const template of templates) {
            try {
                const query = `
                    INSERT INTO notification_templates (
                        event_type, name, description, email_subject,
                        email_template, sms_template, push_title, push_body,
                        in_app_template, variables, is_active, tenant_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
                    ON CONFLICT (event_type) DO UPDATE SET
                        name = $2,
                        description = $3,
                        email_subject = $4,
                        email_template = $5,
                        sms_template = $6,
                        push_title = $7,
                        push_body = $8,
                        in_app_template = $9,
                        variables = $10
                `;

                const result = await db.query(query, [
                    template.eventType,
                    template.name,
                    template.description,
                    template.emailSubject,
                    template.emailTemplate,
                    template.smsTemplate,
                    template.pushTitle,
                    template.pushBody,
                    template.inAppTemplate,
                    JSON.stringify(template.variables),
                    tenantId
                ]);

                console.log(`✓ Template created/updated: ${template.eventType}`);
            } catch (error) {
                console.error(`✗ Error seeding template ${template.eventType}:`, error.message);
            }
        }

        console.log('Notification templates seeding completed!');
    } catch (error) {
        console.error('Error seeding notification templates:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedNotificationTemplates()
        .then(() => {
            process.exit(0);
        })
        .catch(() => {
            process.exit(1);
        });
}

module.exports = { seedNotificationTemplates };