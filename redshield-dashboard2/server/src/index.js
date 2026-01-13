import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { config } from './config.js';
import passport from './auth.js';
import apiRoutes from './routes.js';
import botRoutes from './bot-routes.js';
import { pool } from './database.js';

const app = express();

// Trust proxy for Render/Vercel (required for secure cookies behind reverse proxy)
app.set('trust proxy', 1);

// Debug: Log frontend URL on startup
console.log('CORS origin set to:', config.frontendUrl);

// Middleware - CORS with explicit configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Check if origin matches frontend URL
    const allowedOrigins = [
      config.frontendUrl,
      'http://localhost:8080',
      'http://localhost:5173'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
    // Auto-add all users to dashboard_users with MEMBER role on first login
    try {
      await pool.execute(
        `INSERT INTO dashboard_users (discord_user_id, username, discriminator, avatar, role, is_active, last_seen)
         VALUES (?, ?, ?, ?, 'MEMBER', TRUE, NOW())
         ON DUPLICATE KEY UPDATE
           username = VALUES(username),
           discriminator = VALUES(discriminator),
           avatar = VALUES(avatar),
           last_seen = NOW()`,
        [
          req.user.id,
          req.user.username,
          req.user.discriminator || '0',
          req.user.avatar || null
        ]
      );
    } catch (error) {
      console.error('Error auto-adding user to dashboard_users:', error);
    }
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

// Debug endpoint to check config
app.get('/debug/config', (req, res) => {
  res.json({
    frontendUrl: config.frontendUrl,
    baseUrl: config.baseUrl,
    nodeEnv: process.env.NODE_ENV,
    origin: req.get('origin'),
  });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
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
