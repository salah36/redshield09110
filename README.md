# RedShield

**RedShield** - Protecting the Moroccan RedM community by fighting cheating and abuse.

Built by players, for players, RedShield serves as a shared database of players banned from Moroccan servers for cheating, glitching, and similar violations, with tools to automatically block those users from joining your Discord server.

## Features

- **Blacklist Database**: Shared community database of banned players
- **Discord Bot**: Slash commands for checking and managing blacklist entries
- **Automatic Scanning**: Auto-detect blacklisted users joining your server
- **Punishment System**: Configurable actions (kick, ban, role assignment)
- **Web Dashboard**: Manage blacklist entries through a web interface
- **Permission System**: Three-tier access control (Everyone, Server Admin, Contributor)
- **Discord OAuth**: Secure authentication for the web dashboard

## Project Structure

```
RedShield/
├── bot/                      # Discord bot
│   ├── src/
│   │   ├── commands/         # Slash commands
│   │   ├── handlers/         # Punishment & scanning logic
│   │   ├── database/         # Database queries
│   │   └── utils/            # Utilities
│   └── package.json
├── web/                      # Web dashboard
│   ├── backend/              # Express API server
│   └── frontend/             # React frontend
├── database/                 # Database schema
│   └── init.sql
├── docker-compose.yml        # Docker setup
└── README.md
```

## Prerequisites

- Node.js 20+ (if running without Docker)
- PostgreSQL 16+ (or use Docker)
- Discord Bot Token
- Discord Application (for OAuth)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   cd RedShield
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in:
   - `DISCORD_BOT_TOKEN`: Your Discord bot token
   - `DISCORD_CLIENT_ID`: Your Discord application client ID
   - `DISCORD_CLIENT_SECRET`: Your Discord application client secret
   - `CONTRIBUTOR_ROLE_ID`: Role ID for contributors in main guild
   - `PARTNER_ROLE_ID`: Role ID for partners in main guild
   - `SESSION_SECRET`: Random secret for web sessions
   - `DB_PASSWORD`: PostgreSQL password

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database**
   The database will be initialized automatically from `database/init.sql`

5. **Deploy slash commands**
   ```bash
   cd bot
   npm install
   npm run deploy
   ```

6. **Access the dashboard**
   Open `http://localhost:3000` in your browser

## Manual Setup (Without Docker)

### 1. Database Setup

```bash
# Install PostgreSQL
# Create database
createdb redshield

# Run initialization script
psql -d redshield -f database/init.sql
```

### 2. Bot Setup

```bash
cd bot
npm install

# Configure .env file
cp ../.env.example ../.env
# Edit .env with your configuration

# Deploy commands
npm run deploy

# Start bot
npm start
```

### 3. Web Dashboard Setup

**Backend:**
```bash
cd web/backend
npm install
npm start
```

**Frontend:**
```bash
cd web/frontend
npm install
npm run dev
```

## Discord Bot Commands

### Everyone Commands
- `/about` - About RedShield Bot
- `/help` - Show all available commands
- `/checkuser [user|license]` - Check blacklist status
- `/userinfo <user>` - Show user information

### Server Admin Commands
- `/config settings` - Show current server configuration
- `/config set-log-channel <channel>` - Set logging channel
- `/config set-punish-role <role>` - Set punishment role
- `/config set-punishment <type>` - Set punishment type (NONE/KICK/BAN/ROLE)
- `/config toggle-actioning <enabled>` - Enable/disable automatic punishment
- `/config toggle-global-scan <enabled>` - Enable/disable global scanning
- `/scan-server` - Scan all server members for blacklisted users
- `/check-license <license>` - Check RedM license status

### Contributor Commands
- `/adduser` - Add user to blacklist
  - `license` (required): RedM license
  - `reason_type` (required): CHEAT, GLITCH, DUPLICATE, OTHER
  - `server` (required): Server name where ban occurred
  - `proof` (required): Proof URL
  - `user` (optional): Discord user
  - `reason_text` (optional): Additional details
  - `other_server` (optional): Other server info

- `/revoke-blacklist <license> <reason>` - Revoke a blacklist entry
- `/update-user <license>` - Update blacklist entry fields

## Permission System

RedShield uses a three-tier permission system:

### 1. Everyone
Any Discord user can use basic commands like `/checkuser`, `/help`, `/about`, `/userinfo`.

### 2. Server Admin
Users with **Manage Guild** or **Administrator** permission in a server can:
- Configure RedShield settings for their server
- Scan their server for blacklisted users
- Check license status

### 3. Contributors
Users with the Contributor or Partner role in the **Main Guild** (ID: `1457583613309620389`) can:
- Add new blacklist entries
- Revoke blacklist entries
- Update existing entries
- Access the web dashboard

**Important**: To become a contributor, you must:
1. Join the main RedShield Discord server
2. Have the configured Contributor or Partner role

## Configuration

### Guild Configuration

Each Discord server has its own configuration:

- **Log Channel**: Where RedShield logs actions
- **Punishment Role**: Role to assign to blacklisted users
- **Punishment Type**:
  - `NONE`: No action (log only)
  - `KICK`: Kick blacklisted users
  - `BAN`: Ban blacklisted users
  - `ROLE`: Assign punishment role
- **Actioning Enabled**: Enable/disable automatic punishment
- **Global Scan Enabled**: Auto-check new members joining

### Default Settings
- Punishment: `NONE`
- Actioning: `Enabled`
- Global Scan: `Enabled`

## Web Dashboard

The web dashboard allows contributors to:
- View blacklist statistics
- Search and filter blacklist entries
- Add new entries
- Revoke entries
- View proof links

**Access**: `http://localhost:3000` (or your configured domain)

**Authentication**: Discord OAuth (Contributor role required)

## Database Schema

### Tables

**blacklist_entries**
- Stores all blacklist entries with status (ACTIVE/REVOKED)
- Tracks license, Discord ID, reason, proof, server info
- Timestamps for creation, updates, and revocations

**guild_configs**
- Stores per-server configuration
- Log channel, punishment settings, feature toggles

**licenses**
- Optional license validation database
- Used by `/check-license` command

## Development

### Bot Development
```bash
cd bot
npm run dev  # Auto-restart on file changes
```

### Web Development
```bash
# Backend
cd web/backend
npm run dev

# Frontend
cd web/frontend
npm run dev
```

### Deploy Commands
After modifying commands, redeploy:
```bash
cd bot
npm run deploy
```

## Production Deployment

### Using Docker (Recommended)

1. Set `NODE_ENV=production` in `.env`
2. Configure `WEB_BASE_URL` with your domain
3. Update Discord OAuth callback URL to match your domain
4. Run: `docker-compose up -d`
5. Set up reverse proxy (nginx/caddy) for HTTPS

### Environment Variables for Production

```env
NODE_ENV=production
WEB_BASE_URL=https://yourdomain.com
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
CONTRIBUTOR_ROLE_ID=your_role_id
PARTNER_ROLE_ID=your_partner_role_id
SESSION_SECRET=secure_random_string
DB_PASSWORD=secure_database_password
```

## Security

- Web dashboard requires Discord OAuth authentication
- Only contributors (verified via role in main guild) can access dashboard
- All blacklist modifications are logged
- Commands require appropriate permissions
- Database credentials should be kept secure
- Use HTTPS in production
- Keep `SESSION_SECRET` and `DB_PASSWORD` secure

## Troubleshooting

### Bot not responding to commands
1. Check bot token is correct
2. Ensure bot has proper intents enabled in Discord Developer Portal
3. Run `npm run deploy` to register commands
4. Check bot permissions in your server

### Web dashboard not accessible
1. Check `WEB_BASE_URL` in `.env`
2. Verify Discord OAuth callback URL matches your domain
3. Ensure port 3000 is not blocked
4. Check web service logs: `docker-compose logs web`

### Database connection errors
1. Verify `DATABASE_URL` is correct
2. Check PostgreSQL is running: `docker-compose ps`
3. Ensure database is initialized: `docker-compose logs postgres`

### Permission denied errors
1. Verify user has contributor role in main guild
2. Check `CONTRIBUTOR_ROLE_ID` and `PARTNER_ROLE_ID` are set correctly
3. Ensure main guild ID matches `1457583613309620389`

## License

MIT License - Feel free to use and modify for your community.

## Support

For issues and feature requests, please open an issue on GitHub.

---

Built with ❤️ for the Moroccan RedM community.
