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

  /** CHTH hub reporting (optional): the hub's URL and this site's own secret. */
  hub: {
    url: process.env.HUB_URL || '',
    secret: process.env.HUB_SECRET || '',
    currency: process.env.SHOP_CURRENCY || 'USD',
  },

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

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
  },
};

env.google.isConfigured = Boolean(env.google.clientId && env.google.clientSecret);
env.x.isConfigured = Boolean(env.x.clientId);
env.telegram.isConfigured = Boolean(env.telegram.botToken && env.telegram.botUsername);

module.exports = env;
