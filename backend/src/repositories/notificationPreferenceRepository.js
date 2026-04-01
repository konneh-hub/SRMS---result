const BaseRepository = require('./BaseRepository');
const db = require('../config/database');

class NotificationPreferenceRepository extends BaseRepository {
    constructor() {
        super('notification_preferences');
    }

    /**
     * Get preferences for a user and event
     */
    async getUserPreference(userId, universityId, eventType) {
        const query = `
            SELECT * FROM notification_preferences
            WHERE user_id = $1 AND university_id = $2 AND event_type = $3
        `;
        const result = await db.query(query, [userId, universityId, eventType]);
        return result.rows[0];
    }

    /**
     * Get all preferences for a user
     */
    async getUserPreferences(userId, universityId) {
        const query = `
            SELECT * FROM notification_preferences
            WHERE user_id = $1 AND university_id = $2
        `;
        const result = await db.query(query, [userId, universityId]);
        return result.rows;
    }

    /**
     * Create or update preference
     */
    async upsertPreference(preferenceData) {
        const {
            userId,
            universityId,
            eventType,
            emailEnabled,
            smsEnabled,
            pushEnabled,
            inAppEnabled,
            frequency,
            quietHoursStart,
            quietHoursEnd,
            quietHoursEnabled,
            tenantId
        } = preferenceData;

        const query = `
            INSERT INTO notification_preferences (
                user_id, university_id, event_type, email_enabled, sms_enabled,
                push_enabled, in_app_enabled, frequency, quiet_hours_start,
                quiet_hours_end, quiet_hours_enabled, tenant_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (user_id, university_id, event_type)
            DO UPDATE SET
                email_enabled = $4,
                sms_enabled = $5,
                push_enabled = $6,
                in_app_enabled = $7,
                frequency = $8,
                quiet_hours_start = $9,
                quiet_hours_end = $10,
                quiet_hours_enabled = $11,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await db.query(query, [
            userId,
            universityId,
            eventType,
            emailEnabled !== undefined ? emailEnabled : true,
            smsEnabled !== undefined ? smsEnabled : false,
            pushEnabled !== undefined ? pushEnabled : true,
            inAppEnabled !== undefined ? inAppEnabled : true,
            frequency || 'immediate',
            quietHoursStart,
            quietHoursEnd,
            quietHoursEnabled || false,
            tenantId
        ]);

        return result.rows[0];
    }

    /**
     * Disable all notifications for a user
     */
    async disableAllNotifications(userId, universityId) {
        const query = `
            UPDATE notification_preferences
            SET email_enabled = false, sms_enabled = false,
                push_enabled = false, in_app_enabled = false,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND university_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [userId, universityId]);
        return result.rows;
    }

    /**
     * Enable specific channel for event
     */
    async enableChannel(userId, universityId, eventType, channel) {
        const updateField = `${channel}_enabled`;
        const query = `
            UPDATE notification_preferences
            SET ${updateField} = true, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND university_id = $2 AND event_type = $3
            RETURNING *
        `;
        const result = await db.query(query, [userId, universityId, eventType]);
        return result.rows[0];
    }

    /**
     * Disable specific channel for event
     */
    async disableChannel(userId, universityId, eventType, channel) {
        const updateField = `${channel}_enabled`;
        const query = `
            UPDATE notification_preferences
            SET ${updateField} = false, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND university_id = $2 AND event_type = $3
            RETURNING *
        `;
        const result = await db.query(query, [userId, universityId, eventType]);
        return result.rows[0];
    }
}

class NotificationTemplateRepository extends BaseRepository {
    constructor() {
        super('notification_templates');
    }

    /**
     * Get template by event type
     */
    async getByEventType(eventType, universityId = null) {
        let query = `
            SELECT * FROM notification_templates
            WHERE event_type = $1 AND is_active = true
        `;
        const params = [eventType];

        if (universityId) {
            query += ` AND (university_id = $2 OR university_id IS NULL)`;
            params.push(universityId);
        } else {
            query += ` AND university_id IS NULL`;
        }

        query += ` ORDER BY university_id NULLS LAST LIMIT 1`;
        const result = await db.query(query, params);
        return result.rows[0];
    }

    /**
     * Get all templates for a university
     */
    async getUniversityTemplates(universityId) {
        const query = `
            SELECT * FROM notification_templates
            WHERE university_id = $1 OR university_id IS NULL
            ORDER BY university_id DESC
        `;
        const result = await db.query(query, [universityId]);
        return result.rows;
    }

    /**
     * Create or update template
     */
    async upsertTemplate(templateData) {
        const {
            eventType,
            name,
            description,
            emailSubject,
            emailTemplate,
            smsTemplate,
            pushTitle,
            pushBody,
            inAppTemplate,
            variables,
            universityId,
            tenantId
        } = templateData;

        const query = `
            INSERT INTO notification_templates (
                event_type, name, description, email_subject, email_template,
                sms_template, push_title, push_body, in_app_template,
                variables, university_id, tenant_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (event_type) WHERE university_id = $11
            DO UPDATE SET
                name = $2,
                description = $3,
                email_subject = $4,
                email_template = $5,
                sms_template = $6,
                push_title = $7,
                push_body = $8,
                in_app_template = $9,
                variables = $10,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await db.query(query, [
            eventType,
            name,
            description,
            emailSubject,
            emailTemplate,
            smsTemplate,
            pushTitle,
            pushBody,
            inAppTemplate,
            variables ? JSON.stringify(variables) : null,
            universityId,
            tenantId
        ]);

        return result.rows[0];
    }
}

class EventLogRepository extends BaseRepository {
    constructor() {
        super('event_logs');
    }

    /**
     * Get logs for a specific entity
     */
    async getEntityLogs(entityType, entityId, universityId, options = {}) {
        const { limit = 100, offset = 0 } = options;

        const query = `
            SELECT * FROM event_logs
            WHERE entity_type = $1 AND entity_id = $2 AND university_id = $3
            ORDER BY created_at DESC
            LIMIT $4 OFFSET $5
        `;
        const result = await db.query(query, [entityType, entityId, universityId, limit, offset]);
        return result.rows;
    }

    /**
     * Get logs by event type
     */
    async getEventTypeLogs(eventType, universityId, options = {}) {
        const { limit = 100, offset = 0 } = options;

        const query = `
            SELECT * FROM event_logs
            WHERE event_type = $1 AND university_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
        `;
        const result = await db.query(query, [eventType, universityId, limit, offset]);
        return result.rows;
    }
}

module.exports = {
    notificationPreferenceRepository: new NotificationPreferenceRepository(),
    notificationTemplateRepository: new NotificationTemplateRepository(),
    eventLogRepository: new EventLogRepository()
};