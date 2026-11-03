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

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
  },

  /** Share of each sale's margin (price minus production cost) the platform keeps. */
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT ?? 25),

  payments: {
    /** `nowpayments` in production; `mock` lets you mark orders paid by hand in development. */
    provider: process.env.PAYMENT_PROVIDER || (isProduction ? 'nowpayments' : 'mock'),
    nowpayments: {
      apiKey: process.env.NOWPAYMENTS_API_KEY,
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
      apiUrl: (process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io/v1').replace(/\/+$/, ''),
    },
  },

  /** TON: direct wallet payments via TON Connect and NFT certificates for NFT-backed merch. */
  ton: {
    network: process.env.TON_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
    /** Wallet that receives TON payments. */
    receiverAddress: process.env.TON_RECEIVER_ADDRESS || '',
    toncenterApiKey: process.env.TONCENTER_API_KEY || '',
    /** Fixed TON price in USD; when unset the live price is fetched from CoinGecko. */
    usdPrice: Number(process.env.TON_USD_PRICE) || null,
    quoteTtlMinutes: Number(process.env.TON_QUOTE_TTL_MINUTES) || 20,
    /** 24-word mnemonic of the wallet that owns the NFT collection (it pays for mints). */
    minterMnemonic: process.env.TON_MINTER_MNEMONIC || '',
    collectionAddress: process.env.TON_NFT_COLLECTION_ADDRESS || '',
  },

  referral: {
    /** Discount on a referred user's first order. */
    discountPercent: Number(process.env.REFERRAL_DISCOUNT_PERCENT ?? 10),
    /** Credit the referrer earns from that order's subtotal. */
    rewardPercent: Number(process.env.REFERRAL_REWARD_PERCENT ?? 5),
  },

  /** Public base URL of this API as seen by payment providers (for webhooks). Defaults to the first FRONTEND_URL, which proxies /api. */
  publicApiUrl: (process.env.PUBLIC_API_URL || '').replace(/\/+$/, ''),
};

env.google.isConfigured = Boolean(env.google.clientId && env.google.clientSecret);
env.telegram.isConfigured = Boolean(env.telegram.botToken && env.telegram.botUsername);
env.payments.nowpayments.isConfigured = Boolean(
  env.payments.nowpayments.apiKey && env.payments.nowpayments.ipnSecret
);
if (!env.publicApiUrl) env.publicApiUrl = `${env.frontendUrls[0]}/api`;

env.ton.apiUrl = (
  process.env.TONCENTER_API_URL ||
  (env.ton.network === 'testnet' ? 'https://testnet.toncenter.com/api/v2' : 'https://toncenter.com/api/v2')
).replace(/\/+$/, '');
env.ton.isConfigured = Boolean(env.ton.receiverAddress);
env.ton.canMint = Boolean(env.ton.minterMnemonic && env.ton.collectionAddress);

if (env.isProduction && env.payments.provider === 'mock') {
  throw new Error('PAYMENT_PROVIDER=mock is not allowed in production');
}

module.exports = env;
