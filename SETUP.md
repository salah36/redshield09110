# RedShield Setup Guide

This guide will help you set up RedShield from scratch.

## Step 1: Discord Bot Setup

### 1.1 Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "RedShield"
4. Go to "Bot" section
5. Click "Add Bot"
6. **Copy the Bot Token** (you'll need this later)
7. Enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent (optional)

### 1.2 Configure Bot Permissions

In the "OAuth2" > "URL Generator" section:
1. Select scopes:
   - `bot`
   - `applications.commands`

2. Select bot permissions:
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Manage Roles
   - Kick Members
   - Ban Members

3. Copy the generated URL and use it to invite the bot to your server

### 1.3 Configure OAuth for Web Dashboard

In the "OAuth2" > "General" section:
1. Add Redirect URLs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

2. **Copy Client ID and Client Secret**

## Step 2: Main Guild Setup

### 2.1 Create or Use Existing Server

The main guild (ID: `1457583613309620389`) is where contributor roles are managed.

If you want to use a different server:
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click your server > Copy ID
3. Update `MAIN_GUILD_ID` in `.env`

### 2.2 Create Contributor Roles

1. Create a role called "Contributor" in your main guild
2. Create a role called "Partner" in your main guild (optional)
3. Copy the role IDs (right-click role > Copy ID)
4. Update `CONTRIBUTOR_ROLE_ID` and `PARTNER_ROLE_ID` in `.env`

## Step 3: Database Setup

### Option A: Using Docker (Recommended)

The database will be automatically created when you run `docker-compose up`.

### Option B: Manual PostgreSQL Setup

1. Install PostgreSQL 16+
2. Create a database:
   ```bash
   createdb redshield
   ```

3. Run the initialization script:
   ```bash
   psql -d redshield -f database/init.sql
   ```

4. Create a user (optional):
   ```sql
   CREATE USER redshield_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE redshield TO redshield_user;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO redshield_user;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO redshield_user;
   ```

## Step 4: Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:

   ```env
   # Discord Bot Configuration
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   DISCORD_CLIENT_SECRET=your_client_secret_here

   # Main Discord Server (Control Server)
   MAIN_GUILD_ID=1457583613309620389
   CONTRIBUTOR_ROLE_ID=your_contributor_role_id_here
   PARTNER_ROLE_ID=your_partner_role_id_here

   # Database Configuration
   DATABASE_URL=postgresql://redshield_user:password@localhost:5432/redshield

   # Web Dashboard Configuration
   WEB_PORT=3000
   WEB_BASE_URL=http://localhost:3000
   SESSION_SECRET=generate_a_random_secret_key_here

   # Environment
   NODE_ENV=development
   ```

## Step 5: Installation

### Using Docker (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Installation

**Install Bot:**
```bash
cd bot
npm install
```

**Install Web Backend:**
```bash
cd web/backend
npm install
```

**Install Web Frontend:**
```bash
cd web/frontend
npm install
```

## Step 6: Deploy Discord Commands

Before the bot can respond to slash commands, you need to register them:

```bash
cd bot
npm run deploy
```

You should see output like:
```
Started refreshing 11 application (/) commands.
Successfully reloaded 11 application (/) commands globally.
```

**Note**: Global commands can take up to 1 hour to appear. For instant testing, the deploy script also registers commands to the main guild in development mode.

## Step 7: Start the Application

### Using Docker

```bash
docker-compose up -d
```

Services will be available at:
- Bot: Running in background
- Web Dashboard: http://localhost:3000

### Manual Start

**Start Bot:**
```bash
cd bot
npm start
```

**Start Web Backend:**
```bash
cd web/backend
npm start
```

**Start Web Frontend (in development):**
```bash
cd web/frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

## Step 8: Verify Installation

### Test Bot

1. In your Discord server, type `/help`
2. The bot should respond with a command list
3. Try `/about` to verify it's working

### Test Web Dashboard

1. Go to http://localhost:3000
2. Click "Login with Discord"
3. Authorize the application
4. If you have the contributor role, you should see the dashboard

## Step 9: Configure Your Server

As a server admin, configure RedShield for your Discord server:

1. Set up logging:
   ```
   /config set-log-channel #redshield-logs
   ```

2. Set punishment type:
   ```
   /config set-punishment type:BAN
   ```

3. (Optional) Set punishment role:
   ```
   /config set-punish-role role:@Blacklisted
   ```

4. View your settings:
   ```
   /config settings
   ```

## Step 10: Add Your First Blacklist Entry

As a contributor, you can add entries via bot or web:

**Via Bot:**
```
/adduser license:abc123 reason_type:Cheat server:MyServer proof:https://imgur.com/proof.png
```

**Via Web:**
1. Go to http://localhost:3000
2. Click "Add Entry" tab
3. Fill in the form
4. Submit

## Troubleshooting

### Commands not showing up
- Wait up to 1 hour for global commands
- Or run `npm run deploy` again
- Kick and re-invite the bot

### Permission errors
- Verify bot has correct permissions
- Check role IDs in `.env`
- Ensure you're in the main guild with contributor role

### Database connection failed
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Test connection: `psql -d redshield`

### Web dashboard login fails
- Check OAuth callback URL matches exactly
- Verify `DISCORD_CLIENT_SECRET` is correct
- Clear browser cookies and try again

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a proper domain with HTTPS
3. Update `WEB_BASE_URL` to your domain
4. Use strong passwords and secrets
5. Set up a reverse proxy (nginx/caddy)
6. Enable firewall rules
7. Set up automatic backups for database

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name redshield.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Next Steps

- Invite other contributors to the main guild
- Configure punishment settings for your servers
- Add existing cheaters to the blacklist
- Share the bot invite link with trusted servers

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs` or console output
2. Review this guide carefully
3. Open an issue on GitHub with error details

---

Congratulations! RedShield is now set up and ready to protect your community.
