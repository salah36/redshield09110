import { SlashCommandBuilder } from 'discord.js';
import { revokeBlacklistEntry, getBlacklistByLicense } from '../../database/queries.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds.js';
import { PermissionLevel } from '../../utils/permissions.js';
import { logAction } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('revoke-blacklist')
        .setDescription('Revoke a blacklist entry')
        .addStringOption(option =>
            option
                .setName('license')
                .setDescription('License to revoke')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason for revocation')
                .setRequired(true)
        ),

    permissionLevel: PermissionLevel.CONTRIBUTOR,

    async execute(interaction) {
        const license = interaction.options.getString('license');
        const reason = interaction.options.getString('reason');

        // Check if entry exists
        const existingEntry = await getBlacklistByLicense(license);
        if (!existingEntry) {
            await interaction.reply({
                embeds: [createErrorEmbed('No active blacklist entry found for this license.')],
                ephemeral: true,
            });
            return;
        }

        try {
            const revokedEntry = await revokeBlacklistEntry(license, interaction.user.id, reason);

            const embed = createSuccessEmbed(
                'Blacklist Entry Revoked',
                `Successfully revoked blacklist entry for license: **${license}**`
            );
            embed.addFields(
                { name: 'Revoked By', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'Original Reason Type', value: existingEntry.reason_type, inline: true },
                { name: 'Original Server', value: existingEntry.server_name, inline: true }
            );

            await interaction.reply({ embeds: [embed], ephemeral: false });

            // Log to current server if in a guild
            if (interaction.guildId) {
                await logAction(interaction.client, interaction.guildId, 'Blacklist Entry Revoked', {
                    'Revoked By': interaction.user.tag,
                    'License': license,
                    'Revoke Reason': reason,
                    'Original Reason': existingEntry.reason_type,
                });
            }

        } catch (error) {
            console.error('Error revoking blacklist entry:', error);
            await interaction.reply({
                embeds: [createErrorEmbed(`Failed to revoke entry: ${error.message}`)],
                ephemeral: true,
            });
        }
    },
};
