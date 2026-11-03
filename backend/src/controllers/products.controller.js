const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { productWithStore } = require('../lib/queries');
const { serializeProduct } = require('../lib/serializers');
const { CATALOG, getCatalogItem } = require('../lib/catalog');
const { normalizeDesign, isAllowedImageUrl } = require('../lib/options');

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const STORE_KINDS = ['ARTIST', 'MERCHANT'];

const SORT_ORDERS = {
  newest: { createdAt: 'desc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  name: { name: 'asc' },
  top: [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }],
};

function parseDate(value, label) {
  if (value === null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, `${label} must be a date`);
  return date;
}

/** Loads a product the current user is allowed to modify. */
async function findOwnedProduct(userId, productId) {
  const store = await prisma.store.findUnique({ where: { userId } });
  if (!store) throw new HttpError(403, 'Only sellers can manage products');

  const product = await prisma.product.findUnique({ where: { id: String(productId) } });
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.storeId !== store.id) {
    throw new HttpError(403, 'You are not authorized to modify this product');
  }
  return product;
}

/**
 * Validates the editable product fields present in `body` against the catalog.
 * `type` is the product's (current or new) base product.
 */
function productFields(body, type) {
  const catalogItem = getCatalogItem(type);
  if (!catalogItem) throw new HttpError(400, `Unknown product type: ${type}`);

  const data = { type };

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) throw new HttpError(400, 'Name is required');
    data.name = name.slice(0, 120);
  }
  if (body.description !== undefined) {
    data.description = body.description ? String(body.description).slice(0, 2000) : null;
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price)) throw new HttpError(400, 'Price must be a number');
    if (price < catalogItem.baseCost) {
      throw new HttpError(400, `Price must be at least the production cost ($${catalogItem.baseCost})`);
    }
    data.price = Math.round(price * 100) / 100;
  }
  if (body.imageUrl !== undefined) {
    const url = body.imageUrl ? String(body.imageUrl) : null;
    // Uploaded files, https URLs, or the stock images bundled with the frontend.
    if (url && !isAllowedImageUrl(url) && !/^\/[\w-]+\.(png|jpe?g|webp|svg)$/.test(url)) {
      throw new HttpError(400, 'Invalid image URL');
    }
    data.imageUrl = url;
  }
  if (body.sizes !== undefined) {
    const sizes = Array.isArray(body.sizes) ? body.sizes.map(String) : [];
    if (sizes.some((size) => !catalogItem.sizes.includes(size))) {
      throw new HttpError(400, `Sizes must be from: ${catalogItem.sizes.join(', ')}`);
    }
    data.sizes = [...new Set(sizes)];
  }
  if (body.colors !== undefined) {
    const colors = Array.isArray(body.colors) ? body.colors.map((c) => String(c).toUpperCase()) : [];
    if (colors.some((color) => !HEX_COLOR.test(color))) throw new HttpError(400, 'Colors must be hex values');
    data.colors = [...new Set(colors)].slice(0, 12);
  }
  if (body.customizable !== undefined) {
    data.customizable = Boolean(body.customizable) && catalogItem.customizable;
  }
  if (body.design !== undefined) data.design = normalizeDesign(body.design);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.nftBacked !== undefined) data.nftBacked = Boolean(body.nftBacked);
  if (body.editionSize !== undefined) {
    if (body.editionSize === null || body.editionSize === '') {
      data.editionSize = null;
    } else {
      const size = Number(body.editionSize);
      if (!Number.isInteger(size) || size < 1 || size > 100000) throw new HttpError(400, 'Edition size must be a whole number from 1 to 100000');
      data.editionSize = size;
    }
  }
  if (body.dropStartsAt !== undefined) data.dropStartsAt = parseDate(body.dropStartsAt, 'Drop start');
  if (body.dropEndsAt !== undefined) data.dropEndsAt = parseDate(body.dropEndsAt, 'Drop end');

  return data;
}

const getCatalog = (req, res) => {
  sendSuccess(res, { data: { catalog: CATALOG } });
};

const listProducts = asyncHandler(async (req, res) => {
  const { type, store, kind, search, collection } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;
  const orderBy = SORT_ORDERS[req.query.sort] || SORT_ORDERS.newest;

  const storeFilter = {
    ...(store && { user: { username: String(store) } }),
    ...(STORE_KINDS.includes(kind) && { kind }),
  };
  if (req.query.following === '1') {
    if (!req.userId) throw new HttpError(401, 'Sign in to see stores you follow');
    storeFilter.followers = { some: { userId: req.userId } };
  }
  const now = new Date();
  const where = {
    isActive: true,
    ...(type && { type: String(type) }),
    ...(Object.keys(storeFilter).length > 0 && { store: storeFilter }),
    // Drops: limited editions, NFT-backed items and timed releases that haven't ended.
    ...(collection === 'drops' && {
      AND: [
        { OR: [{ editionSize: { not: null } }, { nftBacked: true }, { dropStartsAt: { not: null } }, { dropEndsAt: { not: null } }] },
        { OR: [{ dropEndsAt: null }, { dropEndsAt: { gt: now } }] },
      ],
    }),
    ...(search && {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { store: { storeName: { contains: String(search), mode: 'insensitive' } } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, include: productWithStore, orderBy, skip, take: limit }),
    prisma.product.count({ where }),
  ]);

  sendSuccess(res, {
    data: {
      products: products.map(serializeProduct),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
        hasNext: skip + products.length < total,
        hasPrev: page > 1,
      },
    },
  });
});

const listMyProducts = asyncHandler(async (req, res) => {
  const store = await prisma.store.findUnique({ where: { userId: req.userId } });
  if (!store) return sendSuccess(res, { data: { products: [] } });

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    include: productWithStore,
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { data: { products: products.map(serializeProduct) } });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: String(req.params.id) },
    include: { store: { include: { user: { select: { id: true, username: true } } } } },
  });
  const isOwner = Boolean(product && req.userId && product.store.user.id === req.userId);
  if (!product || (!product.isActive && !isOwner)) throw new HttpError(404, 'Product not found');

  sendSuccess(res, { data: { product: serializeProduct(product) } });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, type, price } = req.body;
  if (!name || !type || price === undefined) {
    throw new HttpError(400, 'Name, type, and price are required');
  }

  const store = await prisma.store.findUnique({ where: { userId: req.userId } });
  if (!store) throw new HttpError(403, 'Only sellers can create products');

  const fields = productFields(req.body, String(type));
  if (fields.dropStartsAt && fields.dropEndsAt && fields.dropEndsAt <= fields.dropStartsAt) {
    throw new HttpError(400, 'The drop must end after it starts');
  }
  const product = await prisma.product.create({
    data: { ...fields, storeId: store.id },
    include: productWithStore,
  });

  sendSuccess(res, { status: 201, message: 'Product created', data: { product: serializeProduct(product) } });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await findOwnedProduct(req.userId, req.params.id);
  const type = req.body.type !== undefined ? String(req.body.type) : product.type;
  const data = productFields(req.body, type);

  if (data.editionSize !== undefined && data.editionSize !== null && data.editionSize < product.editionsSold) {
    throw new HttpError(400, `${product.editionsSold} are already sold; the edition can't be smaller`);
  }
  const startsAt = data.dropStartsAt !== undefined ? data.dropStartsAt : product.dropStartsAt;
  const endsAt = data.dropEndsAt !== undefined ? data.dropEndsAt : product.dropEndsAt;
  if (startsAt && endsAt && endsAt <= startsAt) throw new HttpError(400, 'The drop must end after it starts');

  // Changing the base product must keep the price above its production cost.
  if (type !== product.type && data.price === undefined && product.price < getCatalogItem(type).baseCost) {
    throw new HttpError(400, `Price must be at least the production cost ($${getCatalogItem(type).baseCost})`);
  }
  // Sizes chosen for the old base product may not exist on the new one.
  if (type !== product.type && data.sizes === undefined) data.sizes = [];

  const updated = await prisma.product.update({
    where: { id: product.id },
    data,
    include: productWithStore,
  });

  sendSuccess(res, { message: 'Product updated', data: { product: serializeProduct(updated) } });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await findOwnedProduct(req.userId, req.params.id);
  await prisma.product.delete({ where: { id: product.id } });

  sendSuccess(res, { message: 'Product deleted' });
});

module.exports = {
  getCatalog,
  listProducts,
  listMyProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
