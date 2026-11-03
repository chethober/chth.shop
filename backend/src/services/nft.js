// Minting collectibles as NFT items in a standard TON NFT collection (TEP-62 / TEP-64).
//
// The platform wallet (TON_MINTER_MNEMONIC, a v4 wallet) must own the collection at
// TON_NFT_COLLECTION_ADDRESS. Deploy the collection once with any standard tool (e.g. getgems or
// ton-community's nft-sdk) using `<PUBLIC_API_URL>/nft/collection.json` as collection content and
// `<PUBLIC_API_URL>/nft/` as the common content prefix; each item's content is `<collectible id>.json`.
//
// Without that configuration, development "mints" with a mock that only records the address.

const { Address, beginCell, internal, toNano, SendMode } = require('@ton/core');
const env = require('../config/env');
const prisma = require('../lib/prisma');
const { HttpError } = require('../lib/http');

const MINT_VALUE = toNano('0.05'); // sent to the collection; covers deploy + storage
const ITEM_VALUE = toNano('0.02'); // forwarded to the new item
const SEQNO_TIMEOUT_MS = 90 * 1000;

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

let chain = null;
/** Lazily connects the minter wallet. */
async function minter() {
  if (chain) return chain;
  const { TonClient, WalletContractV4 } = require('@ton/ton');
  const { mnemonicToPrivateKey } = require('@ton/crypto');
  const client = new TonClient({
    endpoint: `${env.ton.apiUrl}/jsonRPC`,
    apiKey: env.ton.toncenterApiKey || undefined,
  });
  const keys = await mnemonicToPrivateKey(env.ton.minterMnemonic.trim().split(/\s+/));
  const wallet = client.open(WalletContractV4.create({ workchain: 0, publicKey: keys.publicKey }));
  chain = { client, wallet, keys, collection: Address.parse(env.ton.collectionAddress) };
  return chain;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Sends one mint and waits until the wallet's seqno moves, so mints never race each other. */
async function mintOnChain(collectible, ownerAddress) {
  const { client, wallet, keys, collection } = await minter();

  // The collection only accepts the next index, so read it from the chain each time.
  const data = await client.runMethod(collection, 'get_collection_data');
  const itemIndex = Number(data.stack.readBigNumber());

  const seqno = await wallet.getSeqno();
  await wallet.sendTransfer({
    seqno,
    secretKey: keys.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages: [
      internal({
        to: collection,
        value: MINT_VALUE,
        body: mintMessageBody({ itemIndex, ownerAddress, contentPath: `${collectible.id}.json` }),
      }),
    ],
  });

  const deadline = Date.now() + SEQNO_TIMEOUT_MS;
  while ((await wallet.getSeqno()) === seqno) {
    if (Date.now() > deadline) throw new Error('Mint transaction was not confirmed in time');
    await sleep(3000);
  }

  const address = await client.runMethod(collection, 'get_nft_address_by_index', [
    { type: 'int', value: BigInt(itemIndex) },
  ]);
  return { nftIndex: itemIndex, nftAddress: address.stack.readAddress().toString() };
}

async function mintMock(collectible) {
  const issued = await prisma.collectible.count({ where: { nftIndex: { not: null } } });
  return { nftIndex: issued, nftAddress: `mock:${collectible.id}` };
}

// Mints run one at a time (they share the minter wallet's seqno).
let queue = Promise.resolve();

/** Queues a mint; the collectible moves MINTING → MINTED or FAILED in the background. */
function enqueueMint(collectible, ownerAddress) {
  queue = queue.then(async () => {
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
  });
  return queue;
}

function assertMintingAvailable() {
  if (!env.ton.canMint && env.isProduction) {
    throw new HttpError(503, 'NFT minting is not configured yet (TON_MINTER_MNEMONIC / TON_NFT_COLLECTION_ADDRESS)');
  }
}

module.exports = { enqueueMint, assertMintingAvailable, mintMessageBody };
