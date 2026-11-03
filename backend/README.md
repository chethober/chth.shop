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
`<origin>/api/auth/google/callback` with Google for every origin you use.
Google only accepts `localhost` or public domains, so to sign in from a phone use a tunnel/domain
(e.g. `cloudflared tunnel --url http://localhost:3000`) and add that origin to `FRONTEND_URL` and Google.
Telegram's widget only works on the domain set with BotFather's `/setdomain`.

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
| GET | `/products` (`?type&kind&store&search&sort&page&limit`) | – | Browse the marketplace |
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
