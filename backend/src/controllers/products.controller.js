const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { productWithArtist, productWithArtistContact } = require('../lib/queries');

const DEFAULT_PAGE_SIZE = 20;

function singlePage(products) {
  return {
    products,
    pagination: { total: products.length, page: 1, pages: 1, hasNext: false, hasPrev: false },
  };
}

/** Loads a product the current user is allowed to modify. */
async function findOwnedProduct(userId, productId) {
  const artist = await prisma.artist.findUnique({ where: { userId } });
  if (!artist) throw new HttpError(403, 'Only artists can manage products');

  const product = await prisma.product.findUnique({ where: { id: String(productId) } });
  if (!product) throw new HttpError(404, 'Product not found');
  if (product.artistId !== artist.id) {
    throw new HttpError(403, 'You are not authorized to modify this product');
  }
  return product;
}

const listProducts = asyncHandler(async (req, res) => {
  const { type, artist, search } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * limit;

  const where = {
    ...(type && { type }),
    ...(artist && { artist: { user: { username: artist } } }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productWithArtistContact,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  sendSuccess(res, {
    data: {
      products,
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

const listArtistProducts = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    include: {
      artist: {
        include: {
          products: { orderBy: { createdAt: 'desc' }, include: productWithArtist },
        },
      },
    },
  });
  if (!user || !user.artist) throw new HttpError(404, 'Artist not found');

  sendSuccess(res, { data: { artist: user.artist, products: user.artist.products } });
});

const listMyProducts = asyncHandler(async (req, res) => {
  const artist = await prisma.artist.findUnique({ where: { userId: req.userId } });
  if (!artist) return sendSuccess(res, { data: singlePage([]) });

  const products = await prisma.product.findMany({
    where: { artistId: artist.id },
    include: productWithArtist,
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { data: singlePage(products) });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: String(req.params.id) },
    include: productWithArtistContact,
  });
  if (!product) throw new HttpError(404, 'Product not found');

  sendSuccess(res, { data: { product } });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, type, price, imageUrl } = req.body;
  if (!name || !type || price === undefined) {
    throw new HttpError(400, 'Name, type, and price are required');
  }

  const artist = await prisma.artist.findUnique({ where: { userId: req.userId } });
  if (!artist) throw new HttpError(403, 'Only artists can create products');

  const product = await prisma.product.create({
    data: {
      name,
      type,
      price: parseFloat(price),
      imageUrl: imageUrl || null,
      artistId: artist.id,
    },
    include: productWithArtist,
  });

  sendSuccess(res, { status: 201, message: 'Product created successfully', data: { product } });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await findOwnedProduct(req.userId, req.params.id);
  const { name, type, price, imageUrl } = req.body;

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(imageUrl !== undefined && { imageUrl }),
    },
    include: productWithArtist,
  });

  sendSuccess(res, { message: 'Product updated successfully', data: { product: updated } });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await findOwnedProduct(req.userId, req.params.id);
  await prisma.product.delete({ where: { id: product.id } });

  sendSuccess(res, { message: 'Product deleted successfully' });
});

module.exports = {
  listProducts,
  listArtistProducts,
  listMyProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
