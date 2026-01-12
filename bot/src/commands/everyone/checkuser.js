import { SlashCommandBuilder } from 'discord.js';
import { getBlacklistByDiscordId, getBlacklistByLicense } from '../../database/queries.js';
import { createBlacklistEmbed, createErrorEmbed } from '../../utils/embeds.js';
import { PermissionLevel } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('checkuser')
        .setDescription('Check blacklist status of a user')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Discord user to check')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('license')
                .setDescription('RedM license to check')
                .setRequired(false)
        ),

    permissionLevel: PermissionLevel.EVERYONE,

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const license = interaction.options.getString('license');

        if (!user && !license) {
            await interaction.reply({
                embeds: [createErrorEmbed('Please provide either a user or a license to check.')],
                ephemeral: true,
            });
            return;
        }

        let blacklistEntry = null;

        if (license) {
            blacklistEntry = await getBlacklistByLicense(license);
        } else if (user) {
            blacklistEntry = await getBlacklistByDiscordId(user.id);
        }

        const isBlacklisted = !!blacklistEntry;
        const username = user ? user.tag : null;
        const embed = createBlacklistEmbed(blacklistEntry, isBlacklisted, username);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
