import { SlashCommandBuilder } from 'discord.js';
import { createInfoEmbed } from '../../utils/embeds.js';
import { PermissionLevel } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About RedShield Bot'),

    permissionLevel: PermissionLevel.EVERYONE,

    async execute(interaction) {
        const aboutText = `**RedShield!**

Built by players, for players RedShield helps protect the RedM community by fighting cheating and abuse.

It serves as a shared database of players banned from servers for cheating, glitching, and similar violations, with tools to automatically block those users from joining your Discord server.

**Features:**
- Check user blacklist status
- Scan server members for blacklisted users
- Automated punishment system
- Shared community protection

Use \`/help\` to see all available commands.`;

        const embed = createInfoEmbed('About RedShield', aboutText);
        embed.setThumbnail(interaction.client.user.displayAvatarURL());

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
