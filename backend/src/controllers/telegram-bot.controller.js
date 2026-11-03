// Telegram bot webhook: answers commands with buttons that open the shop as a Mini App.
// Register it with `npm run telegram:setup` (sets the webhook, menu button and command list).

const env = require('../config/env');
const { HttpError, asyncHandler } = require('../lib/http');
const { escapeHtml } = require('../services/notify');

function miniAppUrl(path = '/') {
  return `${env.telegram.miniAppUrl}${path}`;
}

/** `/start` parameters from deep links: ref_<CODE> → referral, p_<id> → product page. */
function startPath(param) {
  if (!param) return '/shop';
  if (/^ref_[A-Za-z0-9]+$/.test(param)) return `/shop?ref=${param.slice(4)}`;
  if (/^p_[0-9a-f-]{36}$/i.test(param)) return `/p/${param.slice(2)}`;
  return '/shop';
}

const COMMANDS = {
  start: (param) => ({
    text: '👋 <b>Welcome to CHTH</b>\nMerch from independent artists and merchants. Design your own in 3D, pay with TON or USDT.',
    button: { text: '🛍 Open the shop', path: startPath(param) },
  }),
  shop: () => ({ text: 'Browse every store:', button: { text: '🛍 Shop', path: '/shop' } }),
  design: () => ({ text: 'Design a tee, hoodie, mug and more in 3D:', button: { text: '🎨 Open the studio', path: '/design' } }),
  orders: () => ({ text: 'Your orders and their status:', button: { text: '📦 My orders', path: '/account?tab=orders' } }),
  sell: () => ({ text: 'Open a store as an artist or merchant. No inventory, crypto payouts.', button: { text: '🏪 Start selling', path: '/collab' } }),
  help: () => ({
    text: 'Commands:\n/shop: browse the marketplace\n/design: 3D design studio\n/orders: your orders\n/sell: open a store',
  }),
};

async function reply(chatId, { text, button }) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...(button && {
      reply_markup: { inline_keyboard: [[{ text: button.text, web_app: { url: miniAppUrl(button.path) } }]] },
    }),
  };
  const response = await fetch(`https://api.telegram.org/bot${env.telegram.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) console.warn('Telegram reply failed:', response.status, await response.text().catch(() => ''));
}

/** Parses "/cmd@bot param" into a reply; unknown text gets the help message. */
function replyFor(text) {
  const match = String(text || '').match(/^\/([a-z]+)(?:@\w+)?(?:\s+(\S+))?/i);
  const command = match && COMMANDS[match[1].toLowerCase()];
  if (!command) return { ...COMMANDS.help(), text: `${escapeHtml('Not sure what you mean.')}\n\n${COMMANDS.help().text}` };
  return command(match[2]);
}

const webhook = asyncHandler(async (req, res) => {
  if (!env.telegram.webhookSecret || req.get('x-telegram-bot-api-secret-token') !== env.telegram.webhookSecret) {
    throw new HttpError(401, 'Bad webhook secret');
  }
  const message = req.body?.message;
  // Acknowledge right away; Telegram retries slow webhooks.
  res.json({ ok: true });
  if (message?.chat?.id && message.text) {
    reply(message.chat.id, replyFor(message.text)).catch((error) => console.error('Bot reply failed:', error));
  }
});

module.exports = { webhook, replyFor, startPath, COMMANDS };
