const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { cartWithItems, cartItemWithProduct } = require('../lib/queries');
const { serializeCart, serializeCartItem } = require('../lib/serializers');
const { getCatalogItem } = require('../lib/catalog');
const { normalizeOptions, optionsKey } = require('../lib/options');

const MAX_QUANTITY = 99;

function parseQuantity(value, message) {
  const quantity = parseInt(value, 10);
  if (Number.isNaN(quantity) || quantity < 1 || quantity > MAX_QUANTITY) throw new HttpError(400, message);
  return quantity;
}

/** Finds a cart item that belongs to the current user. */
async function findOwnedCartItem(userId, itemId) {
  const item = await prisma.cartItem.findFirst({
    where: { id: String(itemId), cart: { userId } },
  });
  if (!item) throw new HttpError(404, 'Cart item not found');
  return item;
}

/**
 * Works out what is being added: a store listing (`productId`) or the buyer's own
 * design on a catalog blank (`type` + `options.design`). Returns the validated line.
 */
async function resolveLine({ productId, type, options }) {
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: String(productId) } });
    if (!product || !product.isActive) throw new HttpError(404, 'Product not found');
    const catalogItem = getCatalogItem(product.type);
    const normalized = normalizeOptions(options, {
      sizes: product.sizes.length > 0 ? product.sizes : catalogItem?.sizes ?? [],
      colors: product.colors.length > 0 ? product.colors : catalogItem?.colors ?? [],
      customizable: product.customizable,
    });
    return { productId: product.id, type: product.type, options: normalized };
  }

  const catalogItem = getCatalogItem(type);
  if (!catalogItem) throw new HttpError(400, 'Product ID or a valid product type is required');
  if (!options || !options.design) throw new HttpError(400, 'A design is required for custom products');

  const normalized = normalizeOptions(options, {
    sizes: catalogItem.sizes,
    colors: catalogItem.colors,
    customizable: catalogItem.customizable,
  });
  return { productId: null, type: catalogItem.type, options: normalized };
}

const getCart = asyncHandler(async (req, res) => {
  const cart = await prisma.cart.upsert({
    where: { userId: req.userId },
    create: { userId: req.userId },
    update: {},
    include: cartWithItems,
  });

  sendSuccess(res, { data: { cart: serializeCart(cart) } });
});

const addItem = asyncHandler(async (req, res) => {
  const quantity = parseQuantity(req.body.quantity ?? 1, `Quantity must be between 1 and ${MAX_QUANTITY}`);
  const line = await resolveLine(req.body);
  const key = optionsKey(line.options);

  const cart = await prisma.cart.upsert({
    where: { userId: req.userId },
    create: { userId: req.userId },
    update: {},
  });

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: line.productId, type: line.type, optionsKey: key },
  });

  const cartItem = existing
    ? await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + quantity, MAX_QUANTITY) },
        include: cartItemWithProduct,
      })
    : await prisma.cartItem.create({
        data: { cartId: cart.id, ...line, optionsKey: key, quantity },
        include: cartItemWithProduct,
      });

  sendSuccess(res, {
    message: 'Item added to cart',
    data: { cartItem: serializeCartItem(cartItem) },
  });
});

const updateItem = asyncHandler(async (req, res) => {
  const quantity = parseQuantity(req.body.quantity, `Quantity must be between 1 and ${MAX_QUANTITY}`);
  const item = await findOwnedCartItem(req.userId, req.params.itemId);

  const cartItem = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
    include: cartItemWithProduct,
  });

  sendSuccess(res, {
    message: 'Cart item updated',
    data: { cartItem: serializeCartItem(cartItem) },
  });
});

const removeItem = asyncHandler(async (req, res) => {
  const item = await findOwnedCartItem(req.userId, req.params.itemId);
  await prisma.cartItem.delete({ where: { id: item.id } });

  sendSuccess(res, { message: 'Item removed from cart' });
});

const clearCart = asyncHandler(async (req, res) => {
  await prisma.cartItem.deleteMany({ where: { cart: { userId: req.userId } } });
  sendSuccess(res, { message: 'Cart cleared' });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
