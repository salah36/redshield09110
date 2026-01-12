import { getBlacklistByDiscordId } from '../database/queries.js';
import { executePunishment } from './punishment.js';

export async function scanServerMembers(guild, guildConfig) {
    const results = {
        totalScanned: 0,
        totalFlagged: 0,
        flaggedUsers: [],
        actionResults: [],
    };

    try {
        // Fetch all members
        const members = await guild.members.fetch();
        results.totalScanned = members.size;

        // Check each member
        for (const [memberId, member] of members) {
            // Skip bots
            if (member.user.bot) continue;

            // Check if blacklisted
            const blacklistEntry = await getBlacklistByDiscordId(member.user.id);

            if (blacklistEntry) {
                results.totalFlagged++;
                results.flaggedUsers.push({
                    userId: member.user.id,
                    username: member.user.tag,
                    license: blacklistEntry.license,
                    reasonType: blacklistEntry.reason_type,
                    server: blacklistEntry.server_name,
                    proof: blacklistEntry.proof_url,
                    reasonText: blacklistEntry.reason_text,
                });

                // Apply punishment if actioning enabled
                if (guildConfig.actioning_enabled) {
                    const punishmentResult = await executePunishment(
                        guild,
                        member,
                        guildConfig.punishment,
                        guildConfig.punish_role_id
                    );

                    results.actionResults.push({
                        userId: member.user.id,
                        username: member.user.tag,
                        ...punishmentResult,
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error scanning server members:', error);
        throw error;
    }

    return results;
}

export async function checkAndPunishUser(guild, member, blacklistEntry, guildConfig) {
    const result = {
        blacklisted: true,
        entry: blacklistEntry,
        punishment: null,
    };

    if (guildConfig.actioning_enabled) {
        result.punishment = await executePunishment(
            guild,
            member,
            guildConfig.punishment,
            guildConfig.punish_role_id
        );
    }

    return result;
}
