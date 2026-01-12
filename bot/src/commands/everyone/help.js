import { SlashCommandBuilder } from 'discord.js';
import { createInfoEmbed } from '../../utils/embeds.js';
import { PermissionLevel, isServerAdmin, isContributor } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),

    permissionLevel: PermissionLevel.EVERYONE,

    async execute(interaction) {
        const isAdmin = interaction.member ? await isServerAdmin(interaction.member) : false;
        const isContrib = await isContributor(interaction.client, interaction.user.id);

        let helpText = `**Everyone Commands:**
\`/about\` - About RedShield Bot
\`/help\` - Show this help message
\`/checkuser\` - Check blacklist status of a user
\`/userinfo\` - Show user information`;

        if (isAdmin || isContrib) {
            helpText += `\n\n**Server Admin Commands:**
\`/check-license\` - Check license status
\`/scan-server\` - Scan server members for blacklisted users
\`/config settings\` - Show current server configuration
\`/config set-log-channel\` - Set logging channel
\`/config set-punish-role\` - Set punishment role
\`/config set-punishment\` - Set punishment type (NONE/KICK/BAN/ROLE)
\`/config toggle-actioning\` - Enable/disable automatic punishment
\`/config toggle-global-scan\` - Enable/disable global scanning`;
        }

        if (isContrib) {
            helpText += `\n\n**Contributor Commands:**
\`/adduser\` - Add user to blacklist
\`/revoke-blacklist\` - Revoke blacklist entry
\`/update-user\` - Update blacklist entry`;
        }

        const embed = createInfoEmbed('RedShield Commands', helpText);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
