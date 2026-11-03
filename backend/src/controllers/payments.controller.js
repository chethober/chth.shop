const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const payments = require('../services/payments');

/** Payment provider callback (IPN). Signature-verified by the provider module. */
const webhook = asyncHandler(async (req, res) => {
  const provider = payments.getProvider(req.params.provider);
  const update = provider.parseWebhook(req);
  await payments.applyPaymentUpdate(update);
  sendSuccess(res);
});

/** Development only: marks one of your orders as paid, standing in for a real crypto payment. */
const confirmMockPayment = asyncHandler(async (req, res) => {
  if (env.payments.provider !== 'mock') throw new HttpError(404, 'Not found');

  const order = await prisma.order.findFirst({ where: { id: String(req.params.orderId), userId: req.userId } });
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.paymentProvider !== 'mock') throw new HttpError(400, 'Start the payment first');

  await payments.applyPaymentUpdate({ orderId: order.id, status: 'PAID', payCurrency: 'USDT' });
  sendSuccess(res, { message: 'Payment simulated' });
});

/** Which payment methods checkout can offer. */
const methods = (req, res) => {
  sendSuccess(res, { data: payments.availableMethods() });
};

module.exports = { webhook, methods, confirmMockPayment };
