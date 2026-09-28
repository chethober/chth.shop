const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { cartWithItems, cartItemWithProduct } = require('../lib/queries');
const { serializeCart, serializeCartItem } = require('../lib/serializers');

function parseQuantity(value, message) {
  const quantity = parseInt(value, 10);
  if (Number.isNaN(quantity) || quantity < 1) throw new HttpError(400, message);
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
  const { productId } = req.body;
  if (!productId) throw new HttpError(400, 'Product ID is required');
  const quantity = parseQuantity(req.body.quantity ?? 1, 'Quantity must be a positive integer');

  const product = await prisma.product.findUnique({ where: { id: String(productId) } });
  if (!product) throw new HttpError(404, 'Product not found');

  const cart = await prisma.cart.upsert({
    where: { userId: req.userId },
    create: { userId: req.userId },
    update: {},
  });

  const cartItem = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    create: { cartId: cart.id, productId: product.id, quantity },
    update: { quantity: { increment: quantity } },
    include: cartItemWithProduct,
  });

  sendSuccess(res, {
    message: 'Item added to cart successfully',
    data: { cartItem: serializeCartItem(cartItem) },
  });
});

const updateItem = asyncHandler(async (req, res) => {
  const quantity = parseQuantity(req.body.quantity, 'Valid quantity is required (minimum 1)');
  const item = await findOwnedCartItem(req.userId, req.params.itemId);

  const cartItem = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
    include: cartItemWithProduct,
  });

  sendSuccess(res, {
    message: 'Cart item updated successfully',
    data: { cartItem: serializeCartItem(cartItem) },
  });
});

const removeItem = asyncHandler(async (req, res) => {
  const item = await findOwnedCartItem(req.userId, req.params.itemId);
  await prisma.cartItem.delete({ where: { id: item.id } });

  sendSuccess(res, { message: 'Item removed from cart successfully' });
});

const clearCart = asyncHandler(async (req, res) => {
  await prisma.cartItem.deleteMany({ where: { cart: { userId: req.userId } } });
  sendSuccess(res, { message: 'Cart cleared successfully' });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
