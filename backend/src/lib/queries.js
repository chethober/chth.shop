// Shared Prisma `include` shapes so every endpoint returns the same nested data.

const storeWithUsername = {
  include: { user: { select: { username: true } } },
};

const storeWithUser = {
  include: { user: { select: { username: true, email: true } } },
};

const productWithStore = {
  store: storeWithUsername,
};

const cartWithItems = {
  items: {
    include: { product: { include: productWithStore } },
    orderBy: { createdAt: 'asc' },
  },
};

const cartItemWithProduct = {
  product: { include: productWithStore },
};

const orderWithItems = {
  items: { include: { product: true, store: storeWithUsername }, orderBy: { createdAt: 'asc' } },
};

module.exports = {
  storeWithUsername,
  storeWithUser,
  productWithStore,
  cartWithItems,
  cartItemWithProduct,
  orderWithItems,
};
