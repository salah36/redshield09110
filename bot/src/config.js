import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (RedShield/.env)
dotenv.config({ path: join(__dirname, '../..', '.env') });

export const config = {
    discord: {
        token: process.env.DISCORD_BOT_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
    },
    mainGuild: {
        id: process.env.MAIN_GUILD_ID || '1457583613309620389',
        contributorRoleId: process.env.CONTRIBUTOR_ROLE_ID,
        partnerRoleId: process.env.PARTNER_ROLE_ID,
    },
    database: {
        url: process.env.DATABASE_URL || 'mysql://root@localhost:3306/redshield',
    },
    env: process.env.NODE_ENV || 'development',
};

export default config;
