// Payment provider selection and the order state changes payments cause.

const env = require('../../config/env');
const prisma = require('../../lib/prisma');
const { HttpError } = require('../../lib/http');
const nowpayments = require('./nowpayments');
const mock = require('./mock');

const PROVIDERS = { nowpayments, mock };

function activeProvider() {
  const provider = PROVIDERS[env.payments.provider];
  if (!provider) throw new HttpError(503, `Unknown PAYMENT_PROVIDER: ${env.payments.provider}`);
  return provider;
}

function getProvider(name) {
  const provider = PROVIDERS[name];
  if (!provider) throw new HttpError(404, 'Unknown payment provider');
  return provider;
}

/** Statuses after which a new invoice may be created for the order. */
const RETRYABLE = ['UNPAID', 'EXPIRED', 'FAILED'];

/** Creates (or reuses) a crypto invoice for an unpaid order. */
async function startPayment(order, { frontendOrigin }) {
  if (order.status === 'CANCELLED') throw new HttpError(400, 'This order was cancelled');
  if (!RETRYABLE.includes(order.paymentStatus) && order.paymentStatus !== 'WAITING') {
    throw new HttpError(400, `Payment is already ${order.paymentStatus.toLowerCase().replace('_', ' ')}`);
  }

  const provider = activeProvider();
  if (order.paymentStatus === 'WAITING' && order.paymentUrl && order.paymentProvider === provider.name) {
    return order;
  }

  const { paymentId, paymentUrl } = await provider.createPayment(order, {
    frontendOrigin,
    successUrl: `${frontendOrigin}/checkout/complete?order=${order.id}`,
    cancelUrl: `${frontendOrigin}/account?tab=orders`,
    webhookUrl: `${env.publicApiUrl}/payments/webhook/${provider.name}`,
  });

  return prisma.order.update({
    where: { id: order.id },
    data: { paymentProvider: provider.name, paymentId, paymentUrl, paymentStatus: 'WAITING' },
  });
}

/**
 * Applies a provider's payment update to the order. Idempotent: replays and
 * out-of-order webhooks never move a paid order backwards (except to REFUNDED).
 */
async function applyPaymentUpdate({ orderId, status, payCurrency, paidAmount, paidCurrency }) {
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

  return prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: nextStatus,
      ...(payCurrency && { payCurrency }),
      ...(nextStatus === 'PAID' && {
        paidAt: new Date(),
        ...(order.status === 'PENDING' && { status: 'CONFIRMED' }),
      }),
    },
  });
}

module.exports = { activeProvider, getProvider, startPayment, applyPaymentUpdate };
