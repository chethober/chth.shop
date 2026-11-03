const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { isValidAddress } = require('../services/payments/ton');
const payouts = require('../services/payouts');

function serializePayout(payout) {
  return {
    id: payout.id,
    amount: payout.amount,
    network: payout.network,
    address: payout.address,
    status: payout.status,
    txHash: payout.txHash,
    error: payout.error,
    createdAt: payout.createdAt,
    sentAt: payout.sentAt,
    ...(payout.user && { username: payout.user.username }),
  };
}

/** The signed-in user's balance and payout history. */
const getMine = asyncHandler(async (req, res) => {
  const [balance] = await payouts.balances({ userId: req.userId });
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { rewardAddress: true, store: { select: { payoutAddress: true, payoutNetwork: true } } },
  });
  const history = await prisma.payout.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, take: 50 });

  sendSuccess(res, {
    data: {
      available: balance?.available ?? 0,
      onHold: balance?.onHold ?? 0,
      paidOut: history.filter((p) => p.status === 'SENT').reduce((sum, p) => sum + p.amount, 0),
      destination: payouts.payoutDestination(user),
      rewardAddress: user.rewardAddress,
      minAmount: env.payouts.minAmount,
      holdDays: env.payouts.holdDays,
      automatic: env.ton.canPayout,
      payouts: history.map(serializePayout),
    },
  });
});

/** TON address for referral credit (users without a store payout address). */
const setRewardAddress = asyncHandler(async (req, res) => {
  const address = req.body.address ? String(req.body.address).trim() : null;
  if (address && !isValidAddress(address)) throw new HttpError(400, 'Enter a valid TON address');
  await prisma.user.update({ where: { id: req.userId }, data: { rewardAddress: address } });
  sendSuccess(res, { message: address ? 'Reward wallet saved' : 'Reward wallet removed', data: { rewardAddress: address } });
});

/* ---------- Admin ---------- */

const adminOverview = asyncHandler(async (req, res) => {
  const [balances, recent] = await Promise.all([
    payouts.balances(),
    prisma.payout.findMany({ include: { user: { select: { username: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  sendSuccess(res, {
    data: {
      balances: balances
        .filter((b) => b.available > 0 || b.onHold > 0)
        .map(({ itemIds, rewardIds, telegramId, ...rest }) => rest)
        .sort((a, b) => b.available - a.available),
      payouts: recent.map(serializePayout),
      minAmount: env.payouts.minAmount,
      holdDays: env.payouts.holdDays,
      automatic: env.ton.canPayout,
    },
  });
});

const adminRun = asyncHandler(async (req, res) => {
  const { payouts: created, skipped } = await payouts.runPayouts();
  sendSuccess(res, { message: `${created.length} payout(s) created`, data: { payouts: created.map(serializePayout), skipped } });
});

const adminSend = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { payout: serializePayout(await payouts.sendPayout(String(req.params.id))) } });
});

const adminMarkSent = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { payout: serializePayout(await payouts.markSent(String(req.params.id), req.body?.txHash)) } });
});

const adminCancel = asyncHandler(async (req, res) => {
  await payouts.cancelPayout(String(req.params.id));
  sendSuccess(res, { message: 'Payout cancelled' });
});

module.exports = { getMine, setRewardAddress, adminOverview, adminRun, adminSend, adminMarkSent, adminCancel };
