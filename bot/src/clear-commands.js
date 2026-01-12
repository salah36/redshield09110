import { REST, Routes } from 'discord.js';
import config from './config.js';

const rest = new REST().setToken(config.discord.token);

async function clearCommands() {
    try {
        console.log('Clearing all commands...\n');

        // Clear global commands
        console.log('Clearing global commands...');
        await rest.put(
            Routes.applicationCommands(config.discord.clientId),
            { body: [] }
        );
        console.log('✅ Global commands cleared');

        // Clear guild commands
        console.log('Clearing guild commands...');
        await rest.put(
            Routes.applicationGuildCommands(config.discord.clientId, config.mainGuild.id),
            { body: [] }
        );
        console.log('✅ Guild commands cleared');

        console.log('\n🎉 All commands cleared successfully!');
        console.log('Run deploy-commands.js to redeploy them.');

    } catch (error) {
        console.error('Error clearing commands:', error);
    }
}

clearCommands();
