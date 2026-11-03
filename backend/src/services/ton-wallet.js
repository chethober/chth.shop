// The platform's TON hot wallet (v4, TON_WALLET_MNEMONIC) and jetton helpers.
// Everything that sends from this wallet (NFT mints, USDT payouts) goes through `send`, which runs
// one transfer at a time and waits for the seqno to move, so transfers never race each other.

const { Address, beginCell } = require('@ton/core');
const env = require('../config/env');
const { HttpError } = require('../lib/http');

const SEQNO_TIMEOUT_MS = 90 * 1000;
const JETTON_TRANSFER_OP = 0x0f8a7ea5;
/** USDT on TON has 6 decimals. */
const USDT_DECIMALS = 6;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let client = null;
/** A toncenter JSON-RPC client (no wallet needed: used for get-methods too). */
function tonClient() {
  if (client) return client;
  const { TonClient } = require('@ton/ton');
  client = new TonClient({ endpoint: `${env.ton.apiUrl}/jsonRPC`, apiKey: env.ton.toncenterApiKey || undefined });
  return client;
}

let wallet = null;
async function platformWallet() {
  if (wallet) return wallet;
  if (!env.ton.walletMnemonic) throw new HttpError(503, 'The platform TON wallet is not configured (TON_WALLET_MNEMONIC)');
  const { WalletContractV4 } = require('@ton/ton');
  const { mnemonicToPrivateKey } = require('@ton/crypto');
  const keys = await mnemonicToPrivateKey(env.ton.walletMnemonic.trim().split(/\s+/));
  const contract = tonClient().open(WalletContractV4.create({ workchain: 0, publicKey: keys.publicKey }));
  wallet = { contract, keys, address: contract.address };
  return wallet;
}

let queue = Promise.resolve();

/**
 * Sends internal messages from the platform wallet once earlier sends are confirmed.
 * `prepare` runs inside the queue (so it can read fresh chain state) and returns the messages.
 */
function send(prepare) {
  const run = queue.then(async () => {
    const { internal, SendMode } = require('@ton/core');
    const { contract, keys } = await platformWallet();
    const { messages, result } = await prepare();

    const seqno = await contract.getSeqno();
    await contract.sendTransfer({
      seqno,
      secretKey: keys.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: messages.map((message) => internal(message)),
    });

    const deadline = Date.now() + SEQNO_TIMEOUT_MS;
    while ((await contract.getSeqno()) === seqno) {
      if (Date.now() > deadline) throw new Error('Transfer was not confirmed in time');
      await sleep(3000);
    }
    return result;
  });
  // Keep the queue alive after a failure.
  queue = run.catch(() => {});
  return run;
}

/** Text comment cell (op 0). */
function commentCell(text) {
  return beginCell().storeUint(0, 32).storeStringTail(text).endCell();
}

/** Reads a text comment from a payload cell (base64 BOC); '' when it isn't one. */
function readComment(base64) {
  if (!base64) return '';
  try {
    const { Cell } = require('@ton/core');
    const slice = Cell.fromBase64(base64).beginParse();
    if (slice.remainingBits < 32 || slice.loadUint(32) !== 0) return '';
    return slice.loadStringTail();
  } catch {
    return '';
  }
}

/** TEP-74 jetton transfer body, sent to the sender's own jetton wallet. */
function jettonTransferBody({ amount, destination, responseDestination, forwardTonAmount, comment, queryId = Date.now() }) {
  return beginCell()
    .storeUint(JETTON_TRANSFER_OP, 32)
    .storeUint(queryId, 64)
    .storeCoins(amount)
    .storeAddress(Address.parse(destination))
    .storeAddress(Address.parse(responseDestination))
    .storeBit(0) // no custom payload
    .storeCoins(forwardTonAmount)
    .storeBit(1) // forward payload in a ref
    .storeRef(commentCell(comment))
    .endCell();
}

/** Address of `owner`'s jetton wallet for the jetton `master` (get_wallet_address). */
async function jettonWalletAddress(owner, master) {
  const result = await tonClient().runMethod(Address.parse(master), 'get_wallet_address', [
    { type: 'slice', cell: beginCell().storeAddress(Address.parse(owner)).endCell() },
  ]);
  return result.stack.readAddress();
}

/** USD → USDT base units (6 decimals), as a bigint. */
function usdToUsdtUnits(usd) {
  return BigInt(Math.round(usd * 10 ** USDT_DECIMALS));
}

function formatUsdt(units) {
  return (Number(units) / 10 ** USDT_DECIMALS).toFixed(2);
}

module.exports = {
  tonClient,
  platformWallet,
  send,
  commentCell,
  readComment,
  jettonTransferBody,
  jettonWalletAddress,
  usdToUsdtUnits,
  formatUsdt,
  JETTON_TRANSFER_OP,
};
