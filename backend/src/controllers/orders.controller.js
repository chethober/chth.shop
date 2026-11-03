const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { orderWithItems, cartWithItems } = require('../lib/queries');
const { getCatalogItem } = require('../lib/catalog');
const { frontendOrigin } = require('../lib/origin');
const { roundCurrency, serializeOrder, cartItemUnitPrice, cartItemName } = require('../lib/serializers');
const payments = require('../services/payments');

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
  const total = roundCurrency(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: req.userId,
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

  sendSuccess(res, {
    status: 201,
    message: 'Order created',
    data: { order: serializeOrder(order) },
  });
});

/** Creates (or reuses) the crypto invoice for an order and returns its payment URL. */
const payOrder = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.userId, req.params.orderId);
  const updated = await payments.startPayment(order, { frontendOrigin: frontendOrigin(req) });

  sendSuccess(res, { data: { paymentUrl: updated.paymentUrl, provider: updated.paymentProvider } });
});

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

  const cancelled = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' },
    include: orderWithItems,
  });

  sendSuccess(res, {
    message: 'Order cancelled',
    data: { order: serializeOrder(cancelled) },
  });
});

module.exports = { createOrder, payOrder, listOrders, getOrder, cancelOrder };
