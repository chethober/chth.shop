// Development-only payment provider: sends the buyer to a frontend page with a
// "simulate payment" button instead of a real crypto checkout. Refused in production (see env.js).

const { HttpError } = require('../../lib/http');

async function createPayment(order, { frontendOrigin }) {
  return {
    paymentId: `mock_${order.id}`,
    paymentUrl: `${frontendOrigin}/checkout/mock?order=${encodeURIComponent(order.id)}`,
  };
}

function parseWebhook() {
  throw new HttpError(404, 'The mock provider has no webhook');
}

module.exports = { name: 'mock', createPayment, parseWebhook };
