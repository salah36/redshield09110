import { getGuildConfig } from '../database/queries.js';
import { createLogEmbed } from './embeds.js';

export async function logAction(client, guildId, action, data) {
    try {
        const guildConfig = await getGuildConfig(guildId);

        if (!guildConfig || !guildConfig.log_channel_id) {
            return; // No log channel configured
        }

        const guild = await client.guilds.fetch(guildId);
        if (!guild) return;

        const logChannel = await guild.channels.fetch(guildConfig.log_channel_id);
        if (!logChannel || !logChannel.isTextBased()) {
            return;
        }

        const embed = createLogEmbed(action, data);
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging action:', error);
    }
}

export function consoleLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (level === 'error') {
        console.error(logMessage, data);
    } else if (level === 'warn') {
        console.warn(logMessage, data);
    } else {
        console.log(logMessage, data);
    }
}
