import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { getGuildConfig, updateGuildConfig } from '../../database/queries.js';
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from '../../utils/embeds.js';
import { PermissionLevel } from '../../utils/permissions.js';
import { logAction } from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure RedShield for this server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('settings')
                .setDescription('Show current configuration')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-log-channel')
                .setDescription('Set the logging channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel for RedShield logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-punish-role')
                .setDescription('Set the punishment role')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Role to assign to blacklisted users')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-punishment')
                .setDescription('Set the punishment type')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of punishment')
                        .setRequired(true)
                        .addChoices(
                            { name: 'None', value: 'NONE' },
                            { name: 'Kick', value: 'KICK' },
                            { name: 'Ban', value: 'BAN' },
                            { name: 'Role', value: 'ROLE' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle-actioning')
                .setDescription('Enable or disable automatic punishment')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable actioning?')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle-global-scan')
                .setDescription('Enable or disable global scanning')
                .addBooleanOption(option =>
                    option
                        .setName('enabled')
                        .setDescription('Enable global scan?')
                        .setRequired(true)
                )
        ),

    permissionLevel: PermissionLevel.SERVER_ADMIN,

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        switch (subcommand) {
            case 'settings':
                await showSettings(interaction, guildId);
                break;
            case 'set-log-channel':
                await setLogChannel(interaction, guildId);
                break;
            case 'set-punish-role':
                await setPunishRole(interaction, guildId);
                break;
            case 'set-punishment':
                await setPunishment(interaction, guildId);
                break;
            case 'toggle-actioning':
                await toggleActioning(interaction, guildId);
                break;
            case 'toggle-global-scan':
                await toggleGlobalScan(interaction, guildId);
                break;
        }
    },
};

async function showSettings(interaction, guildId) {
    const config = await getGuildConfig(guildId);

    const logChannel = config.log_channel_id
        ? `<#${config.log_channel_id}>`
        : 'Not set';
    const punishRole = config.punish_role_id
        ? `<@&${config.punish_role_id}>`
        : 'Not set';

    const settingsText = `**Current Configuration:**

**Log Channel:** ${logChannel}
**Punishment Role:** ${punishRole}
**Punishment Type:** ${config.punishment}
**Actioning Enabled:** ${config.actioning_enabled ? 'Yes' : 'No'}
**Global Scan Enabled:** ${config.global_scan_enabled ? 'Yes' : 'No'}

Last updated: ${new Date(config.updated_at).toLocaleString()}`;

    const embed = createInfoEmbed('Server Configuration', settingsText);
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function setLogChannel(interaction, guildId) {
    const channel = interaction.options.getChannel('channel');

    await updateGuildConfig(guildId, { log_channel_id: channel.id });

    await logAction(interaction.client, guildId, 'Config Updated', {
        'Updated By': interaction.user.tag,
        'Setting': 'Log Channel',
        'New Value': channel.name,
    });

    const embed = createSuccessEmbed(
        'Configuration Updated',
        `Log channel set to <#${channel.id}>`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function setPunishRole(interaction, guildId) {
    const role = interaction.options.getRole('role');

    await updateGuildConfig(guildId, { punish_role_id: role.id });

    await logAction(interaction.client, guildId, 'Config Updated', {
        'Updated By': interaction.user.tag,
        'Setting': 'Punishment Role',
        'New Value': role.name,
    });

    const embed = createSuccessEmbed(
        'Configuration Updated',
        `Punishment role set to <@&${role.id}>`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function setPunishment(interaction, guildId) {
    const type = interaction.options.getString('type');

    await updateGuildConfig(guildId, { punishment: type });

    await logAction(interaction.client, guildId, 'Config Updated', {
        'Updated By': interaction.user.tag,
        'Setting': 'Punishment Type',
        'New Value': type,
    });

    const embed = createSuccessEmbed(
        'Configuration Updated',
        `Punishment type set to **${type}**`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function toggleActioning(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');

    await updateGuildConfig(guildId, { actioning_enabled: enabled });

    await logAction(interaction.client, guildId, 'Config Updated', {
        'Updated By': interaction.user.tag,
        'Setting': 'Actioning',
        'New Value': enabled ? 'Enabled' : 'Disabled',
    });

    const embed = createSuccessEmbed(
        'Configuration Updated',
        `Automatic actioning ${enabled ? 'enabled' : 'disabled'}`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function toggleGlobalScan(interaction, guildId) {
    const enabled = interaction.options.getBoolean('enabled');

    await updateGuildConfig(guildId, { global_scan_enabled: enabled });

    await logAction(interaction.client, guildId, 'Config Updated', {
        'Updated By': interaction.user.tag,
        'Setting': 'Global Scan',
        'New Value': enabled ? 'Enabled' : 'Disabled',
    });

    const embed = createSuccessEmbed(
        'Configuration Updated',
        `Global scanning ${enabled ? 'enabled' : 'disabled'}`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
