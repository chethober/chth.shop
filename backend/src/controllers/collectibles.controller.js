const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError, asyncHandler, sendSuccess } = require('../lib/http');
const { isValidAddress } = require('../services/payments/ton');
const { enqueueMint, assertMintingAvailable } = require('../services/nft');

const collectibleInclude = {
  product: { select: { id: true, name: true, type: true, store: { select: { storeName: true, user: { select: { username: true } } } } } },
};

function serializeCollectible(collectible) {
  const store = collectible.product?.store;
  return {
    id: collectible.id,
    serial: collectible.serial,
    name: collectible.name,
    imageUrl: collectible.imageUrl,
    productId: collectible.productId,
    productType: collectible.product?.type ?? null,
    store: store ? { storeName: store.storeName, username: store.user.username } : null,
    edition: collectible.edition,
    editionSize: collectible.editionSize,
    status: collectible.status,
    ownerAddress: collectible.ownerAddress,
    nftIndex: collectible.nftIndex,
    nftAddress: collectible.nftAddress,
    mintError: collectible.mintError,
    claimedAt: collectible.claimedAt,
    createdAt: collectible.createdAt,
  };
}

/** Absolute URL for an image, so wallets and marketplaces can load it. */
function absoluteUrl(url) {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  return `${env.frontendUrls[0]}${url.startsWith('/') ? '' : '/'}${url}`;
}

const listMine = asyncHandler(async (req, res) => {
  const collectibles = await prisma.collectible.findMany({
    where: { ownerId: req.userId },
    include: collectibleInclude,
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, { data: { collectibles: collectibles.map(serializeCollectible) } });
});

/** Mints the collectible to a TON wallet the owner chooses (normally their connected wallet). */
const claim = asyncHandler(async (req, res) => {
  const address = String(req.body.address || '').trim();
  if (!isValidAddress(address)) throw new HttpError(400, 'Enter a valid TON wallet address');
  assertMintingAvailable();

  const collectible = await prisma.collectible.findFirst({ where: { id: String(req.params.id), ownerId: req.userId } });
  if (!collectible) throw new HttpError(404, 'Collectible not found');
  if (collectible.status === 'MINTED' || collectible.status === 'MINTING') {
    throw new HttpError(400, `This collectible is already ${collectible.status.toLowerCase()}`);
  }

  // Only claim it if nobody else started in the meantime.
  const { count } = await prisma.collectible.updateMany({
    where: { id: collectible.id, status: { in: ['UNCLAIMED', 'FAILED'] } },
    data: { status: 'MINTING', ownerAddress: address, claimedAt: new Date(), mintError: null },
  });
  if (count === 0) throw new HttpError(409, 'This collectible is already being minted');

  enqueueMint(collectible, address);
  const updated = await prisma.collectible.findUnique({ where: { id: collectible.id }, include: collectibleInclude });
  sendSuccess(res, { status: 202, message: 'Minting started', data: { collectible: serializeCollectible(updated) } });
});

/** Public authenticity check for the serial printed on an item's tag. */
const verify = asyncHandler(async (req, res) => {
  const collectible = await prisma.collectible.findUnique({
    where: { serial: String(req.params.serial).toUpperCase() },
    include: { ...collectibleInclude, owner: { select: { username: true } } },
  });
  if (!collectible) throw new HttpError(404, 'No item with this serial');

  sendSuccess(res, {
    data: { collectible: { ...serializeCollectible(collectible), ownerUsername: collectible.owner.username } },
  });
});

/** TEP-64 collection metadata. */
const collectionMetadata = (req, res) => {
  res.json({
    name: 'CHTH Collectibles',
    description: 'Numbered certificates for limited CHTH merch. Each one belongs to a real, printed item.',
    image: absoluteUrl('/logo-black.png'),
    external_link: env.frontendUrls[0],
  });
};

/** TEP-64 item metadata, served at `<collectible id>.json`. */
const itemMetadata = asyncHandler(async (req, res) => {
  const id = String(req.params.file).replace(/\.json$/, '');
  const collectible = await prisma.collectible.findUnique({
    where: { id },
    include: { ...collectibleInclude, orderItem: { select: { options: true } } },
  });
  if (!collectible) throw new HttpError(404, 'Not found');

  const options = collectible.orderItem.options || {};
  const attributes = [
    { trait_type: 'Serial', value: collectible.serial },
    collectible.product?.type && { trait_type: 'Product', value: collectible.product.type },
    collectible.product?.store && { trait_type: 'Store', value: collectible.product.store.storeName || collectible.product.store.user.username },
    collectible.edition && { trait_type: 'Edition', value: `${collectible.edition} / ${collectible.editionSize}` },
    options.size && { trait_type: 'Size', value: options.size },
    options.color && { trait_type: 'Color', value: options.color },
  ].filter(Boolean);

  res.json({
    name: collectible.edition
      ? `${collectible.name} #${collectible.edition}/${collectible.editionSize}`
      : `${collectible.name} · ${collectible.serial}`,
    description: `Certificate of authenticity for a physical ${collectible.name}. Verify at ${env.frontendUrls[0]}/verify/${collectible.serial}`,
    image: absoluteUrl(collectible.imageUrl),
    external_url: `${env.frontendUrls[0]}/verify/${collectible.serial}`,
    attributes,
  });
});

module.exports = { listMine, claim, verify, collectionMetadata, itemMetadata, serializeCollectible };
