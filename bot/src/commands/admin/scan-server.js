import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildConfig } from '../../database/queries.js';
import { scanServerMembers } from '../../handlers/scanner.js';
import { createSuccessEmbed, createErrorEmbed, createWarningEmbed, COLORS } from '../../utils/embeds.js';
import { PermissionLevel } from '../../utils/permissions.js';
import { logAction } from '../../utils/logger.js';

// Cooldown map: guildId -> timestamp
const cooldowns = new Map();
const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

export default {
    data: new SlashCommandBuilder()
        .setName('scan-server')
        .setDescription('Scan all server members for blacklisted users'),

    permissionLevel: PermissionLevel.SERVER_ADMIN,

    async execute(interaction) {
        const guildId = interaction.guildId;

        // Check cooldown
        const now = Date.now();
        const cooldownEnd = cooldowns.get(guildId);
        if (cooldownEnd && now < cooldownEnd) {
            const remaining = Math.ceil((cooldownEnd - now) / 1000 / 60);
            await interaction.reply({
                embeds: [createWarningEmbed(
                    'Cooldown Active',
                    `Please wait ${remaining} minute(s) before scanning again.`
                )],
                ephemeral: true,
            });
            return;
        }

        // Defer reply as this might take a while
        await interaction.deferReply({ ephemeral: true });

        try {
            const guildConfig = await getGuildConfig(guildId);
            const guild = interaction.guild;

            const results = await scanServerMembers(guild, guildConfig);

            // Set cooldown
            cooldowns.set(guildId, now + COOLDOWN_DURATION);

            // Create response embed
            const embed = new EmbedBuilder()
                .setTitle('Server Scan Complete')
                .setColor(results.totalFlagged > 0 ? COLORS.DANGER : COLORS.SUCCESS)
                .addFields(
                    { name: 'Total Members Scanned', value: String(results.totalScanned), inline: true },
                    { name: 'Flagged Users', value: String(results.totalFlagged), inline: true },
                    { name: 'Actioning', value: guildConfig.actioning_enabled ? 'Enabled' : 'Disabled', inline: true }
                )
                .setTimestamp();

            // Add flagged users details
            if (results.flaggedUsers.length > 0) {
                let flaggedList = '';
                for (const user of results.flaggedUsers.slice(0, 10)) { // Limit to 10
                    flaggedList += `**${user.username}** (${user.userId})\n`;
                    flaggedList += `└ Reason: ${user.reasonType} | Server: ${user.server}\n`;
                    flaggedList += `└ Proof: ${user.proof}\n\n`;
                }

                if (results.flaggedUsers.length > 10) {
                    flaggedList += `... and ${results.flaggedUsers.length - 10} more`;
                }

                embed.addFields({ name: 'Flagged Users', value: flaggedList || 'None' });
            }

            // Add action results if actioning was enabled
            if (guildConfig.actioning_enabled && results.actionResults.length > 0) {
                let actionSummary = '';
                const successCount = results.actionResults.filter(r => r.success).length;
                const failCount = results.actionResults.filter(r => !r.success).length;

                actionSummary += `✓ Successful: ${successCount}\n`;
                actionSummary += `✗ Failed: ${failCount}\n`;

                embed.addFields({ name: 'Action Summary', value: actionSummary });
            }

            await interaction.editReply({ embeds: [embed] });

            // Log the scan
            await logAction(interaction.client, guildId, 'Server Scan', {
                'Scanned By': interaction.user.tag,
                'Total Scanned': results.totalScanned,
                'Total Flagged': results.totalFlagged,
                'Actioning': guildConfig.actioning_enabled ? 'Enabled' : 'Disabled',
            });

        } catch (error) {
            console.error('Error during server scan:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed(`An error occurred during the scan: ${error.message}`)],
            });
        }
    },
};
