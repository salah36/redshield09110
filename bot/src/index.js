import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import config from './config.js';
import pool from './database/db.js';
import { checkPermission } from './utils/permissions.js';
import { createPermissionDeniedEmbed } from './utils/embeds.js';
import { consoleLog } from './utils/logger.js';
import { LogNotifierService } from './services/logNotifier.js';
import { LicenseCheckerService } from './services/licenseChecker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

client.commands = new Collection();

// Load commands from all folders
async function loadCommands() {
    const commandFolders = ['everyone', 'admin', 'contributor'];

    for (const folder of commandFolders) {
        const commandsPath = join(__dirname, 'commands', folder);
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const command = await import(`file://${filePath}`);
            const commandData = command.default;

            if ('data' in commandData && 'execute' in commandData) {
                client.commands.set(commandData.data.name, commandData);
                consoleLog('info', `Loaded command: ${commandData.data.name}`);
            } else {
                consoleLog('warn', `Command at ${filePath} is missing required "data" or "execute" property.`);
            }
        }
    }
}

// Sync guild information to database
async function syncGuildInfo() {
    try {
        // Get list of guilds the bot is actually in
        const currentGuildIds = Array.from(client.guilds.cache.keys());

        // Update or insert current guilds
        for (const [guildId, guild] of client.guilds.cache) {
            await pool.execute(`
                INSERT INTO guild_configs (guild_id, guild_name, member_count)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    guild_name = VALUES(guild_name),
                    member_count = VALUES(member_count)
            `, [guildId, guild.name, guild.memberCount]);
        }

        // Remove guilds from database that the bot is no longer in
        if (currentGuildIds.length > 0) {
            const placeholders = currentGuildIds.map(() => '?').join(',');
            await pool.execute(
                `DELETE FROM guild_configs WHERE guild_id NOT IN (${placeholders})`,
                currentGuildIds
            );
        } else {
            // If bot is in no guilds, remove all
            await pool.execute('DELETE FROM guild_configs');
        }

        consoleLog('info', `Synced ${client.guilds.cache.size} guild(s) and cleaned up stale entries`);
    } catch (error) {
        consoleLog('error', 'Error syncing guild info:', error);
    }
}

// Apply bot presence from database
async function applyBotPresence() {
    try {
        // Check if client is ready
        if (!client.user) {
            consoleLog('warn', 'Cannot update presence: Bot not ready');
            return;
        }

        const [rows] = await pool.execute('SELECT * FROM bot_config WHERE id = 1');

        if (rows.length === 0) {
            consoleLog('warn', 'No bot config found in database');
            return;
        }

        const config = rows[0];
        const { status, activity_type, activity_name } = config;

        // Map database status to Discord.js status
        const statusMap = {
            'online': 'online',
            'idle': 'idle',
            'dnd': 'dnd',
            'invisible': 'invisible'
        };

        // Activity types: 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching, 5 = Competing
        const activities = activity_name ? [{
            name: activity_name,
            type: activity_type || 0
        }] : [];

        const presenceData = {
            status: statusMap[status] || 'online',
            activities: activities
        };

        // Log what we're setting
        consoleLog('debug', 'Setting presence:', presenceData);

        await client.user.setPresence(presenceData);

        consoleLog('info', `Bot presence applied: ${status}${activity_name ? ` - ${activity_name}` : ''}`);
    } catch (error) {
        consoleLog('error', 'Error applying bot presence:', error);
    }
}

// Initialize services
let logNotifier;
let licenseChecker;
let presenceInterval;

// Event: Bot ready
client.once('clientReady', async () => {
    consoleLog('info', `Logged in as ${client.user.tag}!`);
    consoleLog('info', `Bot is ready and serving ${client.guilds.cache.size} guilds`);

    // Sync guild information to database
    await syncGuildInfo();

    // Apply initial bot presence
    await applyBotPresence();

    // Check for presence updates every 10 seconds
    presenceInterval = setInterval(async () => {
        await applyBotPresence();
    }, 10000);

    // Start log notifier service
    logNotifier = new LogNotifierService(client);
    logNotifier.start();

    // Start license checker service
    licenseChecker = new LicenseCheckerService(client);
    licenseChecker.start();
});

// Event: Interaction create (slash commands)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        consoleLog('warn', `No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        // Check permissions
        const hasPermission = await checkPermission(interaction, command.permissionLevel);

        if (!hasPermission) {
            await interaction.reply({
                embeds: [createPermissionDeniedEmbed()],
                ephemeral: true,
            });
            return;
        }

        // Execute command
        await command.execute(interaction);

        consoleLog('info', `${interaction.user.tag} used /${interaction.commandName}`, {
            guild: interaction.guild?.name || 'DM',
        });

    } catch (error) {
        consoleLog('error', `Error executing ${interaction.commandName}:`, error);

        const errorMessage = { content: 'There was an error executing this command.', ephemeral: true };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Event: Guild update (update guild name when changed)
client.on('guildUpdate', async (oldGuild, newGuild) => {
    try {
        if (oldGuild.name !== newGuild.name || oldGuild.memberCount !== newGuild.memberCount) {
            await pool.execute(`
                UPDATE guild_configs
                SET guild_name = ?, member_count = ?
                WHERE guild_id = ?
            `, [newGuild.name, newGuild.memberCount, newGuild.id]);
            consoleLog('info', `Updated guild info for ${newGuild.name}`);
        }
    } catch (error) {
        consoleLog('error', 'Error updating guild info:', error);
    }
});

// Event: Guild member add (auto-check on join)
client.on('guildMemberAdd', async member => {
    try {
        const { getGuildConfig } = await import('./database/queries.js');
        const { getBlacklistByDiscordId } = await import('./database/queries.js');
        const { checkAndPunishUser } = await import('./handlers/scanner.js');
        const { createBlacklistEmbed } = await import('./utils/embeds.js');

        const guildConfig = await getGuildConfig(member.guild.id);

        // Always check if member is blacklisted when they join
        const blacklistEntry = await getBlacklistByDiscordId(member.user.id);

        if (blacklistEntry && blacklistEntry.status === 'ACTIVE') {
            consoleLog('info', `Blacklisted user joined: ${member.user.tag} in ${member.guild.name}`);

            // Apply punishment if actioning is enabled
            await checkAndPunishUser(member.guild, member, blacklistEntry, guildConfig);

            // Log to the server's log channel with proper embed
            if (guildConfig && guildConfig.log_channel_id) {
                const logChannel = await member.guild.channels.fetch(guildConfig.log_channel_id);
                if (logChannel && logChannel.isTextBased()) {
                    const embed = createBlacklistEmbed(blacklistEntry, true, member.user.tag);
                    await logChannel.send({ embeds: [embed] });
                }
            }
        }

    } catch (error) {
        consoleLog('error', 'Error checking new member:', error);
    }
});

// Initialize and start bot
async function start() {
    try {
        // Test database connection
        await pool.execute('SELECT NOW()');
        consoleLog('info', 'Database connection verified');

        // Load commands
        await loadCommands();

        // Login to Discord
        await client.login(config.discord.token);

    } catch (error) {
        consoleLog('error', 'Failed to start bot:', error);
        process.exit(1);
    }
}

start();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    consoleLog('info', 'Shutting down...');
    if (logNotifier) {
        logNotifier.stop();
    }
    if (licenseChecker) {
        licenseChecker.stop();
    }
    if (presenceInterval) {
        clearInterval(presenceInterval);
    }
    await pool.end();
    client.destroy();
    process.exit(0);
});

// Handle Windows Ctrl+C
if (process.platform === 'win32') {
    const readline = await import('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('SIGINT', () => {
        process.emit('SIGINT');
    });
}
