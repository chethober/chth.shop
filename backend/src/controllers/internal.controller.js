const prisma = require('../lib/prisma');
const env = require('../config/env');

const OPEN = ['PENDING', 'CONFIRMED', 'SHIPPED'];
// Where each status can go next from the admin bot's buttons.
const NEXT = {
  PENDING: ['CONFIRMED', 'SHIPPED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const summary = (order) => ({
  id: order.id,
  status: order.status,
  total: order.total,
  currency: env.hub.currency,
  items: order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : undefined,
  customer: order.user ? order.user.username : undefined,
  createdAt: order.createdAt,
});

/** GET /api/internal/stats: what the hub's 🛍 Shop screen shows. */
async function stats(req, res, next) {
  try {
    const monthAgo = new Date(Date.now() - 30 * 86400_000);
    const weekAgo = new Date(Date.now() - 7 * 86400_000);
    const [users, newUsers7d, artists, products, byStatus, revenue, open] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.store.count(),
      prisma.product.count(),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: monthAgo }, status: { not: 'CANCELLED' } } }),
      prisma.order.findMany({
        where: { status: { in: OPEN } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: true, user: { select: { username: true } } },
      }),
    ]);
    res.json({
      users,
      newUsers7d,
      artists,
      products,
      orders: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      revenue30d: Math.round((revenue._sum.total || 0) * 100) / 100,
      currency: env.hub.currency,
      openOrders: open.map(summary),
    });
  } catch (error) {
    next(error);
  }
}

/** POST /api/internal/orders/status { id, status }: a button pressed in the admin bot. */
async function setOrderStatus(req, res, next) {
  try {
    const { id, status } = req.hubBody || {};
    const order = await prisma.order.findUnique({ where: { id: String(id || '') } });
    if (!order) return res.status(404).json({ ok: false, error: 'order not found' });
    if (order.status !== status && !(NEXT[order.status] || []).includes(status)) {
      return res.status(409).json({ ok: false, error: `can't go from ${order.status} to ${status}` });
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: { items: true, user: { select: { username: true } } },
    });
    res.json({ ok: true, order: summary(updated) });
  } catch (error) {
    next(error);
  }
}

module.exports = { stats, setOrderStatus, summary };
