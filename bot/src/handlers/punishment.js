import { PermissionFlagsBits } from 'discord.js';
import { consoleLog } from '../utils/logger.js';

export async function executePunishment(guild, member, punishment, punishRoleId) {
    const results = {
        success: false,
        action: 'none',
        error: null,
    };

    try {
        const botMember = await guild.members.fetchMe();

        switch (punishment) {
            case 'ROLE':
                if (!punishRoleId) {
                    results.error = 'No punishment role configured';
                    return results;
                }

                const role = await guild.roles.fetch(punishRoleId);
                if (!role) {
                    results.error = 'Punishment role not found';
                    return results;
                }

                if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    results.error = 'Bot lacks Manage Roles permission';
                    return results;
                }

                if (role.position >= botMember.roles.highest.position) {
                    results.error = 'Punishment role is higher than bot role';
                    return results;
                }

                if (member.roles.cache.has(role.id)) {
                    results.action = 'role_already_assigned';
                    results.success = true;
                    return results;
                }

                await member.roles.add(role);
                results.action = 'role_added';
                results.success = true;
                consoleLog('info', `Added punishment role to ${member.user.tag}`);
                break;

            case 'KICK':
                if (!botMember.permissions.has(PermissionFlagsBits.KickMembers)) {
                    results.error = 'Bot lacks Kick Members permission';
                    return results;
                }

                if (!member.kickable) {
                    results.error = 'User cannot be kicked (role hierarchy)';
                    return results;
                }

                await member.kick('Blacklisted user detected by RedShield');
                results.action = 'kicked';
                results.success = true;
                consoleLog('info', `Kicked ${member.user.tag}`);
                break;

            case 'BAN':
                if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
                    results.error = 'Bot lacks Ban Members permission';
                    return results;
                }

                if (!member.bannable) {
                    results.error = 'User cannot be banned (role hierarchy)';
                    return results;
                }

                await member.ban({ reason: 'Blacklisted user detected by RedShield' });
                results.action = 'banned';
                results.success = true;
                consoleLog('info', `Banned ${member.user.tag}`);
                break;

            case 'NONE':
            default:
                results.action = 'none';
                results.success = true;
                break;
        }
    } catch (error) {
        consoleLog('error', 'Error executing punishment:', error);
        results.error = error.message;
    }

    return results;
}
