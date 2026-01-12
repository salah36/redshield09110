import { SlashCommandBuilder } from 'discord.js';
import { updateBlacklistEntry, getBlacklistByLicense } from '../../database/queries.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds.js';
import { PermissionLevel } from '../../utils/permissions.js';
import { logAction } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('update-user')
        .setDescription('Update a blacklist entry')
        .addStringOption(option =>
            option
                .setName('license')
                .setDescription('License to update')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason_type')
                .setDescription('New reason type')
                .setRequired(false)
                .addChoices(
                    { name: 'Cheat', value: 'CHEAT' },
                    { name: 'Glitch', value: 'GLITCH' },
                    { name: 'Duplicate', value: 'DUPLICATE' },
                    { name: 'Other', value: 'OTHER' }
                )
        )
        .addStringOption(option =>
            option
                .setName('reason_text')
                .setDescription('New reason text')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('proof')
                .setDescription('New proof URL')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('server')
                .setDescription('New server name')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('other_server')
                .setDescription('New other server info')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('status')
                .setDescription('Change status (e.g., reactivate a revoked entry)')
                .setRequired(false)
                .addChoices(
                    { name: 'Active', value: 'ACTIVE' },
                    { name: 'Revoked', value: 'REVOKED' }
                )
        ),

    permissionLevel: PermissionLevel.CONTRIBUTOR,

    async execute(interaction) {
        const license = interaction.options.getString('license');

        // Check if entry exists
        const existingEntry = await getBlacklistByLicense(license);
        if (!existingEntry) {
            await interaction.reply({
                embeds: [createErrorEmbed('No blacklist entry found for this license. Use `/adduser` to create one.')],
                ephemeral: true,
            });
            return;
        }

        // Collect updates
        const updates = {};
        const reasonType = interaction.options.getString('reason_type');
        const reasonText = interaction.options.getString('reason_text');
        const proof = interaction.options.getString('proof');
        const server = interaction.options.getString('server');
        const otherServer = interaction.options.getString('other_server');
        const status = interaction.options.getString('status');

        if (reasonType) updates.reason_type = reasonType;
        if (reasonText) updates.reason_text = reasonText;
        if (proof) {
            // Validate URL
            try {
                new URL(proof);
                updates.proof_url = proof;
            } catch (error) {
                await interaction.reply({
                    embeds: [createErrorEmbed('Proof must be a valid URL.')],
                    ephemeral: true,
                });
                return;
            }
        }
        if (server) updates.server_name = server;
        if (otherServer) updates.other_server = otherServer;
        if (status) updates.status = status;

        if (Object.keys(updates).length === 0) {
            await interaction.reply({
                embeds: [createErrorEmbed('No updates provided. Please specify at least one field to update.')],
                ephemeral: true,
            });
            return;
        }

        try {
            const updatedEntry = await updateBlacklistEntry(license, updates);

            const embed = createSuccessEmbed(
                'Blacklist Entry Updated',
                `Successfully updated blacklist entry for license: **${license}**`
            );

            // Show what was updated
            const updatedFields = [];
            if (reasonType) updatedFields.push(`Reason Type: ${reasonType}`);
            if (reasonText) updatedFields.push(`Reason Text: ${reasonText}`);
            if (proof) updatedFields.push(`Proof: ${proof}`);
            if (server) updatedFields.push(`Server: ${server}`);
            if (otherServer) updatedFields.push(`Other Server: ${otherServer}`);
            if (status) updatedFields.push(`Status: ${status}`);

            embed.addFields({ name: 'Updated Fields', value: updatedFields.join('\n'), inline: false });

            await interaction.reply({ embeds: [embed], ephemeral: false });

            // Log to current server if in a guild
            if (interaction.guildId) {
                await logAction(interaction.client, interaction.guildId, 'Blacklist Entry Updated', {
                    'Updated By': interaction.user.tag,
                    'License': license,
                    'Updates': updatedFields.join(', '),
                });
            }

        } catch (error) {
            console.error('Error updating blacklist entry:', error);
            await interaction.reply({
                embeds: [createErrorEmbed(`Failed to update entry: ${error.message}`)],
                ephemeral: true,
            });
        }
    },
};
