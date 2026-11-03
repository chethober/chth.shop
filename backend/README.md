# CHTH backend

Express REST API with Prisma (PostgreSQL) for the CHTH marketplace: artists and merchants sell print-on-demand
products (tees, hoodies, pants, mugs, caps, totes), buyers personalize them in 3D and pay in crypto.
Sign-in is Google or Telegram only; the API issues JWTs.

```bash
cp .env.example .env        # DATABASE_URL, JWT_SECRET, SESSION_SECRET, OAuth keys
npx prisma db push          # create / sync the schema
npm run db:seed             # optional demo artists, merchants and products (wipes users!)
npm run dev                 # http://localhost:5000/api
npm run make-admin -- <username>   # let a user manage fulfillment at /admin
```

Upgrading a database from before the marketplace (artists table, X login)? Run
`npx prisma db execute --file prisma/upgrade.sql --schema prisma/schema.prisma` before `db push`; it renames
tables and backfills new columns without data loss and is a no-op otherwise. The Docker image does this on start.

### Crypto payments

Checkout creates an order, then `POST /orders/:id/pay` returns a hosted checkout URL from the payment provider:

- `nowpayments` (production): a NOWPayments invoice where the buyer pays in USDT, BTC, ETH, TON and ~300 other
  coins. Set `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET`, and point the IPN URL at
  `<PUBLIC_API_URL>/payments/webhook/nowpayments`. Webhooks are HMAC-SHA512 verified; a "finished" payment for
  less than the order total is recorded as `PARTIALLY_PAID`, and paid orders never move backwards.
- `mock` (development default, refused in production): sends the buyer to `/checkout/mock`, where a button marks
  the order paid.
- `ton` (`POST /orders/:id/pay` with `{ "method": "ton" }`, enabled by `TON_RECEIVER_ADDRESS`): quotes the order
  in TON (CoinGecko price or `TON_USD_PRICE`, valid `TON_QUOTE_TTL_MINUTES`) and returns a TON Connect request:
  amount, receiving address, and a text comment `chth:<order id>`. The server finds the transfer through toncenter
  (`POST /orders/:id/ton/check`, plus a poller every 20 s) and needs the right comment and at least the quoted
  amount; `txHash` is unique, so one transfer can't pay two orders.
- `usdt` (`{ "method": "usdt", "walletAddress": "<buyer>" }`, needs `TON_RECEIVER_ADDRESS` and a USDT jetton
  master): charges the exact USD amount in USDT (6 decimals). The server looks up the buyer's USDT jetton wallet
  and returns a TEP-74 jetton transfer for TON Connect (0.05 TON gas, excess returned to the buyer) whose forward
  payload is the order comment. Payments are found through toncenter's v3 jetton transfer index (incoming
  transfers of that jetton to the receiver, not aborted, matching comment and amount).

### Payouts

Earnings are the per-line `sellerEarning` snapshots plus `ReferralReward` credit. A line is payable when its
order is paid, shipped or delivered, and paid more than `PAYOUT_HOLD_DAYS` ago. A run (`npm run payouts`,
`POST /admin/payouts/run`) creates one `Payout` per user at or above `PAYOUT_MIN_USD` and links the lines to it,
so nothing is paid twice; cancelling an unsent payout unlinks them again. The destination is the store's payout
address, else the user's `rewardAddress`. `USDT-TON` payouts are sent from the platform wallet
(`TON_WALLET_MNEMONIC`) as jetton transfers, one at a time through the same queue as NFT mints; other networks
wait for an admin to send them and record the transaction (`PUT /admin/payouts/:id/sent`).

### Telegram

`POST /auth/telegram/webapp` signs in with Mini App `initData` (HMAC-verified with the bot token, max 24 h old).
`POST /telegram/webhook` (checked against `TELEGRAM_WEBHOOK_SECRET`) answers `/start [ref_X|p_ID]`, `/shop`,
`/design`, `/orders`, `/sell` and `/help` with buttons that open the Mini App. `npm run telegram:setup` registers
the webhook, menu button and commands.

### NFT-backed merch

Products can be `nftBacked`, limited (`editionSize`, reserved atomically at checkout and released on cancel) and
timed (`dropStartsAt` / `dropEndsAt`). When an order is paid, each NFT-backed unit gets a `Collectible` with a
serial for the item's tag and an edition number. Buyers claim it to a TON address (`POST /collectibles/:id/claim`),
which mints an item in a standard TEP-62 collection from the platform wallet (`src/services/nft.js`):

1. Deploy a standard NFT collection owned by the `TON_WALLET_MNEMONIC` wallet (v4), with collection content
   `<PUBLIC_API_URL>/nft/collection.json` and common item content prefix `<PUBLIC_API_URL>/nft/`.
2. Set `TON_NFT_COLLECTION_ADDRESS` and fund the wallet (each mint sends 0.05 TON).

Mints run one at a time and read the next item index from the collection. Item metadata (TEP-64) is served at
`/nft/<collectible id>.json`. Without that configuration, development records a mock mint and production refuses
claims. **The on-chain paths (TON / USDT payments, mints, payouts) were tested against mocked chain responses, not a
live network**; try them on testnet first.

### Growth

Reviews (only buyers with a paid order), wishlist, store follows with a `?following=1` product feed, referrals
(`/referrals/me`, `/referrals/claim`; discount on the first order, credit ledger for the referrer), and Telegram
messages through the login bot when an order is paid (buyer and each seller) or shipped / delivered.

A paid order becomes `CONFIRMED`; admins then mark it shipped / delivered. Each order line snapshots the catalog
production cost and the seller's earning: `(price − production cost) × quantity × (1 − PLATFORM_FEE_PERCENT/100)`.

### Catalog and customization

`src/lib/catalog.js` lists the base products, with production cost, suggested retail price, sizes and colors.
Sellers price listings at or above production cost. A listing can carry a 3D `design` (color + decal layers) and be
marked `customizable`, letting buyers add their own layers; buyers can also design a catalog blank from scratch
(cart line with `type` and no `productId`). Images in designs must be uploaded first (`POST /uploads`).

`JWT_SECRET` and `SESSION_SECRET` are required when `NODE_ENV=production`; the server refuses to start without them.

### OAuth and other devices

The browser never calls this server directly: the frontend proxies `/api` here (see `frontend/next.config.js`).
OAuth callback and redirect URLs are built from the origin the user is on (via `X-Forwarded-Host`),
checked against `FRONTEND_URL` (plus private-network hosts in development). Register
`<origin>/api/auth/google/callback`, `<origin>/api/auth/x/callback` and `<origin>/api/auth/telegram/callback`
with each provider for every origin you use (for Telegram: @BotFather → your bot → Login Widget → Allowed URLs,
plus the bare `<origin>`).

## Layout

```
server.js                 Connects to the database and starts listening.
src/
  app.js                  Express app: security middleware, sessions, routes, error handling.
  config/env.js           All environment variables, read and validated in one place.
  config/passport.js      Google OAuth strategy.
  routes/index.js         Every endpoint in one table → controller functions.
  controllers/            One file per resource: request in, response out.
  services/               Logic shared by controllers (OAuth identity, Telegram, payments/).
  middleware/             requireAuth / optionalAuth / requireAdmin, 404 + error handler.
  lib/                    prisma client, HTTP helpers, JWT, query shapes, serializers, catalog, option validation.
prisma/                   Schema, upgrade.sql (pre-push data upgrade), legacy migrations.
scripts/seed.js           Demo data.
scripts/make-admin.js     Grant / revoke admin.
```

Controllers throw `HttpError(status, message)`; the error middleware turns it into
`{ success: false, message }`. Successful responses are `{ success: true, message?, data }`.

## Endpoints (all under `/api`)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | – | Health check |
| GET | `/auth/google`, `/auth/google/callback` | – | Google OAuth |
| GET | `/auth/telegram/config` | – | Telegram widget config |
| GET | `/auth/telegram/callback` · POST `/auth/telegram` | – | Telegram login (redirect / JSON) |
| GET | `/auth/me` | ✓ | Current user |
| PUT | `/auth/username` | ✓ | Change username (returns a new token) |
| GET | `/users/me` | ✓ | Current user |
| GET | `/users/username-available?username=` | ✓ | Username availability |
| DELETE | `/users/me` | ✓ | Delete account (cascades) |
| GET | `/stores` (`?kind=ARTIST\|MERCHANT`) · `/stores/:username` | – | List / view stores |
| GET | `/stores/me` · `/stores/me/sales` | ✓ | Own store / paid sales and earnings |
| POST · PUT · DELETE | `/stores` | ✓ | Create / update / delete own store (kind, payout address, socials) |
| POST | `/stores/contract/accept` (`{ kind }`) | ✓ | Accept the seller agreement |
| GET | `/catalog` | – | Base products, costs, sizes, colors |
| GET | `/products` (`?type&kind&store&search&sort&collection=drops&following=1&page&limit`) | – | Browse the marketplace |
| GET | `/products/:id` | – | Product (unlisted ones only for their owner) |
| GET | `/products/mine` | ✓ | Own products |
| POST · PUT · DELETE | `/products`, `/products/:id` | ✓ | Manage own products |
| POST | `/uploads` (`{ dataUrl }`) | ✓ | Upload a PNG / JPEG / WebP (≤ 5MB) |
| GET · POST · DELETE | `/cart` | ✓ | View / add (`productId` or `type`, plus `options`) / clear |
| PUT · DELETE | `/cart/items/:itemId` | ✓ | Change quantity / remove |
| GET · POST | `/orders` | ✓ | List orders / check out the cart |
| GET | `/orders/:orderId` | ✓ | Order details |
| POST | `/orders/:orderId/pay` | ✓ | Start or resume the crypto payment |
| PUT | `/orders/:orderId/cancel` | ✓ | Cancel a pending, unpaid order |
| POST | `/payments/webhook/:provider` | signature | Payment provider callback |
| POST | `/payments/mock/:orderId/confirm` | ✓ | Development only: mark paid |
| GET · PUT | `/admin/orders`, `/admin/orders/:orderId/status` | admin | Fulfillment queue |
| GET | `/payments/methods` | – | Which payment methods are enabled |
| POST | `/orders/:orderId/ton/check` | ✓ | Look for the order's TON transfer now |
| GET · PUT · DELETE | `/products/:id/reviews` | – / ✓ | Reviews / write or delete own (buyers only) |
| GET · PUT · DELETE | `/wishlist`, `/wishlist/:productId` | ✓ | Wishlist |
| GET · PUT · DELETE | `/stores/following`, `/stores/:username/follow` | ✓ | Follows |
| GET · POST | `/referrals/me`, `/referrals/claim` | ✓ | Referral code and stats / use a code |
| GET · POST | `/collectibles`, `/collectibles/:id/claim` | ✓ | Own collectibles / mint to a TON wallet |
| GET | `/collectibles/verify/:serial` | – | Public authenticity check |
| GET | `/nft/collection.json`, `/nft/:id.json` | – | TEP-64 metadata |
| GET | `/payouts/me` | ✓ | Balance, payout destination and history |
| PUT | `/referrals/address` | ✓ | TON address for referral credit |
| GET · POST | `/admin/payouts`, `/admin/payouts/run` | admin | Balances + payouts / run payouts |
| POST · PUT · DELETE | `/admin/payouts/:id/send`, `/admin/payouts/:id/sent`, `/admin/payouts/:id` | admin | Send / record manual / cancel |
| POST | `/auth/telegram/webapp` | – | Telegram Mini App sign-in |
| POST | `/telegram/webhook` | secret | Bot updates |
