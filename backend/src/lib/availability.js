// Whether a listing can be bought right now: drop windows and limited-edition stock.

const { HttpError } = require('./http');

function dropStatus(product, now = new Date()) {
  if (product.dropStartsAt && product.dropStartsAt > now) return 'upcoming';
  if (product.dropEndsAt && product.dropEndsAt <= now) return 'ended';
  if (product.dropStartsAt || product.dropEndsAt) return 'live';
  return null;
}

function editionsRemaining(product) {
  return product.editionSize ? Math.max(product.editionSize - product.editionsSold, 0) : null;
}

/** Throws a 409 explaining why `quantity` units of `product` can't be bought now. */
function assertPurchasable(product, quantity = 1, now = new Date()) {
  const status = dropStatus(product, now);
  if (status === 'upcoming') {
    throw new HttpError(409, `"${product.name}" drops on ${product.dropStartsAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`);
  }
  if (status === 'ended') throw new HttpError(409, `The "${product.name}" drop has ended`);

  const remaining = editionsRemaining(product);
  if (remaining !== null && quantity > remaining) {
    throw new HttpError(409, remaining === 0 ? `"${product.name}" is sold out` : `Only ${remaining} of "${product.name}" left`);
  }
}

module.exports = { dropStatus, editionsRemaining, assertPurchasable };
