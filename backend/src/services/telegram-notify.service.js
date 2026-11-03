const env = require('../config/env');
const prisma = require('../lib/prisma');

// Sends website order alerts through the CHTH bot (telegram-bot/). The bot itself
// runs on Telegram Serverless and can't receive calls from here, so the backend
// talks to the Bot API directly. Recipients must have pressed /start in the bot.

const esc = (value) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const usd = (value) => `$${Number(value).toFixed(2)}`;

async function sendMessage(chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${env.telegram.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.warn(`Telegram notification to ${chatId} failed: ${body.description || response.status}`);
  }
}

/** Notifies each store in the order about their lines, and admins about the whole order. */
async function notifyOrderPlaced(orderId) {
  if (!env.telegram.botToken) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { username: true } },
      items: {
        include: { store: { include: { user: { select: { telegramId: true, username: true } } } } },
      },
    },
  });
  if (!order) return;

  const byStore = new Map();
  for (const item of order.items) {
    const { store } = item;
    if (!store) continue;
    if (!byStore.has(store.id)) byStore.set(store.id, { store, lines: [] });
    byStore.get(store.id).lines.push(item);
  }

  const line = (item) => `${item.quantity} × ${esc(item.name)} @ ${usd(item.price)}`;
  const shortId = order.id.slice(0, 8);

  for (const { store, lines } of byStore.values()) {
    const chatId = store.user?.telegramId;
    if (!chatId) continue;
    const total = lines.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await sendMessage(chatId, [
      `🛒 <b>New website order</b> <code>${shortId}</code>`,
      ...lines.map(line),
      `Your total: <b>${usd(total)}</b>`,
    ].join('\n'));
  }

  const adminText = [
    `🛒 <b>New website order</b> <code>${shortId}</code> by @${esc(order.user?.username)}`,
    ...order.items.map((item) => `${line(item)} — ${esc(item.store?.storeName || item.store?.user?.username || 'own design')}`),
    `Total: <b>${usd(order.total)}</b>`,
  ].join('\n');
  for (const adminId of env.telegram.adminIds) await sendMessage(adminId, adminText);
}

/** Fire-and-forget: a Telegram outage must never fail checkout. */
function notifyOrderPlacedInBackground(orderId) {
  notifyOrderPlaced(orderId).catch((error) => {
    console.error('Telegram order notification failed:', error.message);
  });
}

module.exports = { notifyOrderPlacedInBackground };
