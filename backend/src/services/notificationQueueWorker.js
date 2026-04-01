/**
 * Notification Queue Worker
 * Processes queued notifications and sends them through various channels
 */

const notificationQueueRepository = require('../repositories/notificationQueueRepository');
const notificationRepository = require('../repositories/notificationRepository');
const { notificationTemplateRepository } = require('../repositories/notificationPreferenceRepository');
const db = require('../config/database');

class NotificationQueueWorker {
    constructor(options = {}) {
        this.isRunning = false;
        this.pollInterval = options.pollInterval || 5000; // Process every 5 seconds
        this.batchSize = options.batchSize || 10;
        this.maxRetries = options.maxRetries || 3;
        this.lockDuration = options.lockDuration || 300; // 5 minutes
    }

    /**
     * Start the worker
     */
    start() {
        if (this.isRunning) {
            console.log('Notification queue worker is already running');
            return;
        }

        console.log('Starting notification queue worker...');
        this.isRunning = true;

        // Start processing loop
        this.processLoop();
    }

    /**
     * Stop the worker
     */
    stop() {
        console.log('Stopping notification queue worker...');
        this.isRunning = false;

        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
    }

    /**
     * Main processing loop
     */
    async processLoop() {
        try {
            while (this.isRunning) {
                try {
                    await this.processBatch();
                } catch (error) {
                    console.error('Error processing notification batch:', error);
                }

                // Wait before next batch
                await new Promise(resolve => {
                    this.pollTimer = setTimeout(resolve, this.pollInterval);
                });
            }
        } catch (error) {
            console.error('Fatal error in notification processing loop:', error);
            this.isRunning = false;
        }
    }

    /**
     * Process a batch of notifications
     */
    async processBatch() {
        try {
            // Get pending notifications
            const queueItems = await notificationQueueRepository.getPendingNotifications(this.batchSize);

            if (queueItems.length === 0) {
                return;
            }

            console.log(`Processing ${queueItems.length} queued notifications`);

            for (const item of queueItems) {
                try {
                    // Lock the item for processing
                    const locked = await notificationQueueRepository.lockNotification(
                        item.id,
                        this.lockDuration
                    );

                    if (!locked) {
                        continue;
                    }

                    // Mark as processing
                    await notificationQueueRepository.markProcessing(item.id);

                    // Process the notification
                    await this.processNotification(item);

                } catch (error) {
                    console.error(`Error processing queue item ${item.id}:`, error);
                }
            }
        } catch (error) {
            console.error('Error in processBatch:', error);
        }
    }

    /**
     * Process a single notification
     */
    async processNotification(queueItem) {
        try {
            const { id: queueId, notification_id: notificationId } = queueItem;

            // Get the full notification
            const notification = await notificationRepository.findById(notificationId);
            if (!notification) {
                await notificationQueueRepository.markFailed(queueId, 'Notification not found');
                return;
            }

            // Get the template
            const template = await notificationTemplateRepository.getByEventType(
                notification.event_type,
                notification.university_id
            );

            // Send through appropriate channels
            const results = await this.sendNotification(notification, template);

            if (results.success) {
                // Mark as completed
                await notificationQueueRepository.markCompleted(queueId);
                await notificationRepository.updateStatus(notificationId, 'sent');
                console.log(`Notification ${notificationId} sent successfully`);
            } else {
                // Mark as failed with retry
                await notificationQueueRepository.markFailed(
                    queueId,
                    results.error || 'Unknown error',
                    300 // Retry after 5 minutes
                );
            }
        } catch (error) {
            console.error('Error processing notification:', error);
            throw error;
        }
    }

    /**
     * Send notification through configured channels
     */
    async sendNotification(notification, template) {
        try {
            const channels = this.determineChannels(notification);
            const results = {
                success: true,
                error: null,
                channels: {}
            };

            for (const channel of channels) {
                try {
                    const result = await this.sendViaChannel(notification, template, channel);
                    results.channels[channel] = result;

                    if (!result.success) {
                        results.success = false;
                        if (!results.error) {
                            results.error = result.error;
                        }
                    }
                } catch (error) {
                    console.error(`Error sending via ${channel}:`, error);
                    results.channels[channel] = {
                        success: false,
                        error: error.message
                    };
                    results.success = false;
                }
            }

            return results;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Determine which channels to use for a notification
     */
    determineChannels(notification) {
        const channels = [];

        // For now, we'll send in-app notifications by default
        // In production, you'd check user preferences and send via configured channels
        channels.push('in-app');

        return channels;
    }

    /**
     * Send notification via specific channel
     */
    async sendViaChannel(notification, template, channel) {
        try {
            switch (channel) {
                case 'email':
                    return await this.sendEmail(notification, template);

                case 'sms':
                    return await this.sendSMS(notification, template);

                case 'push':
                    return await this.sendPush(notification, template);

                case 'in-app':
                    return await this.sendInApp(notification, template);

                default:
                    return {
                        success: false,
                        error: `Unknown channel: ${channel}`
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send email notification
     */
    async sendEmail(notification, template) {
        try {
            // TODO: Implement email sending via email service (SendGrid, Mailgun, etc.)
            console.log(`Sending email notification ${notification.id}`);

            // Placeholder implementation
            return {
                success: true,
                message: 'Email queued for sending'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send SMS notification
     */
    async sendSMS(notification, template) {
        try {
            // TODO: Implement SMS sending via SMS service (Twilio, AWS SNS, etc.)
            console.log(`Sending SMS notification ${notification.id}`);

            // Placeholder implementation
            return {
                success: true,
                message: 'SMS queued for sending'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send push notification
     */
    async sendPush(notification, template) {
        try {
            // TODO: Implement push notification via service (Firebase, OneSignal, etc.)
            console.log(`Sending push notification ${notification.id}`);

            // Placeholder implementation
            return {
                success: true,
                message: 'Push notification queued for sending'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send in-app notification (already stored in DB)
     */
    async sendInApp(notification, template) {
        try {
            // In-app notifications are already in the database
            // Just mark as delivered
            console.log(`In-app notification ${notification.id} ready for retrieval`);

            return {
                success: true,
                message: 'In-app notification created'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get queue statistics
     */
    async getStats() {
        const stats = await notificationQueueRepository.getQueueStats();
        return {
            isRunning: this.isRunning,
            stats: stats
        };
    }
}

module.exports = NotificationQueueWorker;