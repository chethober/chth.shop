// Payment methods and the order state changes payments cause.
//
// - "hosted": the configured hosted checkout (NOWPayments, or the mock page in development).
// - "ton": a direct TON transfer from the buyer's wallet through TON Connect.

const env = require('../../config/env');
const prisma = require('../../lib/prisma');
const { HttpError } = require('../../lib/http');
const nowpayments = require('./nowpayments');
const mock = require('./mock');
const ton = require('./ton');
const { onOrderPaid } = require('../order-events');

const HOSTED_PROVIDERS = { nowpayments, mock };

function hostedProvider() {
  const provider = HOSTED_PROVIDERS[env.payments.provider];
  if (!provider) throw new HttpError(503, `Unknown PAYMENT_PROVIDER: ${env.payments.provider}`);
  return provider;
}

/** Webhook providers by URL name. */
function getProvider(name) {
  const provider = HOSTED_PROVIDERS[name];
  if (!provider) throw new HttpError(404, 'Unknown payment provider');
  return provider;
}

/** Payment methods the checkout can offer. */
function availableMethods() {
  return {
    hosted: env.payments.provider === 'mock' || env.payments.nowpayments.isConfigured,
    ton: env.ton.isConfigured,
    hostedProvider: env.payments.provider,
    tonNetwork: env.ton.network,
  };
}

/** Statuses after which a new payment may be started for the order. */
const STARTABLE = ['UNPAID', 'WAITING', 'EXPIRED', 'FAILED'];

/**
 * Starts (or resumes) paying an order. Returns what the frontend needs: a redirect URL for the
 * hosted checkout, or a TON Connect transaction request.
 */
async function startPayment(order, { frontendOrigin, method = 'hosted' }) {
  if (order.status === 'CANCELLED') throw new HttpError(400, 'This order was cancelled');
  if (!STARTABLE.includes(order.paymentStatus)) {
    throw new HttpError(400, `Payment is already ${order.paymentStatus.toLowerCase().replace('_', ' ')}`);
  }

  if (method === 'ton') {
    const quote = await ton.createQuote(order);
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { ...quote, paymentProvider: 'ton', paymentUrl: null, paymentStatus: 'WAITING' },
    });
    return ton.transactionRequest(updated);
  }

  const provider = hostedProvider();
  if (order.paymentStatus === 'WAITING' && order.paymentUrl && order.paymentProvider === provider.name) {
    return { method: 'hosted', paymentUrl: order.paymentUrl, provider: provider.name };
  }

  const { paymentId, paymentUrl } = await provider.createPayment(order, {
    frontendOrigin,
    successUrl: `${frontendOrigin}/checkout/complete?order=${order.id}`,
    cancelUrl: `${frontendOrigin}/account?tab=orders`,
    webhookUrl: `${env.publicApiUrl}/payments/webhook/${provider.name}`,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentProvider: provider.name, paymentId, paymentUrl, paymentStatus: 'WAITING' },
  });
  return { method: 'hosted', paymentUrl, provider: provider.name };
}

/**
 * Applies a payment update to the order. Idempotent: replays and out-of-order webhooks never
 * move a paid order backwards (except to REFUNDED). Runs the paid-order side effects once.
 */
async function applyPaymentUpdate({ orderId, status, payCurrency, paidAmount, paidCurrency, txHash }) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new HttpError(404, 'Order not found');

  if (order.paymentStatus === 'PAID' && status !== 'REFUNDED') return order;

  let nextStatus = status;
  // Never trust a "finished" payment for less than the order total.
  if (
    status === 'PAID' &&
    paidAmount !== undefined &&
    (paidCurrency !== order.currency || !(paidAmount >= order.total - 0.005))
  ) {
    console.warn(`Order ${order.id}: paid ${paidAmount} ${paidCurrency}, expected ${order.total} ${order.currency}`);
    nextStatus = 'PARTIALLY_PAID';
  }

  let updated;
  try {
    updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: nextStatus,
        ...(payCurrency && { payCurrency }),
        ...(txHash && { txHash }),
        ...(nextStatus === 'PAID' && {
          paidAt: new Date(),
          ...(order.status === 'PENDING' && { status: 'CONFIRMED' }),
        }),
      },
    });
  } catch (error) {
    // The unique txHash stops one transfer from paying two orders.
    if (error.code === 'P2002') throw new HttpError(409, 'This transaction already paid another order');
    throw error;
  }

  if (nextStatus === 'PAID') {
    await onOrderPaid(updated.id).catch((error) => console.error(`Paid-order hooks failed for ${updated.id}:`, error));
  }
  return updated;
}

/**
 * Looks for on-chain TON payments for the given orders (one toncenter call for all of them)
 * and marks the ones it finds as paid. Returns the ids of orders that were paid.
 */
async function reconcileTonPayments(orders, { fetchImpl } = {}) {
  const waiting = orders.filter((order) => order.paymentProvider === 'ton' && order.paymentStatus === 'WAITING');
  if (waiting.length === 0 || !env.ton.isConfigured) return [];

  const transfers = await ton.recentTransfers({ fetchImpl });
  const paid = [];
  for (const order of waiting) {
    const transfer = ton.findPayment(order, transfers);
    if (transfer) {
      await applyPaymentUpdate({ orderId: order.id, status: 'PAID', payCurrency: 'TON', txHash: transfer.hash });
      paid.push(order.id);
    } else if (ton.findUnderpayment(order, transfers)) {
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'PARTIALLY_PAID' } });
    }
  }
  return paid;
}

const TON_POLL_MS = 20 * 1000;
const TON_LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;

/** Background check for TON payments, so orders get paid even if the buyer closes the page. */
function startTonPoller() {
  if (!env.ton.isConfigured) return null;
  let running = false;
  return setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const orders = await prisma.order.findMany({
        where: {
          paymentProvider: 'ton',
          paymentStatus: 'WAITING',
          createdAt: { gt: new Date(Date.now() - TON_LOOKBACK_MS) },
        },
      });
      await reconcileTonPayments(orders);
    } catch (error) {
      console.error('TON payment poll failed:', error.message);
    } finally {
      running = false;
    }
  }, TON_POLL_MS);
}

module.exports = {
  availableMethods,
  getProvider,
  startPayment,
  applyPaymentUpdate,
  reconcileTonPayments,
  startTonPoller,
};
