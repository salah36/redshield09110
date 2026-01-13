import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (two levels up from server/src/)
dotenv.config({ path: join(__dirname, '../../..', '.env') });

export const config = {
  port: parseInt(process.env.DASHBOARD_PORT) || 8081,
  baseUrl: process.env.DASHBOARD_BASE_URL || 'http://localhost:8081',
  frontendUrl: process.env.DASHBOARD_FRONTEND_URL || 'http://localhost:8080',

  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: `${process.env.DASHBOARD_BASE_URL || 'http://localhost:8081'}/auth/discord/callback`,
    botToken: process.env.DISCORD_BOT_TOKEN,
  },

  mainGuild: {
    id: process.env.MAIN_GUILD_ID,
    contributorRoleId: process.env.CONTRIBUTOR_ROLE_ID,
    partnerRoleId: process.env.PARTNER_ROLE_ID,
  },

  database: {
    url: process.env.DATABASE_URL || 'mysql://root@localhost:3306/redshield',
  },

  session: {
    secret: process.env.SESSION_SECRET || 'redshield-secret-key-change-in-production',
  },
};
