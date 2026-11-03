const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { orderWithItems, cartWithItems } = require('../lib/queries');
const { getCatalogItem } = require('../lib/catalog');
const { frontendOrigin } = require('../lib/origin');
const { roundCurrency, serializeOrder, cartItemUnitPrice, cartItemName } = require('../lib/serializers');
const payments = require('../services/payments');
const { assertPurchasable } = require('../lib/availability');
const { notifyOrderPlacedInBackground } = require('../services/telegram-notify.service');
const { track } = require('../services/hub.service');
const { summary } = require('./internal.controller');

/** What the seller keeps from one line: the margin over production cost, minus the platform fee. */
function sellerEarning(price, baseCost, quantity) {
  const margin = Math.max(price - baseCost, 0) * quantity;
  return roundCurrency(margin * (1 - env.platformFeePercent / 100));
}

/** Turns the user's cart into priced order lines, snapshotting names and costs. */
async function cartToOrderLines(userId) {
  const cart = await prisma.cart.findUnique({ where: { userId }, include: cartWithItems });
  if (!cart || cart.items.length === 0) throw new HttpError(400, 'Cart is empty');

  const lines = cart.items.map((item) => {
    if (item.productId && (!item.product || !item.product.isActive)) {
      throw new HttpError(409, `"${cartItemName(item)}" is no longer available - please remove it from your cart`);
    }
    if (item.product) assertPurchasable(item.product, item.quantity);
    const catalogItem = getCatalogItem(item.type);
    const price = cartItemUnitPrice(item);
    const baseCost = catalogItem ? catalogItem.baseCost : 0;
    const storeId = item.product ? item.product.storeId : null;

    return {
      productId: item.productId,
      storeId,
      type: item.type,
      name: cartItemName(item),
      // Snapshot what to print: the buyer's design, else the listing's (it may be edited or deleted later).
      options: {
        ...(item.options || {}),
        ...(!item.options?.design && item.product?.design && { sellerDesign: item.product.design }),
      },
      quantity: item.quantity,
      price,
      baseCost,
      // The platform keeps the whole margin on buyers' own designs (no seller involved).
      sellerEarning: storeId ? sellerEarning(price, baseCost, item.quantity) : 0,
    };
  });
  return { lines, cartId: cart.id };
}

async function findOwnedOrder(userId, orderId) {
  const order = await prisma.order.findFirst({ where: { id: String(orderId), userId } });
  if (!order) throw new HttpError(404, 'Order not found');
  return order;
}

const createOrder = asyncHandler(async (req, res) => {
  const shippingAddress = String(req.body.shippingAddress || '').trim();
  if (!shippingAddress) throw new HttpError(400, 'Shipping address is required');

  const { lines, cartId } = await cartToOrderLines(req.userId);
  const subtotal = roundCurrency(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));

  // Referred customers get a welcome discount on their first paid order (the platform absorbs it).
  let discount = 0;
  if (req.user.referredById) {
    const paidOrders = await prisma.order.count({ where: { userId: req.userId, paymentStatus: 'PAID' } });
    if (paidOrders === 0) discount = roundCurrency(subtotal * (env.referral.discountPercent / 100));
  }
  const total = roundCurrency(subtotal - discount);

  const order = await prisma.$transaction(async (tx) => {
    // Reserve limited-edition stock atomically, so two buyers can't get the last unit.
    for (const line of lines) {
      if (!line.productId) continue;
      const reserved = await tx.$executeRaw`
        UPDATE "products" SET "editionsSold" = "editionsSold" + ${line.quantity}
        WHERE "id" = ${line.productId}
          AND ("editionSize" IS NULL OR "editionsSold" + ${line.quantity} <= "editionSize")`;
      if (reserved === 0) throw new HttpError(409, `"${line.name}" just sold out`);
    }

    const created = await tx.order.create({
      data: {
        userId: req.userId,
        subtotal,
        discount,
        total,
        currency: 'USD',
        shippingAddress: shippingAddress.slice(0, 1000),
        status: 'PENDING',
        items: { create: lines },
      },
      include: orderWithItems,
    });
    await tx.cartItem.deleteMany({ where: { cartId } });
    return created;
  });
  track('order.created', summary(order), req.userId);

  notifyOrderPlacedInBackground(order.id);

  sendSuccess(res, {
    status: 201,
    message: 'Order created',
    data: { order: serializeOrder(order) },
  });
});

/**
 * Starts paying an order: `{ method: 'hosted' }` returns a checkout URL, `{ method: 'ton' }` a
 * TON Connect transaction request.
 */
const payOrder = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.userId, req.params.orderId);
  const method = ['ton', 'usdt'].includes(req.body?.method) ? req.body.method : 'hosted';
  const payment = await payments.startPayment(order, {
    frontendOrigin: frontendOrigin(req),
    method,
    walletAddress: req.body?.walletAddress,
  });

  sendSuccess(res, { data: payment });
});

/** Checks the chain for this order's TON payment right away (the poller also does this). */
const checkTonPayment = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.userId, req.params.orderId);
  if (['ton', 'ton-usdt'].includes(order.paymentProvider) && order.paymentStatus === 'WAITING') {
    await payments.reconcileTonPayments([order]);
  }
  const updated = await prisma.order.findUnique({ where: { id: order.id }, include: orderWithItems });
  sendSuccess(res, { data: { order: serializeOrder(updated) } });
});

/** Gives limited-edition stock back when an unpaid order is cancelled. */
async function releaseEditions(tx, orderId) {
  const items = await tx.orderItem.findMany({ where: { orderId, productId: { not: null } } });
  for (const item of items) {
    await tx.$executeRaw`
      UPDATE "products" SET "editionsSold" = GREATEST("editionsSold" - ${item.quantity}, 0)
      WHERE "id" = ${item.productId}`;
  }
}

const listOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId },
    include: orderWithItems,
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { data: { orders: orders.map(serializeOrder) } });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: String(req.params.orderId), userId: req.userId },
    include: orderWithItems,
  });
  if (!order) throw new HttpError(404, 'Order not found');

  sendSuccess(res, { data: { order: serializeOrder(order) } });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.userId, req.params.orderId);
  if (order.status !== 'PENDING') {
    throw new HttpError(400, `Order cannot be cancelled because it is already ${order.status.toLowerCase()}`);
  }
  if (['PAID', 'CONFIRMING', 'PARTIALLY_PAID'].includes(order.paymentStatus)) {
    throw new HttpError(400, 'A payment is already in progress for this order - contact support to cancel');
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    await releaseEditions(tx, order.id);
    return tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' }, include: orderWithItems });
  });

  sendSuccess(res, {
    message: 'Order cancelled',
    data: { order: serializeOrder(cancelled) },
  });
});

module.exports = { createOrder, payOrder, checkTonPayment, listOrders, getOrder, cancelOrder, releaseEditions };
