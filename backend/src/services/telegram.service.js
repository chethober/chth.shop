const crypto = require('crypto');
const env = require('../config/env');

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

/** Verifies the signature (and freshness) Telegram attaches to Login Widget payloads. */
function isValidTelegramPayload(data) {
  const { botToken } = env.telegram;
  if (!botToken || !data || !data.hash) return false;

  const ageSeconds = Date.now() / 1000 - Number(data.auth_date);
  if (!Number.isFinite(ageSeconds) || ageSeconds > MAX_AUTH_AGE_SECONDS) return false;

  const { hash, ...fields } = data;
  const checkString = Object.keys(fields)
    .sort()
    .filter((key) => fields[key] !== undefined && fields[key] !== null && fields[key] !== '')
    .map((key) => `${key}=${fields[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  return (
    expected.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(hash)))
  );
}

function telegramIdentity(data) {
  const providerId = String(data.id);
  return {
    provider: 'telegram',
    providerId,
    preferredUsername: data.username || data.first_name || `tg_${providerId}`,
  };
}

/**
 * Verifies Mini App `initData` (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
 * the hash is HMAC-SHA256 of the sorted fields, keyed by HMAC-SHA256("WebAppData", bot token).
 * Returns the Telegram user and start parameter, or null when invalid or older than a day.
 */
function parseWebAppInitData(initData) {
  const { botToken } = env.telegram;
  if (!botToken || typeof initData !== 'string' || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
  if (expected.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) return null;

  const ageSeconds = Date.now() / 1000 - Number(params.get('auth_date'));
  if (!Number.isFinite(ageSeconds) || ageSeconds > MAX_AUTH_AGE_SECONDS) return null;

  let user;
  try {
    user = JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
  if (!user || !user.id) return null;
  return { user, startParam: params.get('start_param') || null };
}

module.exports = { isValidTelegramPayload, telegramIdentity, parseWebAppInitData };
