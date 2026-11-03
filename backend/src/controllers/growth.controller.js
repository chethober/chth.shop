// Reviews, wishlist, store follows and referrals.

const crypto = require('crypto');
const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { productWithStore } = require('../lib/queries');
const { roundCurrency, serializeProduct } = require('../lib/serializers');

/* ---------- Reviews (verified buyers only) ---------- */

async function refreshRating(productId) {
  const { _avg, _count } = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { ratingAvg: Math.round((_avg.rating || 0) * 10) / 10, ratingCount: _count._all },
  });
}

const listReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: String(req.params.id) },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Tell the viewer whether they can review: they bought it, in a paid order.
  let canReview = false;
  if (req.userId) {
    canReview = Boolean(
      await prisma.orderItem.findFirst({
        where: { productId: String(req.params.id), order: { userId: req.userId, paymentStatus: 'PAID' } },
        select: { id: true },
      })
    );
  }

  sendSuccess(res, {
    data: {
      canReview,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        body: review.body,
        username: review.user.username,
        isMine: review.userId === req.userId,
        createdAt: review.createdAt,
      })),
    },
  });
});

const upsertReview = asyncHandler(async (req, res) => {
  const productId = String(req.params.id);
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Rating must be 1 to 5 stars');
  const body = req.body.body ? String(req.body.body).trim().slice(0, 2000) : null;

  const bought = await prisma.orderItem.findFirst({
    where: { productId, order: { userId: req.userId, paymentStatus: 'PAID' } },
    select: { id: true },
  });
  if (!bought) throw new HttpError(403, 'Only buyers of this product can review it');

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: req.userId, productId } },
    create: { userId: req.userId, productId, rating, body },
    update: { rating, body },
  });
  await refreshRating(productId);

  sendSuccess(res, { message: 'Review saved', data: { review } });
});

const deleteReview = asyncHandler(async (req, res) => {
  const productId = String(req.params.id);
  await prisma.review.deleteMany({ where: { userId: req.userId, productId } });
  await refreshRating(productId);
  sendSuccess(res, { message: 'Review deleted' });
});

/* ---------- Wishlist ---------- */

const listWishlist = asyncHandler(async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.userId },
    include: { product: { include: productWithStore } },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, {
    data: {
      products: favorites.map((favorite) => serializeProduct(favorite.product)).filter((product) => product.isActive),
      ids: favorites.map((favorite) => favorite.productId),
    },
  });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const productId = String(req.params.productId);
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw new HttpError(404, 'Product not found');
  await prisma.favorite.upsert({
    where: { userId_productId: { userId: req.userId, productId } },
    create: { userId: req.userId, productId },
    update: {},
  });
  sendSuccess(res, { message: 'Saved' });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  await prisma.favorite.deleteMany({ where: { userId: req.userId, productId: String(req.params.productId) } });
  sendSuccess(res, { message: 'Removed' });
});

/* ---------- Follows ---------- */

async function storeByUsername(username) {
  const store = await prisma.store.findFirst({ where: { user: { username: String(username) } } });
  if (!store) throw new HttpError(404, 'Store not found');
  return store;
}

const followStore = asyncHandler(async (req, res) => {
  const store = await storeByUsername(req.params.username);
  if (store.userId === req.userId) throw new HttpError(400, "You can't follow your own store");
  await prisma.follow.upsert({
    where: { userId_storeId: { userId: req.userId, storeId: store.id } },
    create: { userId: req.userId, storeId: store.id },
    update: {},
  });
  sendSuccess(res, { data: { followerCount: await prisma.follow.count({ where: { storeId: store.id } }) } });
});

const unfollowStore = asyncHandler(async (req, res) => {
  const store = await storeByUsername(req.params.username);
  await prisma.follow.deleteMany({ where: { userId: req.userId, storeId: store.id } });
  sendSuccess(res, { data: { followerCount: await prisma.follow.count({ where: { storeId: store.id } }) } });
});

const listFollowing = asyncHandler(async (req, res) => {
  const follows = await prisma.follow.findMany({
    where: { userId: req.userId },
    include: { store: { include: { user: { select: { username: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, {
    data: {
      stores: follows.map(({ store }) => ({ id: store.id, kind: store.kind, storeName: store.storeName, username: store.user.username })),
    },
  });
});

/* ---------- Referrals ---------- */

async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `${user.username.replace(/[^a-z0-9]/gi, '').slice(0, 8)}${crypto.randomBytes(2).toString('hex')}`.toUpperCase();
    try {
      await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } });
      return code;
    } catch (error) {
      if (error.code !== 'P2002') throw error;
    }
  }
  throw new HttpError(500, 'Could not create a referral code');
}

const getMyReferrals = asyncHandler(async (req, res) => {
  const code = await ensureReferralCode(req.user);
  const [invited, rewards, referredBy] = await Promise.all([
    prisma.user.count({ where: { referredById: req.userId } }),
    prisma.referralReward.aggregate({ where: { userId: req.userId }, _sum: { amount: true }, _count: { _all: true } }),
    req.user.referredById
      ? prisma.user.findUnique({ where: { id: req.user.referredById }, select: { username: true } })
      : null,
  ]);
  const paidOrders = await prisma.order.count({ where: { userId: req.userId, paymentStatus: 'PAID' } });

  sendSuccess(res, {
    data: {
      code,
      invited,
      converted: rewards._count._all,
      earned: roundCurrency(rewards._sum.amount || 0),
      discountPercent: env.referral.discountPercent,
      rewardPercent: env.referral.rewardPercent,
      referredBy: referredBy?.username ?? null,
      /** The current user still gets the welcome discount on their next order. */
      hasWelcomeDiscount: Boolean(req.user.referredById) && paidOrders === 0,
    },
  });
});

/** Attaches a referral code to a new customer (before their first paid order). */
const claimReferral = asyncHandler(async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  if (!code) throw new HttpError(400, 'Referral code is required');
  if (req.user.referredById) throw new HttpError(409, 'You already used a referral code');

  const referrer = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true, username: true } });
  if (!referrer) throw new HttpError(404, 'Unknown referral code');
  if (referrer.id === req.userId) throw new HttpError(400, "You can't refer yourself");

  const paidOrders = await prisma.order.count({ where: { userId: req.userId, paymentStatus: 'PAID' } });
  if (paidOrders > 0) throw new HttpError(409, 'Referral codes are for new customers');

  await prisma.user.update({ where: { id: req.userId }, data: { referredById: referrer.id } });
  sendSuccess(res, {
    message: `Invited by @${referrer.username}: ${env.referral.discountPercent}% off your first order`,
    data: { referredBy: referrer.username, discountPercent: env.referral.discountPercent },
  });
});

module.exports = {
  listReviews,
  upsertReview,
  deleteReview,
  listWishlist,
  addToWishlist,
  removeFromWishlist,
  followStore,
  unfollowStore,
  listFollowing,
  getMyReferrals,
  claimReferral,
};
