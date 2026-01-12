w# RedShield Logging System

## Overview
The RedShield logging system ensures that when any server blacklists a member, an embed message is automatically sent to that server's configured log channel. Each server only receives logs related to its own actions.

## How It Works

### 1. Database Tracking
- A `log_sent` column in the `blacklist_entries` table tracks whether a log has been sent
- When a blacklist entry is created (via Dashboard or Discord bot), `log_sent` defaults to `FALSE`
- Once the log is sent to Discord, `log_sent` is updated to `TRUE`

### 2. LogNotifier Service
Located in: `bot/src/services/logNotifier.js`

The service runs every 10 seconds and:
1. Queries for blacklist entries where `log_sent = FALSE`
2. Matches entries to guilds by comparing `server_name` with `guild_name`
3. Sends an embed to the guild's configured `log_channel_id`
4. Marks the entry as `log_sent = TRUE`

**Key Query:**
```sql
SELECT be.*, gc.guild_id, gc.log_channel_id
FROM blacklist_entries be
JOIN guild_configs gc ON be.server_name = gc.guild_name
WHERE be.log_sent = FALSE
AND gc.log_channel_id IS NOT NULL
```

### 3. Server-Specific Logs
✅ **Each server only receives logs for entries where:**
- The `server_name` field matches the guild's `guild_name`
- The guild has a `log_channel_id` configured

✅ **Logs are NOT sent to other servers**
- The JOIN condition ensures only the matching guild receives the log
- No cross-server logging occurs

### 4. Embed Format
The embed includes:
- 🔴 User Blacklisted title
- User ID and Username
- Status: blacklisted
- User type (reason: CHEAT, GLITCH, DUPLICATE, OTHER)
- Server where banned
- Added date
- Proof link/image
- RedShield footer with timestamp

## Components

### Database Schema
```sql
ALTER TABLE blacklist_entries
ADD COLUMN log_sent BOOLEAN DEFAULT FALSE AFTER status;

CREATE INDEX idx_log_sent ON blacklist_entries(log_sent, created_at);
```

### Bot Integration
- **File:** `bot/src/index.js`
- The LogNotifier service starts when the bot becomes ready
- Runs continuously in the background
- Stops gracefully on bot shutdown

### API Server
- **File:** `redshield-dashboard2/server/src/routes.js`
- When creating blacklist entries via POST `/api/blacklist`, the `log_sent` field defaults to FALSE
- No additional code needed in the API - the bot handles all Discord logging

### Discord Bot Commands
- **File:** `bot/src/commands/contributor/adduser.js`
- When contributors use `/adduser` command, entries are created with `log_sent = FALSE`
- The LogNotifier service picks them up automatically

## Testing

### Test Scenario 1: Dashboard Entry
1. Login to the dashboard as a contributor
2. Navigate to "Add Blacklist Entry"
3. Fill in the form with:
   - License: test-license-123
   - Reason: CHEAT
   - Proof URL: https://example.com/proof.png
   - Server Name: (auto-populated with your server)
4. Submit the form
5. Within 10 seconds, check your server's log channel
6. You should see a red embed with the blacklist details

### Test Scenario 2: Discord Command
1. In your Discord server, use `/adduser` command
2. Fill in the required fields
3. Submit the command
4. Within 10 seconds, check your server's log channel
5. You should see a red embed with the blacklist details

### Verification
- ✅ Only the server that created the entry receives the log
- ✅ Other servers do NOT see the log
- ✅ Embeds are formatted correctly
- ✅ All information is displayed properly
- ✅ Images are embedded when proof URL is an image

## Error Handling

The system gracefully handles:
- **Missing Guilds:** If a guild is not found, the entry is marked as sent anyway
- **Missing Log Channels:** If a log channel is deleted, the entry is marked as sent
- **Invalid Users:** If a Discord user can't be fetched, username shows as "Unknown"
- **Rate Limits:** Embeds are sent one at a time with proper error handling

## Maintenance

### Check Unsent Logs
```sql
SELECT COUNT(*) FROM blacklist_entries WHERE log_sent = FALSE;
```

### Resend Logs (if needed)
```sql
UPDATE blacklist_entries SET log_sent = FALSE WHERE id = 'entry-id-here';
```

### View Recent Logs
```sql
SELECT * FROM blacklist_entries
WHERE log_sent = TRUE
ORDER BY created_at DESC
LIMIT 10;
```

## Summary

✅ **Automatic Logging:** All blacklist entries trigger log embeds
✅ **Server-Specific:** Each server only sees its own logs
✅ **Embed-Only:** No plain text messages
✅ **Reliable:** Database-backed with automatic retry
✅ **Graceful Errors:** Handles missing channels and guilds
