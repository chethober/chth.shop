// NOWPayments (https://nowpayments.io): hosted crypto invoices for BTC, ETH, USDT, TON and
// ~300 other coins. The buyer picks a coin on the hosted page; we get an IPN webhook back.

const crypto = require('crypto');
const env = require('../../config/env');
const { HttpError } = require('../../lib/http');

const STATUS_MAP = {
  waiting: 'WAITING',
  confirming: 'CONFIRMING',
  confirmed: 'CONFIRMING',
  sending: 'CONFIRMING',
  partially_paid: 'PARTIALLY_PAID',
  finished: 'PAID',
  failed: 'FAILED',
  refunded: 'REFUNDED',
  expired: 'EXPIRED',
};

function config() {
  const settings = env.payments.nowpayments;
  if (!settings.isConfigured) {
    throw new HttpError(503, 'Crypto payments are not configured (NOWPAYMENTS_API_KEY / NOWPAYMENTS_IPN_SECRET)');
  }
  return settings;
}

/** Recursively sorts object keys, as NOWPayments does before signing IPN payloads. */
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((sorted, key) => ({ ...sorted, [key]: sortKeys(value[key]) }), {});
  }
  return value;
}

function signPayload(body, secret) {
  return crypto.createHmac('sha512', secret).update(JSON.stringify(sortKeys(body))).digest('hex');
}

/** Creates a hosted invoice for `order` and returns where to send the buyer. */
async function createPayment(order, { successUrl, cancelUrl, webhookUrl }) {
  const { apiKey, apiUrl } = config();

  const response = await fetch(`${apiUrl}/invoice`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price_amount: order.total,
      price_currency: order.currency.toLowerCase(),
      order_id: order.id,
      order_description: `CHTH order ${order.id.slice(0, 8).toUpperCase()}`,
      ipn_callback_url: webhookUrl,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.invoice_url) {
    console.error('NOWPayments invoice error:', response.status, data);
    throw new HttpError(502, 'Could not create the crypto invoice. Please try again.');
  }

  return { paymentId: String(data.id), paymentUrl: data.invoice_url };
}

/** Verifies an IPN request and turns it into a payment update. */
function parseWebhook(req) {
  const { ipnSecret } = config();
  const signature = String(req.get('x-nowpayments-sig') || '');
  const expected = signPayload(req.body, ipnSecret);

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new HttpError(401, 'Invalid payment signature');
  }

  const body = req.body;
  const status = STATUS_MAP[body.payment_status];
  if (!status) throw new HttpError(400, `Unknown payment status: ${body.payment_status}`);

  return {
    orderId: String(body.order_id || ''),
    status,
    paidAmount: Number(body.price_amount),
    paidCurrency: String(body.price_currency || '').toUpperCase(),
    payCurrency: body.pay_currency ? String(body.pay_currency).toUpperCase() : null,
  };
}

module.exports = { name: 'nowpayments', createPayment, parseWebhook, signPayload };
