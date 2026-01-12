# RedShield Dashboard - Integration Guide

## What Was Integrated

Your existing beautiful dashboard UI has been successfully integrated with the RedShield backend API and database.

### Backend Server (`/server`)
- **Express API** with REST endpoints for blacklist, guilds, and stats
- **Discord OAuth** authentication (requires Contributor or Partner role)
- **MySQL/MariaDB** connection to the same database as the bot
- **Session-based auth** with secure cookies

### Frontend Updates (`/src`)
- **API Client** (`src/lib/api.ts`) - TypeScript client for all API calls
- **React Hooks** for data fetching:
  - `useAuth.ts` - Authentication (login, logout, current user)
  - `useStats.ts` - Dashboard statistics
  - `useBlacklist.ts` - Blacklist CRUD operations
  - `useGuilds.ts` - Guild configuration management

### Updated Components
- **Navbar** - Now shows real Discord login/logout with user avatar and role
- **StatsSection** - Displays real stats from database (active entries, protected servers, recent entries)

## How to Run

### 1. Start the Backend Server (Port 8081)
```bash
cd C:\Users\Setup Game\Desktop\RedShield\redshield-dashboard2\server
npm start
```

**Backend is already running!** You should see:
- ✓ Database connection successful
- ✓ Server running on: http://localhost:8081

### 2. Start the Frontend (Port 8080)
```bash
cd C:\Users\Setup Game\Desktop\RedShield\redshield-dashboard2
npm run dev
```

### 3. Access the Dashboard
Open your browser and go to: **http://localhost:8080**

## Features Now Working

### ✅ Public Landing Page
- Shows real stats from database
- Login button redirects to Discord OAuth

### ✅ Authentication
- Login with Discord (redirects to Discord OAuth)
- Only Contributors and Partners can access API
- User avatar and role displayed in navbar
- Logout functionality

### ✅ Protected API Endpoints
All API endpoints require authentication and Contributor/Partner role:

**Blacklist:**
- `GET /api/blacklist` - List entries (with pagination & filters)
- `POST /api/blacklist` - Add new entry
- `PATCH /api/blacklist/:id` - Update entry
- `POST /api/blacklist/:id/revoke` - Revoke entry

**Guilds:**
- `GET /api/guilds` - List all guild configs
- `PATCH /api/guilds/:id` - Update guild config

**Stats:**
- `GET /api/stats` - Get dashboard statistics

**User:**
- `GET /api/user/me` - Get current user info

## Next Steps (Optional)

You may want to create additional pages for Contributors:

### 1. Dashboard Page (`/dashboard`)
Create a protected route for Contributors to manage the blacklist:
- Search and filter blacklist entries
- Add new entries
- View and edit existing entries
- Revoke entries

### 2. Guild Management Page
Page for managing guild configurations:
- Enable/disable guilds
- Configure punishment types
- Set custom kick/ban reasons

### 3. Protected Routes
Add route protection in `App.tsx`:
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Environment Variables

All configuration is in the root `.env` file:
- `DASHBOARD_PORT=8081` - Backend server port
- `DASHBOARD_BASE_URL=http://localhost:8081` - Backend URL
- `DASHBOARD_FRONTEND_URL=http://localhost:8080` - Frontend URL
- `DISCORD_CLIENT_ID` - Discord OAuth client ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth client secret
- `DATABASE_URL` - MySQL connection string

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│  React Frontend │ ◄─────► │  Express Backend │ ◄─────► │   MariaDB    │
│  (Port 8080)    │  API    │  (Port 8081)     │  mysql2 │  Database    │
└─────────────────┘  Calls  └──────────────────┘         └──────────────┘
                                      │
                                      │ Discord API
                                      ▼
                              ┌──────────────┐
                              │   Discord    │
                              │    OAuth     │
                              └──────────────┘
```

## Notes

- The same database is used by both the Discord bot and the dashboard
- All blacklist actions (create, update, revoke) are logged with `created_by`, `updated_by`, `revoked_by`
- Duplicate active entries for the same license are prevented
- Stats are cached for 2 minutes on the frontend to reduce database load
- CORS is configured to allow credentials (cookies) from frontend to backend
