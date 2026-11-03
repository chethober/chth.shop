// Direct TON payments through TON Connect: the buyer's wallet sends the quoted amount to our
// receiving address with the order's memo as comment; we find that transfer on-chain.

const { Address, beginCell, toNano } = require('@ton/core');
const tonWallet = require('../ton-wallet');
const { jettonTransferBody, readComment, usdToUsdtUnits, formatUsdt } = tonWallet;
const env = require('../../config/env');
const { HttpError } = require('../../lib/http');

const NANO_PER_TON = 1_000_000_000n;
const PRICE_CACHE_MS = 60 * 1000;
let cachedPrice = null;

function config() {
  if (!env.ton.isConfigured) {
    throw new HttpError(503, 'TON payments are not configured (TON_RECEIVER_ADDRESS)');
  }
  return env.ton;
}

/** USD price of 1 TON: fixed by TON_USD_PRICE, else CoinGecko (cached for a minute). */
async function tonUsdPrice(fetchImpl = fetch) {
  if (env.ton.usdPrice) return env.ton.usdPrice;
  if (cachedPrice && Date.now() - cachedPrice.at < PRICE_CACHE_MS) return cachedPrice.value;

  const response = await fetchImpl('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd');
  const data = await response.json().catch(() => ({}));
  const value = Number(data?.['the-open-network']?.usd);
  if (!response.ok || !(value > 0)) throw new HttpError(502, 'Could not fetch the TON price. Please try again.');
  cachedPrice = { value, at: Date.now() };
  return value;
}

/** USD → nanotons, rounded up to a whole 0.001 TON so wallets show a clean amount. */
function usdToNano(usd, price) {
  const milliTon = BigInt(Math.ceil((usd / price) * 1000));
  return milliTon * (NANO_PER_TON / 1000n);
}

function formatTon(nano) {
  const value = BigInt(nano);
  const whole = value / NANO_PER_TON;
  const fraction = (value % NANO_PER_TON).toString().padStart(9, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
}

/** The comment that ties a transfer to an order. */
function orderMemo(orderId) {
  return `chth:${orderId}`;
}

/** Text-comment message body (op 0) as base64 BOC, for TON Connect's `payload`. */
function commentPayload(text) {
  return beginCell().storeUint(0, 32).storeStringTail(text).endCell().toBoc().toString('base64');
}

function isValidAddress(value) {
  try {
    Address.parse(String(value));
    return true;
  } catch {
    return false;
  }
}

/** Quotes the order in TON. Reuses a quote that hasn't expired. */
async function createQuote(order, { fetchImpl } = {}) {
  const { receiverAddress, quoteTtlMinutes } = config();
  if (order.payAmount && order.payExpiresAt && order.payExpiresAt > new Date() && order.paymentProvider === 'ton') {
    return { payAmount: order.payAmount, payAddress: order.payAddress, payMemo: order.payMemo, payExpiresAt: order.payExpiresAt };
  }

  const price = await tonUsdPrice(fetchImpl);
  return {
    payAmount: usdToNano(order.total, price).toString(),
    payAddress: Address.parse(receiverAddress).toString({ bounceable: false, testOnly: env.ton.network === 'testnet' }),
    payMemo: orderMemo(order.id),
    payExpiresAt: new Date(Date.now() + quoteTtlMinutes * 60 * 1000),
  };
}

/** What the frontend hands to TON Connect's sendTransaction. */
function transactionRequest(order) {
  return {
    method: 'ton',
    address: order.payAddress,
    amount: order.payAmount,
    amountTon: formatTon(order.payAmount),
    payload: commentPayload(order.payMemo),
    validUntil: Math.floor(new Date(order.payExpiresAt).getTime() / 1000),
    network: env.ton.network,
  };
}

/* ---------- USDT on TON (jetton transfers) ---------- */

/** TON attached to the jetton transfer for gas; the excess comes back to the buyer. */
const JETTON_GAS = toNano('0.05');

/**
 * Builds the TON Connect request for paying `order` in USDT from `buyerAddress`: a jetton
 * transfer sent to the buyer's own USDT wallet, forwarding the order comment to us.
 */
async function createUsdtRequest(order, buyerAddress) {
  const { receiverAddress, usdtMaster, quoteTtlMinutes } = env.ton;
  if (!env.ton.usdtEnabled) throw new HttpError(503, 'USDT payments are not configured (TON_RECEIVER_ADDRESS / TON_USDT_MASTER)');
  if (!isValidAddress(buyerAddress)) throw new HttpError(400, 'Connect a TON wallet first');

  const units = usdToUsdtUnits(order.total);
  const memo = orderMemo(order.id);
  let buyerJettonWallet;
  try {
    buyerJettonWallet = await tonWallet.jettonWalletAddress(buyerAddress, usdtMaster);
  } catch (error) {
    console.error('USDT wallet lookup failed:', error.message);
    throw new HttpError(502, 'Could not look up your USDT wallet. Please try again.');
  }
  const body = jettonTransferBody({
    amount: units,
    destination: receiverAddress,
    responseDestination: buyerAddress,
    forwardTonAmount: 1n,
    comment: memo,
  });

  const quote = {
    payAmount: units.toString(),
    payAddress: Address.parse(receiverAddress).toString({ bounceable: false, testOnly: env.ton.network === 'testnet' }),
    payMemo: memo,
    payExpiresAt: new Date(Date.now() + quoteTtlMinutes * 60 * 1000),
  };
  const request = {
    method: 'usdt',
    address: buyerJettonWallet.toString({ bounceable: true, testOnly: env.ton.network === 'testnet' }),
    amount: JETTON_GAS.toString(),
    payload: body.toBoc().toString('base64'),
    amountUsdt: formatUsdt(units),
    validUntil: Math.floor(quote.payExpiresAt.getTime() / 1000),
    network: env.ton.network,
  };
  return { quote, request };
}

/** Latest incoming USDT transfers to the receiving address (toncenter v3 jetton index). */
async function recentUsdtTransfers({ limit = 100, fetchImpl = fetch } = {}) {
  const { receiverAddress, usdtMaster, v3Url, toncenterApiKey } = env.ton;
  const params = new URLSearchParams({
    owner_address: receiverAddress,
    jetton_master: usdtMaster,
    direction: 'in',
    limit: String(limit),
    sort: 'desc',
  });
  const response = await fetchImpl(`${v3Url}/jetton/transfers?${params}`, {
    headers: toncenterApiKey ? { 'X-API-Key': toncenterApiKey } : {},
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(data.jetton_transfers)) {
    throw new HttpError(502, `Could not read USDT transfers (${data.error || response.status})`);
  }
  return data.jetton_transfers
    .filter((transfer) => !transfer.transaction_aborted)
    .map((transfer) => ({
      hash: transfer.transaction_hash,
      value: BigInt(transfer.amount || 0),
      comment: readComment(transfer.forward_payload).trim(),
      source: transfer.source,
    }));
}

/** Reads a transaction's incoming comment from a toncenter v2 response. */
function incomingComment(inMsg) {
  if (!inMsg) return '';
  if (typeof inMsg.message === 'string' && inMsg.message) return inMsg.message;
  const data = inMsg.msg_data;
  if (data && data['@type'] === 'msg.dataText' && data.text) return Buffer.from(data.text, 'base64').toString('utf8');
  return '';
}

/** Latest incoming transfers to the receiving address (toncenter v2 getTransactions). */
async function recentTransfers({ limit = 100, fetchImpl = fetch } = {}) {
  const { receiverAddress, apiUrl, toncenterApiKey } = config();
  const params = new URLSearchParams({ address: receiverAddress, limit: String(limit), archival: 'true' });
  const response = await fetchImpl(`${apiUrl}/getTransactions?${params}`, {
    headers: toncenterApiKey ? { 'X-API-Key': toncenterApiKey } : {},
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new HttpError(502, `Could not read the TON blockchain (${data.error || response.status})`);
  }
  return data.result
    .filter((tx) => tx.in_msg && tx.in_msg.source)
    .map((tx) => ({
      hash: tx.transaction_id.hash,
      value: BigInt(tx.in_msg.value || 0),
      comment: incomingComment(tx.in_msg).trim(),
      source: tx.in_msg.source,
    }));
}

/** Finds the transfer that pays `order`: right comment and at least the quoted amount. */
function findPayment(order, transfers) {
  if (!order.payMemo || !order.payAmount) return null;
  const required = BigInt(order.payAmount);
  return transfers.find((tx) => tx.comment === order.payMemo && tx.value >= required) || null;
}

/** A transfer with the right comment but too little TON. */
function findUnderpayment(order, transfers) {
  if (!order.payMemo || !order.payAmount) return null;
  const required = BigInt(order.payAmount);
  return transfers.find((tx) => tx.comment === order.payMemo && tx.value < required) || null;
}

module.exports = {
  name: 'ton',
  createUsdtRequest,
  recentUsdtTransfers,
  createQuote,
  transactionRequest,
  recentTransfers,
  findPayment,
  findUnderpayment,
  commentPayload,
  orderMemo,
  usdToNano,
  formatTon,
  isValidAddress,
};
