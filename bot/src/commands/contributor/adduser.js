import { SlashCommandBuilder } from 'discord.js';
import { addBlacklistEntry, getBlacklistByLicense } from '../../database/queries.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embeds.js';
import { PermissionLevel } from '../../utils/permissions.js';
import { logAction } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('adduser')
        .setDescription('Add a user to the blacklist')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Discord user')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason_type')
                .setDescription('Type of violation')
                .setRequired(true)
                .addChoices(
                    { name: 'Cheat', value: 'CHEAT' },
                    { name: 'Glitch', value: 'GLITCH' },
                    { name: 'Duplicate', value: 'DUPLICATE' },
                    { name: 'Other', value: 'OTHER' }
                )
        )
        .addStringOption(option =>
            option
                .setName('server')
                .setDescription('Server where the ban occurred')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('proof')
                .setDescription('Proof URL (screenshot, video, etc.)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('license')
                .setDescription('RedM license (اختياري - optional)')
                .setRequired(false)
        ),

    permissionLevel: PermissionLevel.CONTRIBUTOR,

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reasonType = interaction.options.getString('reason_type');
        const server = interaction.options.getString('server');
        const proof = interaction.options.getString('proof');
        const license = interaction.options.getString('license');

        // Validate proof URL
        try {
            new URL(proof);
        } catch (error) {
            await interaction.reply({
                embeds: [createErrorEmbed('Proof must be a valid URL.')],
                ephemeral: true,
            });
            return;
        }

        // Check if user or license already exists in blacklist
        let existingEntry = null;
        if (license) {
            existingEntry = await getBlacklistByLicense(license);
        }
        if (!existingEntry && user) {
            const { getBlacklistByDiscordId } = await import('../../database/queries.js');
            existingEntry = await getBlacklistByDiscordId(user.id);
        }

        if (existingEntry) {
            await interaction.reply({
                embeds: [createErrorEmbed(
                    `This user or license is already blacklisted. Use \`/update-user\` to modify or \`/revoke-blacklist\` to revoke first.`
                )],
                ephemeral: true,
            });
            return;
        }

        // Add to blacklist
        const entry = {
            discord_user_id: user.id,
            license: license || null,
            reason_type: reasonType,
            reason_text: null,
            proof_url: proof,
            server_name: server,
            other_server: null,
            created_by: interaction.user.id,
        };

        try {
            const newEntry = await addBlacklistEntry(entry);

            const embed = createSuccessEmbed(
                'User Added to Blacklist',
                `Successfully added user to the blacklist.`
            );
            embed.addFields(
                { name: 'Discord User', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Reason Type', value: reasonType, inline: true },
                { name: 'Server', value: server, inline: true }
            );

            if (license) {
                embed.addFields({ name: 'License', value: license, inline: true });
            }

            embed.addFields({ name: 'Proof', value: proof, inline: false });

            await interaction.reply({ embeds: [embed], ephemeral: false });

            // Log to all servers (if they have log channels configured)
            // For now, log to the current server if in a guild
            if (interaction.guildId) {
                await logAction(interaction.client, interaction.guildId, 'User Added to Blacklist', {
                    'Added By': interaction.user.tag,
                    'Discord User': user.tag,
                    'License': license || 'N/A',
                    'Reason Type': reasonType,
                    'Server': server,
                    'Proof': proof,
                });
            }

        } catch (error) {
            console.error('Error adding user to blacklist:', error);
            await interaction.reply({
                embeds: [createErrorEmbed(`Failed to add user to blacklist: ${error.message}`)],
                ephemeral: true,
            });
        }
    },
};
