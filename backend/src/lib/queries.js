// Shared Prisma `include` shapes so every endpoint returns the same nested data.

const artistWithUsername = {
  include: { user: { select: { username: true } } },
};

const artistWithUser = {
  include: { user: { select: { username: true, email: true } } },
};

const productWithArtist = {
  artist: artistWithUsername,
};

const productWithArtistContact = {
  artist: artistWithUser,
};

const cartWithItems = {
  items: {
    include: { product: { include: productWithArtist } },
    orderBy: { createdAt: 'asc' },
  },
};

const cartItemWithProduct = {
  product: { include: productWithArtist },
};

const orderWithItems = {
  items: { include: { product: { include: productWithArtist } } },
};

module.exports = {
  artistWithUser,
  productWithArtist,
  productWithArtistContact,
  cartWithItems,
  cartItemWithProduct,
  orderWithItems,
};
