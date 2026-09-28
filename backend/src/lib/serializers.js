// Shapes database records into the JSON the frontend consumes.

const roundCurrency = (value) => parseFloat(value.toFixed(2));

function serializeArtistSummary(artist) {
  if (!artist) return null;
  return {
    id: artist.id,
    storeName: artist.storeName,
    username: artist.user ? artist.user.username : '',
  };
}

function serializeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

/** Minimal user payload embedded in OAuth redirects and auth responses. */
function serializeAuthUser(user, authProvider) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    authProvider: authProvider || user.authProvider,
    ...(authProvider === 'google' ? { isGoogleUser: true } : {}),
  };
}

function serializeCartItem(item) {
  return {
    id: item.id,
    cartId: item.cartId,
    productId: item.productId,
    quantity: item.quantity,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          type: item.product.type,
          price: item.product.price,
          imageUrl: item.product.imageUrl,
          artist: serializeArtistSummary(item.product.artist),
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
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product ? item.product.price : 0) * item.quantity,
    0
  );

  return { id: cart.id, items, totalItems, totalPrice: roundCurrency(totalPrice) };
}

function serializeOrder(order) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: order.total,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: (order.items || []).map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            type: item.product.type,
            imageUrl: item.product.imageUrl,
            artist: serializeArtistSummary(item.product.artist),
          }
        : null,
    })),
  };
}

module.exports = {
  roundCurrency,
  serializeUser,
  serializeAuthUser,
  serializeCart,
  serializeCartItem,
  serializeOrder,
};
