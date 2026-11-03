const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { orderWithItems } = require('../lib/queries');
const { serializeOrder } = require('../lib/serializers');
const { onOrderStatusChanged } = require('../services/order-events');
const { releaseEditions } = require('./orders.controller');

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

/** All orders across the marketplace, for fulfillment. */
const listOrders = asyncHandler(async (req, res) => {
  const status = ORDER_STATUSES.includes(req.query.status) ? req.query.status : undefined;
  const orders = await prisma.order.findMany({
    where: { ...(status && { status }) },
    include: { ...orderWithItems, user: { select: { username: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  sendSuccess(res, {
    data: { orders: orders.map((order) => ({ ...serializeOrder(order), customer: order.user })) },
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid order status');

  const order = await prisma.order.findUnique({ where: { id: String(req.params.orderId) } });
  if (!order) throw new HttpError(404, 'Order not found');
  if (['SHIPPED', 'DELIVERED'].includes(status) && order.paymentStatus !== 'PAID') {
    throw new HttpError(400, 'Only paid orders can be shipped');
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Cancelling an unpaid order frees its limited-edition units.
    if (status === 'CANCELLED' && order.status !== 'CANCELLED' && order.paymentStatus !== 'PAID') {
      await releaseEditions(tx, order.id);
    }
    return tx.order.update({ where: { id: order.id }, data: { status }, include: orderWithItems });
  });
  if (status !== order.status) onOrderStatusChanged(updated).catch((error) => console.error('Status notify failed:', error));

  sendSuccess(res, { message: 'Order updated', data: { order: serializeOrder(updated) } });
});

module.exports = { listOrders, updateOrderStatus };
