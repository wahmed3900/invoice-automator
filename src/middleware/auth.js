const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google profile'));

        let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

        if (!user) {
          // link to existing email account or create fresh
          user = await prisma.user.upsert({
            where: { email },
            update: { googleId: profile.id, picture: profile.photos?.[0]?.value },
            create: {
              email,
              name: profile.displayName,
              picture: profile.photos?.[0]?.value,
              googleId: profile.id,
              subscription: 'FREE',
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, subscription: user.subscription },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Attaches req.user from Bearer token; sends 401 if missing/invalid
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
}

module.exports = { passport, issueToken, requireAuth };
