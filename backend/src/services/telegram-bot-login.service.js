const crypto = require('crypto');
const env = require('../config/env');

// Sign-in through the CHTH bot (telegram-bot/): the bot sends a `login_url` button,
// and Telegram opens our callback with the user's data signed with the bot token.
// https://core.telegram.org/bots/api#loginurl · https://core.telegram.org/widgets/login#checking-authorization

/** Links are single-tap; anything older is treated as a replay. */
const MAX_AGE_SECONDS = 10 * 60;

// Fields we read from the verified data.
const AUTH_FIELDS = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date'];

let cachedUsername = null;

/** The bot's @username, looked up once from the Bot API. */
async function botUsername() {
  if (cachedUsername) return cachedUsername;
  const response = await fetch(`https://api.telegram.org/bot${env.telegram.botToken}/getMe`);
  const body = await response.json().catch(() => ({}));
  if (!body.ok) throw new Error(`Telegram getMe failed: ${body.description || response.status}`);
  cachedUsername = body.result.username;
  return cachedUsername;
}

/** Deep link that opens the bot and asks it for a sign-in button. */
async function botLoginLink() {
  return `https://t.me/${await botUsername()}?start=login`;
}

/**
 * Verifies the `hash` Telegram appends to a login URL. Returns the user fields,
 * or an error code string for the sign-in page.
 */
function verifyLoginData(query) {
  const { hash } = query;
  if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) return 'telegram_bot_invalid';

  // Telegram signs every field it sends, so all of them (bar `hash`) go into the check;
  // the callback URL carries no query params of its own.
  const signed = Object.keys(query).filter((key) => key !== 'hash' && typeof query[key] === 'string');
  const dataCheckString = signed
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join('\n');

  const fields = {};
  for (const key of AUTH_FIELDS) {
    if (typeof query[key] === 'string') fields[key] = query[key];
  }
  if (!fields.id || !fields.auth_date) return 'telegram_bot_invalid';
  const secret = crypto.createHash('sha256').update(env.telegram.botToken).digest();
  const expected = crypto.createHmac('sha256', secret).update(dataCheckString).digest();

  if (!crypto.timingSafeEqual(expected, Buffer.from(hash, 'hex'))) return 'telegram_bot_invalid';

  const age = Math.floor(Date.now() / 1000) - Number(fields.auth_date);
  if (!(age >= -60 && age <= MAX_AGE_SECONDS)) return 'telegram_bot_expired';

  return fields;
}

/** Same identity shape as the OIDC flow, so both sign-ins reach the same account. */
function botLoginIdentity(fields) {
  return {
    provider: 'telegram',
    providerId: String(fields.id),
    preferredUsername: fields.username || fields.first_name || `tg_${fields.id}`,
  };
}

module.exports = { botLoginLink, verifyLoginData, botLoginIdentity };
