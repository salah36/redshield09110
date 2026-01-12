import { EmbedBuilder } from 'discord.js';

const COLORS = {
    PRIMARY: 0x5865F2,
    SUCCESS: 0x57F287,
    WARNING: 0xFEE75C,
    DANGER: 0xED4245,
    INFO: 0x5865F2,
    DARK: 0x2B2D31,
};

export function createEmbed(title, description, color = COLORS.DARK) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: 'RedShield Anti-Cheat System' });
}

export function createErrorEmbed(message) {
    return createEmbed('Error', message, COLORS.DANGER);
}

export function createSuccessEmbed(title, message) {
    return createEmbed(title, message, COLORS.SUCCESS);
}

export function createWarningEmbed(title, message) {
    return createEmbed(title, message, COLORS.WARNING);
}

export function createInfoEmbed(title, message) {
    return createEmbed(title, message, COLORS.INFO);
}

export function createPermissionDeniedEmbed() {
    return createErrorEmbed("You don't have permission to use this command.");
}

export function createBlacklistEmbed(entry, isBlacklisted = true, username = null) {
    const embed = new EmbedBuilder()
        .setColor(isBlacklisted ? COLORS.DANGER : COLORS.SUCCESS)
        .setTimestamp()
        .setFooter({ text: 'RedShield Anti-Cheat System' });

    if (isBlacklisted && entry) {
        embed.setTitle('🔴 User Blacklisted');

        // User Information header
        embed.addFields({
            name: '**User information**',
            value: '\u200B',
            inline: false
        });

        // Row 1: User id | Username | Status
        embed.addFields(
            {
                name: 'User id',
                value: entry.discord_user_id || 'N/A',
                inline: true
            },
            {
                name: 'Username',
                value: username || 'Unknown',
                inline: true
            },
            {
                name: 'Status',
                value: 'blacklisted',
                inline: true
            }
        );

        // Row 2: User type | Servers where banned | Bans
        embed.addFields(
            {
                name: 'User type',
                value: entry.reason_type || 'Unknown',
                inline: true
            },
            {
                name: 'Servers where banned',
                value: entry.server_name || 'Unknown',
                inline: true
            },
            {
                name: 'Bans',
                value: '1',
                inline: true
            }
        );

        // Added date
        embed.addFields({
            name: 'Added date',
            value: new Date(entry.created_at).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }),
            inline: false
        });

        // Proof section
        if (entry.proof_url) {
            // Check if the proof URL is an image
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
            const isImage = imageExtensions.some(ext => entry.proof_url.toLowerCase().includes(ext));

            if (isImage) {
                // Add proof link
                embed.addFields({
                    name: 'Proof',
                    value: `[🔗 image](${entry.proof_url})`,
                    inline: false
                });
                // Set the image
                embed.setImage(entry.proof_url);
            } else {
                embed.addFields({
                    name: 'Proof',
                    value: `[🔗 View Proof](${entry.proof_url})`,
                    inline: false
                });
            }
        }
    } else {
        embed.setTitle('✅ User Clean');
        embed.setDescription('This user is not in the blacklist database.');
    }

    return embed;
}

export function createLogEmbed(action, data) {
    const embed = new EmbedBuilder()
        .setTitle(`RedShield Action: ${action}`)
        .setColor(COLORS.INFO)
        .setTimestamp();

    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            embed.addFields({
                name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                value: String(value),
                inline: true,
            });
        }
    });

    return embed;
}

export { COLORS };
