import pool from '../database/db.js';
import { createBlacklistEmbed } from '../utils/embeds.js';
import { consoleLog } from '../utils/logger.js';

/**
 * Service to check for new blacklist entries and send log embeds to Discord
 */
export class LogNotifierService {
    constructor(client) {
        this.client = client;
        this.checkInterval = 10000; // Check every 10 seconds
        this.intervalId = null;
    }

    /**
     * Start the log notifier service
     */
    start() {
        if (this.intervalId) {
            consoleLog('warn', 'LogNotifier is already running');
            return;
        }

        consoleLog('info', 'LogNotifier service started');
        this.intervalId = setInterval(() => this.checkAndSendLogs(), this.checkInterval);

        // Run immediately on start
        this.checkAndSendLogs();
    }

    /**
     * Stop the log notifier service
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            consoleLog('info', 'LogNotifier service stopped');
        }
    }

    /**
     * Check for unsent logs and send them to appropriate Discord channels
     */
    async checkAndSendLogs() {
        try {
            // Get all blacklist entries where log_sent = false
            // Try to match by guild_name first, then by contributor's linked server
            const [entries] = await pool.execute(`
                SELECT DISTINCT
                    be.*,
                    COALESCE(gc1.guild_id, gc2.guild_id) as guild_id,
                    COALESCE(gc1.log_channel_id, gc2.log_channel_id) as log_channel_id,
                    COALESCE(gc1.guild_name, gc2.guild_name) as matched_guild_name
                FROM blacklist_entries be
                LEFT JOIN guild_configs gc1 ON be.server_name = gc1.guild_name
                LEFT JOIN dashboard_users du ON be.created_by = du.discord_user_id
                LEFT JOIN guild_configs gc2 ON du.linked_server_id = gc2.guild_id
                WHERE be.log_sent = FALSE
                AND (gc1.log_channel_id IS NOT NULL OR gc2.log_channel_id IS NOT NULL)
                ORDER BY be.created_at ASC
                LIMIT 10
            `);

            if (entries.length === 0) {
                return; // No logs to send
            }

            consoleLog('info', `Found ${entries.length} blacklist entries to log`);

            for (const entry of entries) {
                await this.sendLogToGuild(entry);
            }
        } catch (error) {
            consoleLog('error', 'Error checking for logs:', error);
        }
    }

    /**
     * Send a log embed to a specific guild's log channel
     */
    async sendLogToGuild(entry) {
        try {
            const { guild_id, log_channel_id, id, matched_guild_name } = entry;

            if (!guild_id || !log_channel_id) {
                consoleLog('warn', `No guild/channel found for entry ${id}, marking as sent`);
                await this.markLogAsSent(id);
                return;
            }

            // Fetch the guild
            const guild = await this.client.guilds.fetch(guild_id).catch(() => null);
            if (!guild) {
                consoleLog('warn', `Guild ${guild_id} not found, marking log as sent anyway`);
                await this.markLogAsSent(id);
                return;
            }

            // Fetch the log channel
            const logChannel = await guild.channels.fetch(log_channel_id).catch(() => null);
            if (!logChannel || !logChannel.isTextBased()) {
                consoleLog('warn', `Log channel ${log_channel_id} not found in guild ${guild.name}, marking log as sent anyway`);
                await this.markLogAsSent(id);
                return;
            }

            // Get username if discord_user_id is available
            let username = 'Unknown';
            if (entry.discord_user_id) {
                try {
                    const user = await this.client.users.fetch(entry.discord_user_id).catch(() => null);
                    if (user) {
                        username = user.tag;
                    }
                } catch (error) {
                    consoleLog('warn', `Could not fetch user ${entry.discord_user_id}`);
                }
            }

            // Create and send the embed
            const embed = createBlacklistEmbed(entry, true, username);
            await logChannel.send({ embeds: [embed] });

            // Mark as sent
            await this.markLogAsSent(id);

            const matchInfo = matched_guild_name !== entry.server_name
                ? ` (matched via contributor link, original: ${entry.server_name})`
                : '';
            consoleLog('info', `Sent blacklist log for ${entry.license} to ${guild.name}${matchInfo}`);
        } catch (error) {
            consoleLog('error', `Error sending log for entry ${entry.id}:`, error);
            // Mark as sent anyway to avoid infinite retries
            await this.markLogAsSent(entry.id);
        }
    }

    /**
     * Mark a blacklist entry as logged
     */
    async markLogAsSent(entryId) {
        try {
            await pool.execute(
                'UPDATE blacklist_entries SET log_sent = TRUE WHERE id = ?',
                [entryId]
            );
        } catch (error) {
            consoleLog('error', `Error marking log as sent for entry ${entryId}:`, error);
        }
    }
}

export default LogNotifierService;
