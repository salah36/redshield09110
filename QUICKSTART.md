# RedShield Quick Start Guide

## Prerequisites Check

You mentioned you have the database "redshield" ready. Great! Let's get RedShield running.

## Step 1: Initialize the Database

Run the setup script to create all tables:

### On Windows:
```bash
setup-database.bat
```

### Or manually with psql:
```bash
psql -U postgres -d redshield -f database/init.sql
```

You should see the tables being created:
- blacklist_entries
- guild_configs
- licenses

## Step 2: Configure Your Bot

The `.env` file is already created. You need to update it with your Discord credentials:

1. Open `.env` file
2. Update these values:

```env
DISCORD_BOT_TOKEN=YOUR_ACTUAL_BOT_TOKEN
DISCORD_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID
DISCORD_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET
CONTRIBUTOR_ROLE_ID=YOUR_ACTUAL_ROLE_ID
PARTNER_ROLE_ID=YOUR_ACTUAL_PARTNER_ROLE_ID
```

**Where to get these:**
- Bot Token: Discord Developer Portal > Your App > Bot > Token
- Client ID: Discord Developer Portal > Your App > OAuth2 > Client ID
- Client Secret: Discord Developer Portal > Your App > OAuth2 > Client Secret
- Role IDs: Discord > Server Settings > Roles > Right-click role > Copy ID (need Developer Mode enabled)

## Step 3: Install Dependencies

### Bot:
```bash
cd bot
npm install
```

### Web Backend:
```bash
cd web\backend
npm install
```

### Web Frontend:
```bash
cd web\frontend
npm install
```

## Step 4: Deploy Discord Commands

This registers all slash commands with Discord:

```bash
cd bot
npm run deploy
```

## Step 5: Start Everything

### Start the Bot:
```bash
cd bot
npm start
```

You should see:
```
✓ Connected to PostgreSQL database
✓ Database connection verified
Loaded command: about
Loaded command: help
...
Logged in as RedShield#1234!
```

### Start Web Backend (in a new terminal):
```bash
cd web\backend
npm start
```

### Start Web Frontend (in a new terminal):
```bash
cd web\frontend
npm run dev
```

Frontend will be at: http://localhost:5173
Backend API will be at: http://localhost:3000

## Step 6: Test It!

1. **Test the bot** in Discord:
   - Type `/help` in any channel where the bot is
   - Try `/about` to see the about message

2. **Test the web dashboard**:
   - Go to http://localhost:5173
   - Click "Login with Discord"
   - If you have the contributor role, you'll see the dashboard

## Common Issues

### "Database connection failed"
- Make sure PostgreSQL is running
- Verify the database "redshield" exists
- Check `DATABASE_URL` in `.env` matches your PostgreSQL setup

### "Commands not showing up"
- Wait a few minutes (global commands take time)
- Or invite the bot to your test server
- Commands appear instantly in the main guild (dev mode)

### "Permission denied" on web dashboard
- Make sure you have the contributor role in the main guild
- Check `CONTRIBUTOR_ROLE_ID` in `.env` is correct
- Verify `MAIN_GUILD_ID` matches your server ID

## What's Next?

1. **Configure your server**:
   ```
   /config set-log-channel #logs
   /config set-punishment type:KICK
   ```

2. **Add a test entry**:
   ```
   /adduser license:test123 reason_type:Cheat server:TestServer proof:https://example.com/proof.png
   ```

3. **Check it**:
   ```
   /checkuser license:test123
   ```

4. **Scan your server**:
   ```
   /scan-server
   ```

## Full Documentation

- **README.md** - Complete documentation
- **SETUP.md** - Detailed setup guide
- **database/init.sql** - Database schema reference

## Support

If you run into issues, check:
1. Console/terminal output for error messages
2. PostgreSQL is running and accessible
3. All environment variables are set correctly
4. Bot has correct permissions in Discord

---

You're all set! RedShield is ready to protect your community.
