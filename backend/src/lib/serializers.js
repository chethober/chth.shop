// Shapes database records into the JSON the frontend consumes.

const { getCatalogItem } = require('./catalog');

const roundCurrency = (value) => Math.round(value * 100) / 100;

function serializeStoreSummary(store) {
  if (!store) return null;
  return {
    id: store.id,
    kind: store.kind,
    storeName: store.storeName,
    username: store.user ? store.user.username : '',
  };
}

function serializeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

/** Public product payload. Inactive products are only ever returned to their owner. */
function serializeProduct(product) {
  if (!product) return null;
  const { store, ...rest } = product;
  return { ...rest, ...(store !== undefined && { store: serializeStoreSummary(store) }) };
}

/** Minimal user payload embedded in OAuth redirects and auth responses. */
function serializeAuthUser(user, authProvider) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isSeller: user.isSeller,
    authProvider: authProvider || user.authProvider,
    ...(authProvider === 'google' ? { isGoogleUser: true } : {}),
  };
}

/** Unit price of a cart line: the listing's price, or the catalog price for a buyer's own design. */
function cartItemUnitPrice(item) {
  if (item.product) return item.product.price;
  const catalogItem = getCatalogItem(item.type);
  return catalogItem ? catalogItem.retailPrice : 0;
}

function cartItemName(item) {
  if (item.product) return item.product.name;
  const catalogItem = getCatalogItem(item.type);
  return `Custom ${catalogItem ? catalogItem.name : item.type}`;
}

function serializeCartItem(item) {
  return {
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    type: item.type,
    name: cartItemName(item),
    options: item.options || {},
    quantity: item.quantity,
    unitPrice: cartItemUnitPrice(item),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          type: item.product.type,
          price: item.product.price,
          imageUrl: item.product.imageUrl,
          store: serializeStoreSummary(item.product.store),
        }
      : null,
  };
}

function serializeCart(cart) {
  if (!cart) {
    return { id: null, items: [], totalItems: 0, totalPrice: 0 };
  }

  const items = (cart.items || []).map(serializeCartItem);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return { id: cart.id, items, totalItems, totalPrice: roundCurrency(totalPrice) };
}

function serializeOrder(order) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: order.total,
    currency: order.currency,
    shippingAddress: order.shippingAddress,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paymentUrl: order.paymentUrl,
    payCurrency: order.payCurrency,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: (order.items || []).map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      type: item.type,
      name: item.name,
      options: item.options || {},
      quantity: item.quantity,
      price: item.price,
      imageUrl: (item.options && item.options.previewUrl) || (item.product && item.product.imageUrl) || null,
      store: serializeStoreSummary(item.store),
    })),
  };
}

module.exports = {
  roundCurrency,
  serializeUser,
  serializeProduct,
  serializeStoreSummary,
  serializeAuthUser,
  serializeCart,
  serializeCartItem,
  serializeOrder,
  cartItemUnitPrice,
  cartItemName,
};
