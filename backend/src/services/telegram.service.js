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

module.exports = { isValidTelegramPayload, telegramIdentity };
