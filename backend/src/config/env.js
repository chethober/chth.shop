const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

function required(name, devFallback) {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return devFallback;
}

const port = Number(process.env.PORT) || 5000;

const env = {
  isProduction,
  isDevelopment: process.env.NODE_ENV === 'development',
  port,
  /** Frontend origins users may be sent back to (comma-separated FRONTEND_URL); the first is the default. */
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  jwtSecret: required('JWT_SECRET', 'dev-only-jwt-secret'),
  jwtExpiresIn: '7d',
  sessionSecret: required('SESSION_SECRET', 'dev-only-session-secret'),

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  x: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  },

  // Telegram OpenID Connect; the Client ID and Secret come from @BotFather → your bot → Login Widget.
  telegram: {
    clientId: process.env.TELEGRAM_CLIENT_ID,
    clientSecret: process.env.TELEGRAM_CLIENT_SECRET,
    // Optional: sign-in through the artist bot and website order alerts (see telegram-bot/).
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    adminIds: (process.env.TELEGRAM_ADMIN_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  },
};

env.google.isConfigured = Boolean(env.google.clientId && env.google.clientSecret);
env.x.isConfigured = Boolean(env.x.clientId && env.x.clientSecret);
env.telegram.isConfigured = Boolean(env.telegram.clientId && env.telegram.clientSecret);
env.telegram.isBotLoginConfigured = Boolean(env.telegram.botToken);

module.exports = env;
