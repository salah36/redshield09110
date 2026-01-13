import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { config } from './config.js';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Owner Discord ID - Full system access
const OWNER_ID = '1302824457068613686';

// Check if user is the owner
export function isOwner(userId) {
  return userId === OWNER_ID;
}

passport.use(
  new DiscordStrategy(
    {
      clientID: config.discord.clientId,
      clientSecret: config.discord.clientSecret,
      callbackURL: config.discord.callbackUrl,
      scope: ['identify', 'guilds', 'guilds.members.read'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Attach access token to profile for fetching guild member data
        profile.accessToken = accessToken;
        return done(null, profile);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Middleware to check if user is authenticated
export function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

// Middleware to check if user is the owner (Owner only endpoints)
export function isOwnerMiddleware(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (isOwner(req.user.id)) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied: Owner only' });
}

// Middleware to check if user is a contributor
// User must have: Owner status OR Discord contributor role OR active license
export async function isContributor(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Owner always has contributor access
  if (isOwner(req.user.id)) {
    req.userRoles = {
      isOwner: true,
      isContributor: true,
    };
    return next();
  }

  // Import pool here to avoid circular dependency
  const { pool } = await import('./database.js');

  let hasDiscordRole = false;
  let hasActiveLicense = false;

  // Check Discord API for contributor role (source of truth)
  try {
    const response = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${config.mainGuild.id}/member`,
      {
        headers: {
          Authorization: `Bearer ${req.user.accessToken}`,
        },
      }
    );

    if (response.ok) {
      const member = await response.json();
      hasDiscordRole = member.roles.includes(config.mainGuild.contributorRoleId);
    }
  } catch (error) {
    console.error('Error checking Discord contributor status:', error);
  }

  // Check for active license
  if (!hasDiscordRole) {
    try {
      const [licenseRows] = await pool.execute(
        `SELECT * FROM license_keys
         WHERE claimed_by = ? AND status = 'CLAIMED' AND expires_at > NOW()`,
        [req.user.id]
      );
      hasActiveLicense = licenseRows.length > 0;
    } catch (dbError) {
      console.error('Error checking license:', dbError);
    }
  }

  if (hasDiscordRole || hasActiveLicense) {
    req.userRoles = {
      isContributor: true,
    };
    return next();
  }

  res.status(403).json({ error: 'Insufficient permissions. Contributor role or active license required.' });
}

export default passport;
