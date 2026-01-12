# Bot Management Feature

## Overview
A comprehensive bot management dashboard available exclusively to the system owner. This feature allows complete control over the Discord bot's profile, presence, and server management.

## Access
**Owner Only** - This feature is only accessible to users with the OWNER role.

Navigate to: **Dashboard → Owner Controls → Bot Management**

---

## Features

### 1. 📊 Bot Statistics Overview

The dashboard displays real-time stats:
- **Bot Status**: Current username and discriminator
- **Total Servers**: Number of guilds the bot is connected to
- **Total Members**: Approximate member count across all servers

---

### 2. 🖼️ Profile Management

#### Avatar Update
- Upload new bot profile picture
- Supports: PNG, JPG, JPEG, GIF, WEBP
- Max file size: 8MB
- Live preview before uploading
- Cancel option to revert changes

**How to use:**
1. Click "Choose File"
2. Select an image from your computer
3. Preview the image
4. Click "Update Avatar" to apply
5. Bot avatar updates immediately

#### Username Change
- Change the bot's Discord username
- Requirements: 2-32 characters
- Note: Discord rate limits username changes (max 2 changes per hour)

**How to use:**
1. Enter new username in the input field
2. Click "Update Username"
3. Username updates immediately (if not rate limited)

---

### 3. ⚡ Status & Presence Management

#### Bot Status
Choose from four status types:
- 🟢 **Online** - Bot appears online
- 🟡 **Idle** - Bot appears idle/away
- 🔴 **Do Not Disturb** - Bot appears as DND
- ⚫ **Invisible** - Bot appears offline

#### Activity Status
- Set custom activity name
- Shows as "Playing [your text]"
- Max length: 128 characters
- Example: "Protecting servers..."

**How to use:**
1. Select desired status from dropdown
2. (Optional) Enter activity name
3. Click "Update Presence"
4. Changes may require bot restart to take effect

**Note:** Presence updates are stored and the bot will update on next sync.

---

### 4. 🖥️ Server Management

View all servers the bot is in with detailed information:
- Server name
- Server ID (for reference)
- Member count
- Leave server action

#### Leave Server Feature
Allows the bot to leave any server with confirmation:

**How to use:**
1. Find the server in the list
2. Click the "Leave" button (red trash icon)
3. Confirm in the dialog
4. Bot immediately leaves the server

**Warning:** Once the bot leaves, it cannot perform any actions in that server until re-invited.

---

## Technical Implementation

### Backend Endpoints (`/api/bot`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/info` | Get bot user information |
| GET | `/stats` | Get bot statistics |
| GET | `/guilds` | Get all servers bot is in |
| PATCH | `/profile/username` | Update bot username |
| PATCH | `/profile/avatar` | Update bot avatar |
| POST | `/presence` | Update bot status and activity |
| POST | `/guilds/:id/leave` | Leave a specific server |

### Security
- **All endpoints require `isOwnerMiddleware`**
- Only users with OWNER role can access
- Direct Discord API integration using bot token
- Avatar validation (format, size)
- Username validation (length, characters)

### Files Created/Modified

**Backend:**
- `server/src/bot-routes.js` - New bot management routes
- `server/src/index.js` - Integrated bot routes

**Frontend:**
- `src/pages/admin/BotManagement.tsx` - Main management page
- `src/lib/api.ts` - Bot API client methods
- `src/App.tsx` - Added route
- `src/pages/Dashboard.tsx` - Added navigation button

---

## Usage Examples

### Example 1: Change Bot Avatar
```
1. Navigate to Bot Management → Profile tab
2. Click "Choose File"
3. Select your new avatar image
4. Click "Update Avatar"
5. ✅ Avatar updated!
```

### Example 2: Set Bot to DND
```
1. Navigate to Bot Management → Status & Presence tab
2. Select "Do Not Disturb" from status dropdown
3. Enter activity: "Under maintenance"
4. Click "Update Presence"
5. ✅ Bot status updated!
```

### Example 3: Leave a Server
```
1. Navigate to Bot Management → Server Management tab
2. Find the server you want to leave
3. Click the "Leave" button
4. Confirm in the dialog
5. ✅ Bot left the server!
```

---

## Features Breakdown

### Profile Tab
✅ Change bot avatar (with preview)
✅ Change bot username
✅ View current bot information
✅ Upload validation and error handling

### Status & Presence Tab
✅ Set bot online status (4 options)
✅ Set custom activity message
✅ Visual status indicators
✅ Activity preview

### Server Management Tab
✅ List all servers bot is in
✅ Show server ID and member count
✅ Leave server with confirmation
✅ Automatic list refresh after leaving

---

## Screenshots Preview

**Dashboard View:**
- Owner Controls section with "Bot Management" button
- Highlighted with primary color

**Bot Management - Profile Tab:**
- Avatar preview with upload button
- Username change form
- Current stats cards

**Bot Management - Status Tab:**
- Status dropdown with color indicators
- Activity name input
- Update button

**Bot Management - Servers Tab:**
- Table with all servers
- Leave button for each server
- Confirmation dialog

---

## Notes

1. **Rate Limits**: Discord enforces rate limits on profile changes
   - Username: Max 2 changes per hour
   - Avatar: Rarely rate limited but respect Discord's limits

2. **Presence Updates**: May require bot restart to fully apply
   - The bot will sync on next connection
   - Status updates are stored in the system

3. **Permissions**: All features are owner-only
   - Contributors and regular users cannot access
   - Automatic redirect if non-owner tries to access

4. **Avatar Format**: Must be a data URL (base64 encoded)
   - Frontend handles conversion automatically
   - Validation on both frontend and backend

---

## Error Handling

The system handles various errors gracefully:

- ❌ Invalid image format → Error toast
- ❌ File too large → Error toast
- ❌ Username too short/long → Error toast
- ❌ Discord API error → Error toast with message
- ❌ Network error → Error toast
- ❌ Unauthorized access → Redirect to dashboard

---

## Future Enhancements (Potential)

- 📝 Bot description management
- 🎨 Rich presence support (custom status)
- 📊 Detailed analytics per server
- 🔔 Notification settings
- 📈 Performance metrics
- 🔄 Auto-reconnect monitoring
- 📜 Command usage statistics
- 🛡️ Permission audit log

---

## Summary

The Bot Management feature provides complete control over the Discord bot's profile, presence, and server connections. It's designed exclusively for owners to manage the bot without needing to access code or Discord developer portal.

**Key Benefits:**
- ✅ Easy bot customization
- ✅ No code changes needed
- ✅ Instant updates
- ✅ Server management in one place
- ✅ Professional interface
- ✅ Secure (owner-only access)

---

## Support

For issues or questions:
1. Check the error message in the toast notification
2. Verify you're logged in as the owner
3. Check bot token is valid in `.env` file
4. Ensure Discord API is accessible
5. Report issues with screenshots if needed

---

**Owner Controls > Bot Management** - Complete bot control at your fingertips! 🤖
