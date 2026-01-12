import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { config } from './config.js';
import passport from './auth.js';
import apiRoutes from './routes.js';
import botRoutes from './bot-routes.js';
import { pool } from './database.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get(
  '/auth/discord/callback',
  passport.authenticate('discord', {
    failureRedirect: `${config.frontendUrl}?error=auth_failed`,
  }),
  async (req, res) => {
    // Auto-save user to database on login
    try {
      const user = req.user;
      await pool.execute(
        `INSERT INTO dashboard_users (discord_user_id, username, discriminator, avatar, last_seen)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           username = VALUES(username),
           discriminator = VALUES(discriminator),
           avatar = VALUES(avatar),
           last_seen = NOW()`,
        [user.id, user.username, user.discriminator || '0', user.avatar]
      );
    } catch (error) {
      console.error('Error saving user to database:', error);
    }
    // Successful authentication
    res.redirect(config.frontendUrl);
  }
);

app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/auth/status', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user || null,
  });
});

// API routes
app.use('/api', apiRoutes);
app.use('/api/bot', botRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
}

// Start server
async function start() {
  const dbOk = await testDatabaseConnection();

  if (!dbOk) {
    console.error('Failed to connect to database. Please check your DATABASE_URL in .env');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         RedShield Dashboard API Server                    ║
╚═══════════════════════════════════════════════════════════╝

✓ Server running on: ${config.baseUrl}
✓ Frontend URL: ${config.frontendUrl}
✓ Database: Connected

Auth endpoints:
  - GET  ${config.baseUrl}/auth/discord
  - GET  ${config.baseUrl}/auth/discord/callback
  - POST ${config.baseUrl}/auth/logout
  - GET  ${config.baseUrl}/auth/status

API endpoints:
  - GET    ${config.baseUrl}/api/blacklist
  - POST   ${config.baseUrl}/api/blacklist
  - GET    ${config.baseUrl}/api/blacklist/:id
  - PATCH  ${config.baseUrl}/api/blacklist/:id
  - POST   ${config.baseUrl}/api/blacklist/:id/revoke
  - GET    ${config.baseUrl}/api/guilds
  - GET    ${config.baseUrl}/api/guilds/:id
  - PATCH  ${config.baseUrl}/api/guilds/:id
  - GET    ${config.baseUrl}/api/stats
  - GET    ${config.baseUrl}/api/user/me
    `);
  });
}

start();
