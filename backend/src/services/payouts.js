// Seller payouts: store sales earnings + referral credit, paid in USDT.
//
// A sale becomes payable once its order is paid, shipped (or delivered) and older than
// PAYOUT_HOLD_DAYS. A payout run groups everything payable per user into one Payout row and links
// the lines to it, so nothing is ever paid twice. Payouts to a USDT-on-TON address are sent
// automatically from the platform wallet; other networks stay PENDING until an admin sends them
// by hand and records the transaction.

const { Address, toNano } = require('@ton/core');
const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError } = require('../lib/http');
const { roundCurrency } = require('../lib/serializers');
const { sendTelegram } = require('./notify');
const tonWallet = require('./ton-wallet');

/** Networks the platform wallet can pay automatically. */
const AUTO_NETWORKS = ['USDT-TON'];
const JETTON_GAS = toNano('0.05');

function holdCutoff(now = new Date()) {
  return new Date(now.getTime() - env.payouts.holdDays * 24 * 60 * 60 * 1000);
}

/** Where a user's money goes: their store's payout address, else their referral reward address. */
function payoutDestination(user) {
  if (user.store?.payoutAddress) return { address: user.store.payoutAddress, network: user.store.payoutNetwork || 'USDT-TON' };
  if (user.rewardAddress) return { address: user.rewardAddress, network: 'USDT-TON' };
  return null;
}

/**
 * Unpaid earnings per user: `available` (payable now) and `onHold` (paid orders still in the
 * hold period or not shipped yet). Optionally for one user only.
 */
async function balances({ userId, now = new Date() } = {}) {
  const unpaid = { payoutId: null };
  const [items, rewards] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        ...unpaid,
        storeId: { not: null },
        sellerEarning: { gt: 0 },
        order: { paymentStatus: 'PAID', status: { not: 'CANCELLED' } },
        ...(userId && { store: { userId } }),
      },
      select: { id: true, sellerEarning: true, store: { select: { userId: true } }, order: { select: { status: true, paidAt: true, paymentStatus: true } } },
    }),
    prisma.referralReward.findMany({
      where: { ...unpaid, order: { paymentStatus: 'PAID', status: { not: 'CANCELLED' } }, ...(userId && { userId }) },
      select: { id: true, amount: true, userId: true, order: { select: { status: true, paidAt: true, paymentStatus: true } } },
    }),
  ]);

  const cutoff = holdCutoff(now);
  const isPayable = (order) => ['SHIPPED', 'DELIVERED'].includes(order.status) && order.paidAt && order.paidAt <= cutoff;

  const byUser = new Map();
  const entry = (id) => {
    if (!byUser.has(id)) byUser.set(id, { userId: id, available: 0, onHold: 0, itemIds: [], rewardIds: [] });
    return byUser.get(id);
  };
  for (const item of items) {
    const balance = entry(item.store.userId);
    if (isPayable(item.order)) {
      balance.available += item.sellerEarning;
      balance.itemIds.push(item.id);
    } else {
      balance.onHold += item.sellerEarning;
    }
  }
  for (const reward of rewards) {
    const balance = entry(reward.userId);
    if (isPayable(reward.order)) {
      balance.available += reward.amount;
      balance.rewardIds.push(reward.id);
    } else {
      balance.onHold += reward.amount;
    }
  }

  const users = await prisma.user.findMany({
    where: { id: { in: [...byUser.keys()] } },
    select: { id: true, username: true, rewardAddress: true, telegramId: true, store: { select: { payoutAddress: true, payoutNetwork: true } } },
  });
  return users.map((user) => {
    const balance = byUser.get(user.id);
    return {
      ...balance,
      available: roundCurrency(balance.available),
      onHold: roundCurrency(balance.onHold),
      username: user.username,
      telegramId: user.telegramId,
      destination: payoutDestination(user),
    };
  });
}

/** Creates one payout per user whose payable balance reaches the minimum. */
async function createPayouts({ now = new Date() } = {}) {
  const created = [];
  const skipped = [];
  for (const balance of await balances({ now })) {
    if (balance.available < env.payouts.minAmount) continue;
    if (!balance.destination) {
      skipped.push({ username: balance.username, amount: balance.available, reason: 'no payout address' });
      continue;
    }

    const payout = await prisma.$transaction(async (tx) => {
      const row = await tx.payout.create({
        data: { userId: balance.userId, amount: 0, ...balance.destination },
      });
      // Only lines nobody else claimed in the meantime are linked.
      await tx.orderItem.updateMany({ where: { id: { in: balance.itemIds }, payoutId: null }, data: { payoutId: row.id } });
      await tx.referralReward.updateMany({ where: { id: { in: balance.rewardIds }, payoutId: null }, data: { payoutId: row.id } });

      const [items, rewards] = await Promise.all([
        tx.orderItem.aggregate({ where: { payoutId: row.id }, _sum: { sellerEarning: true } }),
        tx.referralReward.aggregate({ where: { payoutId: row.id }, _sum: { amount: true } }),
      ]);
      const amount = roundCurrency((items._sum.sellerEarning || 0) + (rewards._sum.amount || 0));
      if (amount <= 0) {
        await tx.payout.delete({ where: { id: row.id } });
        return null;
      }
      return tx.payout.update({ where: { id: row.id }, data: { amount } });
    });
    if (payout) created.push(payout);
  }
  return { created, skipped };
}

/** Sends a USDT-on-TON payout from the platform wallet and records the result. */
async function sendPayout(payoutId) {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId }, include: { user: { select: { telegramId: true } } } });
  if (!payout) throw new HttpError(404, 'Payout not found');
  if (!AUTO_NETWORKS.includes(payout.network)) throw new HttpError(400, `${payout.network} payouts are sent by hand`);
  if (!env.ton.canPayout) throw new HttpError(503, 'Automatic payouts need TON_WALLET_MNEMONIC and a USDT jetton master');

  // Only one sender per payout.
  const { count } = await prisma.payout.updateMany({
    where: { id: payout.id, status: { in: ['PENDING', 'FAILED'] } },
    data: { status: 'SENDING', error: null },
  });
  if (count === 0) throw new HttpError(409, `Payout is already ${payout.status.toLowerCase()}`);

  try {
    Address.parse(payout.address);
    const { address: platformAddress } = await tonWallet.platformWallet();
    await tonWallet.send(async () => {
      const fromJettonWallet = await tonWallet.jettonWalletAddress(platformAddress.toString(), env.ton.usdtMaster);
      return {
        messages: [
          {
            to: fromJettonWallet,
            value: JETTON_GAS,
            body: tonWallet.jettonTransferBody({
              amount: tonWallet.usdToUsdtUnits(payout.amount),
              destination: payout.address,
              responseDestination: platformAddress.toString(),
              forwardTonAmount: 1n,
              comment: `CHTH payout ${payout.id.slice(0, 8)}`,
            }),
          },
        ],
      };
    });

    const sent = await prisma.payout.update({ where: { id: payout.id }, data: { status: 'SENT', sentAt: new Date() } });
    sendTelegram(payout.user.telegramId, `💰 <b>Payout sent:</b> ${payout.amount.toFixed(2)} USDT to your TON wallet.`);
    return sent;
  } catch (error) {
    console.error(`Payout ${payout.id} failed:`, error);
    return prisma.payout.update({
      where: { id: payout.id },
      data: { status: 'FAILED', error: String(error.message || error).slice(0, 300) },
    });
  }
}

/** Records a payout an admin sent by hand (other networks, or a manual retry). */
async function markSent(payoutId, txHash) {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId }, include: { user: { select: { telegramId: true } } } });
  if (!payout) throw new HttpError(404, 'Payout not found');
  if (payout.status === 'SENT') return payout;
  if (payout.status === 'SENDING') throw new HttpError(409, 'This payout is being sent automatically');
  const sent = await prisma.payout.update({
    where: { id: payout.id },
    data: { status: 'SENT', sentAt: new Date(), txHash: txHash ? String(txHash).slice(0, 200) : null, error: null },
  });
  sendTelegram(payout.user.telegramId, `💰 <b>Payout sent:</b> ${payout.amount.toFixed(2)} USDT (${payout.network}).`);
  return sent;
}

/** Cancels an unsent payout; its lines go back into the user's balance. */
async function cancelPayout(payoutId) {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new HttpError(404, 'Payout not found');
  if (payout.status === 'SENT' || payout.status === 'SENDING') throw new HttpError(409, `A ${payout.status.toLowerCase()} payout can't be cancelled`);
  await prisma.$transaction([
    prisma.orderItem.updateMany({ where: { payoutId }, data: { payoutId: null } }),
    prisma.referralReward.updateMany({ where: { payoutId }, data: { payoutId: null } }),
    prisma.payout.delete({ where: { id: payoutId } }),
  ]);
}

/** A full run: create payouts, then send the automatic ones one by one. */
async function runPayouts({ send = true } = {}) {
  const { created, skipped } = await createPayouts();
  const results = [];
  for (const payout of created) {
    if (send && AUTO_NETWORKS.includes(payout.network) && env.ton.canPayout) {
      results.push(await sendPayout(payout.id).catch((error) => ({ ...payout, status: 'FAILED', error: error.message })));
    } else {
      results.push(payout);
    }
  }
  return { payouts: results, skipped };
}

module.exports = {
  AUTO_NETWORKS,
  balances,
  holdCutoff,
  payoutDestination,
  createPayouts,
  sendPayout,
  markSent,
  cancelPayout,
  runPayouts,
};
