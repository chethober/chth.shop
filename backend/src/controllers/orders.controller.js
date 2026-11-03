const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { orderWithItems } = require('../lib/queries');
const { roundCurrency, serializeOrder } = require('../lib/serializers');
const { notifyOrderPlacedInBackground } = require('../services/telegram-notify.service');

/** Turns the user's cart into order lines, pricing each item at its current price. */
async function cartToOrderLines(userId) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) throw new HttpError(400, 'Cart is empty');

  const lines = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.product ? item.product.price : 0,
  }));
  return { lines, cartId: cart.id };
}

async function findOwnedOrder(userId, orderId) {
  const order = await prisma.order.findFirst({ where: { id: String(orderId), userId } });
  if (!order) throw new HttpError(404, 'Order not found');
  return order;
}

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;
  if (!shippingAddress) throw new HttpError(400, 'Shipping address is required');

  const { lines, cartId } = await cartToOrderLines(req.userId);
  const total = roundCurrency(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: req.userId,
        total,
        shippingAddress,
        status: 'PENDING',
        items: { create: lines },
      },
      include: orderWithItems,
    });
    await tx.cartItem.deleteMany({ where: { cartId } });
    return created;
  });

  notifyOrderPlacedInBackground(order.id);

  sendSuccess(res, {
    status: 201,
    message: 'Order created successfully',
    data: { order: serializeOrder(order) },
  });
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
    throw new HttpError(
      400,
      `Order cannot be cancelled because it is already ${order.status.toLowerCase()}`
    );
  }

  const cancelled = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' },
    include: orderWithItems,
  });

  sendSuccess(res, {
    message: 'Order cancelled successfully',
    data: { order: serializeOrder(cancelled) },
  });
});

module.exports = { createOrder, listOrders, getOrder, cancelOrder };
