import { PermissionFlagsBits } from 'discord.js';
import config from '../config.js';

/**
 * Permission levels:
 * 1. Everyone - any Discord user
 * 2. Server Admin - Manage Guild or Administrator permission
 * 3. Contributor - special role in main Discord server
 * 4. Owner - RedShield system owner (full access to everything)
 */

// Owner Discord ID - Full system access
export const OWNER_ID = '1302824457068613686';

export function isOwner(userId) {
    return userId === OWNER_ID;
}

export async function isServerAdmin(member) {
    if (!member) return false;
    return (
        member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        member.permissions.has(PermissionFlagsBits.Administrator)
    );
}

export async function isContributor(client, userId) {
    // Owner always has contributor access
    if (isOwner(userId)) return true;

    try {
        const mainGuild = await client.guilds.fetch(config.mainGuild.id);
        if (!mainGuild) return false;

        const member = await mainGuild.members.fetch(userId);
        if (!member) return false;

        // Check if user has contributor or partner role
        const contributorRoleId = config.mainGuild.contributorRoleId;
        const partnerRoleId = config.mainGuild.partnerRoleId;

        if (contributorRoleId && member.roles.cache.has(contributorRoleId)) {
            return true;
        }
        if (partnerRoleId && member.roles.cache.has(partnerRoleId)) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking contributor status:', error);
        return false;
    }
}

export const PermissionLevel = {
    EVERYONE: 0,
    SERVER_ADMIN: 1,
    CONTRIBUTOR: 2,
    OWNER: 3,
};

export async function checkPermission(interaction, requiredLevel) {
    const { client, user, member, guildId } = interaction;

    // Owner has access to everything
    if (isOwner(user.id)) {
        return true;
    }

    // EVERYONE level
    if (requiredLevel === PermissionLevel.EVERYONE) {
        return true;
    }

    // CONTRIBUTOR level
    if (requiredLevel === PermissionLevel.CONTRIBUTOR) {
        const hasPermission = await isContributor(client, user.id);
        return hasPermission;
    }

    // SERVER_ADMIN level
    if (requiredLevel === PermissionLevel.SERVER_ADMIN) {
        // First check if they're a contributor (contributors have all permissions)
        const contributorCheck = await isContributor(client, user.id);
        if (contributorCheck) return true;

        // Then check server admin permissions
        if (member) {
            return await isServerAdmin(member);
        }
        return false;
    }

    return false;
}
