import pool from '../database/db.js';
import { consoleLog } from '../utils/logger.js';
import { EmbedBuilder } from 'discord.js';
import config from '../config.js';

/**
 * Service to check for expiring/expired licenses and send DM notifications
 */
export class LicenseCheckerService {
    constructor(client) {
        this.client = client;
        this.checkInterval = 60 * 60 * 1000; // Check every hour
        this.intervalId = null;
        this.warningDays = 3; // Days before expiration to send warning
    }

    /**
     * Start the license checker service
     */
    start() {
        if (this.intervalId) {
            consoleLog('warn', 'LicenseChecker is already running');
            return;
        }

        consoleLog('info', 'LicenseChecker service started');
        this.intervalId = setInterval(() => this.checkLicenses(), this.checkInterval);

        // Run immediately on start
        this.checkLicenses();
    }

    /**
     * Stop the license checker service
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            consoleLog('info', 'LicenseChecker service stopped');
        }
    }

    /**
     * Check all licenses for expiration
     */
    async checkLicenses() {
        try {
            await this.checkExpiringLicenses();
            await this.checkExpiredLicenses();
        } catch (error) {
            consoleLog('error', 'Error in license checker:', error);
        }
    }

    /**
     * Check for licenses expiring soon and send warning DMs
     */
    async checkExpiringLicenses() {
        try {
            // Get licenses expiring in the next 3 days that haven't been warned
            const [expiringLicenses] = await pool.execute(`
                SELECT lk.*, du.username, du.discord_user_id
                FROM license_keys lk
                JOIN dashboard_users du ON lk.claimed_by = du.discord_user_id
                WHERE lk.status = 'CLAIMED'
                AND lk.expires_at <= DATE_ADD(NOW(), INTERVAL ? DAY)
                AND lk.expires_at > NOW()
                AND (lk.warning_sent IS NULL OR lk.warning_sent = FALSE)
            `, [this.warningDays]);

            if (expiringLicenses.length === 0) {
                return;
            }

            consoleLog('info', `Found ${expiringLicenses.length} licenses expiring soon`);

            for (const license of expiringLicenses) {
                await this.sendExpirationWarning(license);
            }
        } catch (error) {
            consoleLog('error', 'Error checking expiring licenses:', error);
        }
    }

    /**
     * Check for expired licenses and handle them
     */
    async checkExpiredLicenses() {
        try {
            // Get licenses that have expired but still marked as CLAIMED
            const [expiredLicenses] = await pool.execute(`
                SELECT lk.*, du.username, du.discord_user_id
                FROM license_keys lk
                JOIN dashboard_users du ON lk.claimed_by = du.discord_user_id
                WHERE lk.status = 'CLAIMED'
                AND lk.expires_at <= NOW()
            `);

            if (expiredLicenses.length === 0) {
                return;
            }

            consoleLog('info', `Found ${expiredLicenses.length} expired licenses to process`);

            for (const license of expiredLicenses) {
                await this.handleExpiredLicense(license);
            }
        } catch (error) {
            consoleLog('error', 'Error checking expired licenses:', error);
        }
    }

    /**
     * Send expiration warning DM to user
     */
    async sendExpirationWarning(license) {
        try {
            const user = await this.client.users.fetch(license.discord_user_id).catch(() => null);

            if (!user) {
                consoleLog('warn', `Could not find user ${license.discord_user_id} for expiration warning`);
                await this.markWarningAsSent(license.id);
                return;
            }

            const expiresAt = new Date(license.expires_at);
            const now = new Date();
            const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

            const embed = new EmbedBuilder()
                .setColor(0xFFA500) // Orange for warning
                .setTitle('License Expiring Soon')
                .setDescription(`Your RedShield contributor license is expiring soon!`)
                .addFields(
                    { name: 'License Key', value: `\`${license.license_key}\``, inline: true },
                    { name: 'Days Remaining', value: `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`, inline: true },
                    { name: 'Expires On', value: expiresAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }), inline: false }
                )
                .setFooter({ text: 'Please contact an administrator for a new license key' })
                .setTimestamp();

            await user.send({ embeds: [embed] }).catch(err => {
                consoleLog('warn', `Could not send DM to ${user.tag}: ${err.message}`);
            });

            await this.markWarningAsSent(license.id);
            consoleLog('info', `Sent expiration warning to ${user.tag} for license ${license.license_key}`);
        } catch (error) {
            consoleLog('error', `Error sending expiration warning for license ${license.id}:`, error);
        }
    }

    /**
     * Handle an expired license
     */
    async handleExpiredLicense(license) {
        try {
            // Update license status to EXPIRED
            await pool.execute(
                `UPDATE license_keys SET status = 'EXPIRED' WHERE id = ?`,
                [license.id]
            );

            // Update dashboard_users to remove contributor role
            await pool.execute(
                `UPDATE dashboard_users SET role = 'SERVER_ADMIN', is_active = FALSE
                 WHERE discord_user_id = ? AND role = 'CONTRIBUTOR'`,
                [license.discord_user_id]
            );

            // Remove Discord CONTRIBUTOR role
            try {
                const guildId = config.mainGuild.id;
                const roleId = config.mainGuild.contributorRoleId;

                if (guildId && roleId) {
                    const guild = await this.client.guilds.fetch(guildId).catch(() => null);
                    if (guild) {
                        const member = await guild.members.fetch(license.discord_user_id).catch(() => null);
                        if (member && member.roles.cache.has(roleId)) {
                            await member.roles.remove(roleId);
                            consoleLog('info', `Removed CONTRIBUTOR role from ${member.user.tag}`);
                        }
                    }
                }
            } catch (roleError) {
                consoleLog('warn', `Could not remove Discord role: ${roleError.message}`);
            }

            // Send expiration notification DM
            const user = await this.client.users.fetch(license.discord_user_id).catch(() => null);

            if (user) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000) // Red for expired
                    .setTitle('License Expired')
                    .setDescription(`Your RedShield contributor license has expired.`)
                    .addFields(
                        { name: 'License Key', value: `\`${license.license_key}\``, inline: true },
                        { name: 'Expired On', value: new Date(license.expires_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }), inline: true },
                        { name: 'What This Means', value:
                            '- Your **Contributor** role has been removed\n' +
                            '- You no longer have access to the dashboard\n' +
                            '- You cannot manage servers or blacklist entries', inline: false }
                    )
                    .setFooter({ text: 'Claim a new license key to regain access' })
                    .setTimestamp();

                await user.send({ embeds: [embed] }).catch(err => {
                    consoleLog('warn', `Could not send expiration DM to ${user.tag}: ${err.message}`);
                });

                consoleLog('info', `Processed expired license for ${user.tag}: ${license.license_key}`);
            } else {
                consoleLog('info', `Processed expired license ${license.license_key} (could not DM user)`);
            }
        } catch (error) {
            consoleLog('error', `Error handling expired license ${license.id}:`, error);
        }
    }

    /**
     * Mark a license warning as sent
     */
    async markWarningAsSent(licenseId) {
        try {
            await pool.execute(
                'UPDATE license_keys SET warning_sent = TRUE WHERE id = ?',
                [licenseId]
            );
        } catch (error) {
            consoleLog('error', `Error marking warning as sent for license ${licenseId}:`, error);
        }
    }
}

export default LicenseCheckerService;
