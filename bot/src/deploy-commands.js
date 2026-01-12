import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// Load all commands
async function loadCommands() {
    const commandFolders = ['everyone', 'admin', 'contributor'];

    for (const folder of commandFolders) {
        const commandsPath = join(__dirname, 'commands', folder);
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const command = await import(`file://${filePath}`);
            const commandData = command.default;

            if ('data' in commandData) {
                commands.push(commandData.data.toJSON());
                console.log(`Loaded command: ${commandData.data.name}`);
            }
        }
    }
}

// Deploy commands
async function deployCommands() {
    await loadCommands();

    const rest = new REST().setToken(config.discord.token);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Deploy globally only
        const data = await rest.put(
            Routes.applicationCommands(config.discord.clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
        console.log('\nNote: Global commands may take up to 1 hour to update on all servers.');
        console.log('Commands will be available immediately in DMs and new servers.');

    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

deployCommands();
