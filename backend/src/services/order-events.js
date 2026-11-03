// Side effects of an order being paid or changing status. Each hook is safe to run twice.

const crypto = require('crypto');
const env = require('../config/env');
const prisma = require('../lib/prisma');
const { roundCurrency } = require('../lib/serializers');
const { sendTelegram, escapeHtml, orderLink } = require('./notify');

const SERIAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 10-character tag code without look-alike characters, e.g. "K7QM-2XRP-9D". */
function newSerial() {
  const bytes = crypto.randomBytes(10);
  const chars = Array.from(bytes, (byte) => SERIAL_ALPHABET[byte % SERIAL_ALPHABET.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
}

/** One numbered collectible per unit of NFT-backed product in the order. */
async function issueCollectibles(orderId) {
  const items = await prisma.orderItem.findMany({
    where: { orderId, product: { nftBacked: true } },
    include: { product: true, order: { select: { userId: true } }, collectibles: { select: { id: true } } },
  });

  for (const item of items) {
    const missing = item.quantity - item.collectibles.length;
    if (missing <= 0) continue;

    await prisma.$transaction(async (tx) => {
      const issued = await tx.collectible.count({ where: { productId: item.productId } });
      for (let i = 0; i < missing; i++) {
        await tx.collectible.create({
          data: {
            serial: newSerial(),
            productId: item.productId,
            orderItemId: item.id,
            ownerId: item.order.userId,
            name: item.name,
            imageUrl: item.options?.previewUrl || item.product.imageUrl,
            edition: item.product.editionSize ? issued + i + 1 : null,
            editionSize: item.product.editionSize,
          },
        });
      }
    });
  }
}

/** Credits the referrer when someone they referred pays their first order. */
async function rewardReferrer(order, buyer) {
  if (!buyer.referredById) return;
  const earlierPaid = await prisma.order.count({
    where: { userId: buyer.id, paymentStatus: 'PAID', id: { not: order.id } },
  });
  if (earlierPaid > 0) return;

  await prisma.referralReward.upsert({
    where: { orderId: order.id },
    create: {
      userId: buyer.referredById,
      orderId: order.id,
      amount: roundCurrency((order.subtotal || order.total) * (env.referral.rewardPercent / 100)),
    },
    update: {},
  });
}

async function notifyPaid(order, buyer) {
  const lines = order.items.map((item) => `• ${item.quantity} × ${escapeHtml(item.name)}`).join('\n');
  await sendTelegram(
    buyer.telegramId,
    `✅ <b>Payment received</b> for order #${order.id.slice(0, 8).toUpperCase()}\n${lines}\n\nWe're printing it now. <a href="${orderLink(order.id)}">Track your order</a>`
  );

  // One message per seller with their lines and earnings.
  const bySeller = new Map();
  for (const item of order.items) {
    if (!item.store?.user?.telegramId) continue;
    const entry = bySeller.get(item.store.user.telegramId) ?? { lines: [], earning: 0 };
    entry.lines.push(`• ${item.quantity} × ${escapeHtml(item.name)}`);
    entry.earning += item.sellerEarning;
    bySeller.set(item.store.user.telegramId, entry);
  }
  for (const [chatId, { lines: sold, earning }] of bySeller) {
    await sendTelegram(chatId, `💸 <b>New sale!</b>\n${sold.join('\n')}\nYou earn <b>$${earning.toFixed(2)}</b>.`);
  }
}

/** Everything that happens once an order is paid. */
async function onOrderPaid(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: { include: { store: { include: { user: { select: { telegramId: true } } } } } },
    },
  });
  if (!order || order.paymentStatus !== 'PAID') return;

  await issueCollectibles(order.id);
  await rewardReferrer(order, order.user);
  await notifyPaid(order, order.user);
}

const STATUS_MESSAGES = {
  SHIPPED: '📦 Your order #{id} has shipped!',
  DELIVERED: '🎉 Your order #{id} was delivered. Enjoy, and leave a review!',
  CANCELLED: 'Your order #{id} was cancelled.',
};

async function onOrderStatusChanged(order) {
  const template = STATUS_MESSAGES[order.status];
  if (!template) return;
  const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { telegramId: true } });
  await sendTelegram(user?.telegramId, `${template.replace('{id}', order.id.slice(0, 8).toUpperCase())}\n<a href="${orderLink(order.id)}">View order</a>`);
}

module.exports = { onOrderPaid, onOrderStatusChanged, issueCollectibles, newSerial };
