// Minting collectibles as NFT items in a standard TON NFT collection (TEP-62 / TEP-64).
//
// The platform wallet (TON_WALLET_MNEMONIC, a v4 wallet) must own the collection at
// TON_NFT_COLLECTION_ADDRESS. Deploy the collection once with any standard tool (e.g. getgems or
// ton-community's nft-sdk) using `<PUBLIC_API_URL>/nft/collection.json` as collection content and
// `<PUBLIC_API_URL>/nft/` as the common content prefix; each item's content is `<collectible id>.json`.
//
// Without that configuration, development "mints" with a mock that only records the address.

const { Address, beginCell, toNano } = require('@ton/core');
const { send } = require('./ton-wallet');
const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError } = require('../lib/http');

const MINT_VALUE = toNano('0.05'); // sent to the collection; covers deploy + storage
const ITEM_VALUE = toNano('0.02'); // forwarded to the new item

/** Body of the collection's "deploy item" message (op 1): index, value, then owner + content. */
function mintMessageBody({ itemIndex, ownerAddress, contentPath, queryId = Date.now() }) {
  const content = beginCell().storeStringTail(contentPath).endCell();
  const itemData = beginCell().storeAddress(Address.parse(ownerAddress)).storeRef(content).endCell();
  return beginCell()
    .storeUint(1, 32)
    .storeUint(queryId, 64)
    .storeUint(itemIndex, 64)
    .storeCoins(ITEM_VALUE)
    .storeRef(itemData)
    .endCell();
}

/** Mints through the platform wallet's send queue (shared with payouts). */
function mintOnChain(collectible, ownerAddress) {
  const { tonClient } = require('./ton-wallet');
  const collection = Address.parse(env.ton.collectionAddress);
  let itemIndex;

  return send(async () => {
    // The collection only accepts the next index, so read it right before sending.
    const data = await tonClient().runMethod(collection, 'get_collection_data');
    itemIndex = Number(data.stack.readBigNumber());
    return {
      messages: [
        {
          to: collection,
          value: MINT_VALUE,
          body: mintMessageBody({ itemIndex, ownerAddress, contentPath: `${collectible.id}.json` }),
        },
      ],
    };
  }).then(async () => {
    const address = await tonClient().runMethod(collection, 'get_nft_address_by_index', [
      { type: 'int', value: BigInt(itemIndex) },
    ]);
    return { nftIndex: itemIndex, nftAddress: address.stack.readAddress().toString() };
  });
}

async function mintMock(collectible) {
  const issued = await prisma.collectible.count({ where: { nftIndex: { not: null } } });
  return { nftIndex: issued, nftAddress: `mock:${collectible.id}` };
}

/** Starts a mint; the collectible moves MINTING → MINTED or FAILED in the background. */
function enqueueMint(collectible, ownerAddress) {
  return (async () => {
    try {
      const result = env.ton.canMint ? await mintOnChain(collectible, ownerAddress) : await mintMock(collectible);
      await prisma.collectible.update({
        where: { id: collectible.id },
        data: { ...result, status: 'MINTED', mintError: null },
      });
    } catch (error) {
      console.error(`Mint failed for collectible ${collectible.id}:`, error);
      await prisma.collectible.update({
        where: { id: collectible.id },
        data: { status: 'FAILED', mintError: String(error.message || error).slice(0, 300) },
      });
    }
  })();
}

function assertMintingAvailable() {
  if (!env.ton.canMint && env.isProduction) {
    throw new HttpError(503, 'NFT minting is not configured yet (TON_WALLET_MNEMONIC / TON_NFT_COLLECTION_ADDRESS)');
  }
}

module.exports = { enqueueMint, assertMintingAvailable, mintMessageBody };
