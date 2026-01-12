import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getBlacklistByDiscordId } from '../../database/queries.js';
import { createErrorEmbed, COLORS } from '../../utils/embeds.js';
import { PermissionLevel } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Show user information')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('User to get info about')
                .setRequired(true)
        ),

    permissionLevel: PermissionLevel.EVERYONE,

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const member = interaction.guild?.members.cache.get(user.id);

        const embed = new EmbedBuilder()
            .setTitle('User Information')
            .setColor(COLORS.INFO)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'Username', value: user.tag, inline: true },
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                {
                    name: 'Account Created',
                    value: user.createdAt.toLocaleDateString(),
                    inline: true,
                }
            );

        if (member) {
            embed.addFields({
                name: 'Joined Server',
                value: member.joinedAt?.toLocaleDateString() || 'Unknown',
                inline: true,
            });

            // Check if user has punishment role
            const guildConfig = await interaction.client.guildConfigs?.get(interaction.guildId);
            if (guildConfig?.punish_role_id) {
                const hasPunishRole = member.roles.cache.has(guildConfig.punish_role_id);
                embed.addFields({
                    name: 'Punishment Role',
                    value: hasPunishRole ? 'Yes' : 'No',
                    inline: true,
                });
            }
        }

        // Check blacklist status
        const blacklistEntry = await getBlacklistByDiscordId(user.id);
        const isBlacklisted = !!blacklistEntry;

        embed.addFields({
            name: 'Blacklist Status',
            value: isBlacklisted ? '**BLACKLISTED**' : 'Clean',
            inline: true,
        });

        if (isBlacklisted) {
            embed.setColor(COLORS.DANGER);
            embed.addFields(
                { name: 'Reason Type', value: blacklistEntry.reason_type, inline: true },
                { name: 'Server', value: blacklistEntry.server_name, inline: true }
            );
        }

        embed.setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
