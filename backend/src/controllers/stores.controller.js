const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { storeWithUser } = require('../lib/queries');
const { roundCurrency, serializeProduct } = require('../lib/serializers');

const STORE_KINDS = ['ARTIST', 'MERCHANT'];

const PROFILE_FIELDS = [
  'bio',
  'storeName',
  'instagram',
  'twitter',
  'tiktok',
  'youtube',
  'spotify',
  'telegram',
  'discord',
  'website',
  'payoutAddress',
  'payoutNetwork',
];

/** Picks the editable fields present in `body`, validating the store kind. */
function pickProfileFields(body) {
  const fields = Object.fromEntries(
    PROFILE_FIELDS.filter((field) => body[field] !== undefined).map((field) => [
      field,
      body[field] === null ? null : String(body[field]).trim().slice(0, 500),
    ])
  );
  if (body.kind !== undefined) {
    if (!STORE_KINDS.includes(body.kind)) throw new HttpError(400, 'Store kind must be ARTIST or MERCHANT');
    fields.kind = body.kind;
  }
  return fields;
}

/** Public view of a store: payout details stay private. */
function publicStore(store) {
  const { payoutAddress, payoutNetwork, ...rest } = store;
  return { ...rest, products: store.products ? store.products.map(serializeProduct) : undefined };
}

const listStores = asyncHandler(async (req, res) => {
  const kind = STORE_KINDS.includes(req.query.kind) ? req.query.kind : undefined;
  const stores = await prisma.store.findMany({
    where: { ...(kind && { kind }) },
    include: {
      user: { select: { username: true } },
      products: { where: { isActive: true }, take: 3, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { data: { stores: stores.map(publicStore) } });
});

const getStoreByUsername = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    include: {
      store: {
        include: {
          user: { select: { username: true } },
          products: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });
  if (!user || !user.store) throw new HttpError(404, 'Store not found');

  const [followerCount, following] = await Promise.all([
    prisma.follow.count({ where: { storeId: user.store.id } }),
    req.userId
      ? prisma.follow.findUnique({ where: { userId_storeId: { userId: req.userId, storeId: user.store.id } } })
      : null,
  ]);

  sendSuccess(res, {
    data: { store: { ...publicStore(user.store), followerCount, isFollowing: Boolean(following) } },
  });
});

const getMyStore = asyncHandler(async (req, res) => {
  const store = await prisma.store.findUnique({ where: { userId: req.userId }, ...storeWithUser });
  if (!store) throw new HttpError(404, 'Store not found');

  sendSuccess(res, { data: { store } });
});

const createStore = asyncHandler(async (req, res) => {
  const existing = await prisma.store.findUnique({ where: { userId: req.userId } });
  if (existing) throw new HttpError(400, 'You already have a store');
  if (!req.body.storeName) throw new HttpError(400, 'Store name is required');

  const [store] = await prisma.$transaction([
    prisma.store.create({
      data: { userId: req.userId, ...pickProfileFields(req.body) },
      ...storeWithUser,
    }),
    prisma.user.update({ where: { id: req.userId }, data: { isSeller: true } }),
  ]);

  sendSuccess(res, { status: 201, message: 'Store created', data: { store } });
});

const updateStore = asyncHandler(async (req, res) => {
  const existing = await prisma.store.findUnique({ where: { userId: req.userId } });
  if (!existing) throw new HttpError(404, 'Store not found');

  const store = await prisma.store.update({
    where: { userId: req.userId },
    data: pickProfileFields(req.body),
    ...storeWithUser,
  });

  sendSuccess(res, { message: 'Store updated', data: { store } });
});

const deleteStore = asyncHandler(async (req, res) => {
  const store = await prisma.store.findUnique({ where: { userId: req.userId } });
  if (!store) throw new HttpError(404, 'Store not found');

  await prisma.$transaction([
    prisma.store.delete({ where: { id: store.id } }),
    prisma.user.update({ where: { id: req.userId }, data: { isSeller: false } }),
  ]);

  sendSuccess(res, { message: 'Store deleted' });
});

/** Accepts the seller agreement, creating a default store (artist or merchant) if needed. */
const acceptContract = asyncHandler(async (req, res) => {
  const kind = STORE_KINDS.includes(req.body?.kind) ? req.body.kind : 'ARTIST';

  const store = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: req.userId }, data: { isSeller: true } });
    const existing = await tx.store.findUnique({ where: { userId: req.userId }, ...storeWithUser });
    if (existing) return existing;

    return tx.store.create({
      data: {
        userId: req.userId,
        kind,
        storeName: `${user.username}'s Store`,
        bio: kind === 'MERCHANT' ? 'CHTH Merchant' : 'CHTH Artist',
      },
      ...storeWithUser,
    });
  });

  sendSuccess(res, { message: 'Contract accepted', data: { store } });
});

/** Items sold by the current seller in paid orders, with earnings totals. */
const getMySales = asyncHandler(async (req, res) => {
  const store = await prisma.store.findUnique({ where: { userId: req.userId } });
  if (!store) throw new HttpError(404, 'Store not found');

  const items = await prisma.orderItem.findMany({
    where: { storeId: store.id, order: { paymentStatus: 'PAID', status: { not: 'CANCELLED' } } },
    include: { order: { select: { id: true, status: true, paidAt: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const summary = items.reduce(
    (totals, item) => ({
      unitsSold: totals.unitsSold + item.quantity,
      revenue: totals.revenue + item.price * item.quantity,
      earnings: totals.earnings + item.sellerEarning,
    }),
    { unitsSold: 0, revenue: 0, earnings: 0 }
  );

  sendSuccess(res, {
    data: {
      summary: {
        unitsSold: summary.unitsSold,
        revenue: roundCurrency(summary.revenue),
        earnings: roundCurrency(summary.earnings),
      },
      sales: items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        orderStatus: item.order.status,
        paidAt: item.order.paidAt,
        name: item.name,
        type: item.type,
        options: { size: item.options?.size, color: item.options?.color },
        quantity: item.quantity,
        price: item.price,
        earning: item.sellerEarning,
      })),
    },
  });
});

module.exports = {
  listStores,
  getStoreByUsername,
  getMyStore,
  createStore,
  updateStore,
  deleteStore,
  acceptContract,
  getMySales,
};
