# chth.shop

Monorepo for CHTH: a centralized print-on-demand marketplace where artists and merchants sell merch
(tees, hoodies, pants, mugs, caps, totes) that buyers can personalize in a 3D studio and pay for in crypto.
Sign-in is Google or Telegram.

- `/shop`: every listing from every store: All, Drops & limited, and Following feeds, filters by product
  type and seller kind, sort by top rated. `/p/<id>`: product page with options, reviews and wishlist.
- 12 products: tee, hoodie, joggers, cap, beanie, mug, takeaway cup, water bottle, tote, phone case, poster,
  sticker. Models and their licenses: [frontend/public/models/LICENSES.md](frontend/public/models/LICENSES.md).
- Payments: TON or USDT on TON from the buyer's wallet (TON Connect), or any coin through NOWPayments.
- Seller payouts: sales earnings (and referral credit) become payable after shipping + a hold period and are
  paid monthly in USDT, automatically to TON addresses (`npm run payouts`, or Admin → Payouts).
- Telegram Mini App: the shop runs inside Telegram with automatic sign-in, Telegram's theme and back button,
  and `t.me/<bot>/<app>?startapp=…` deep links; the bot answers `/start`, `/shop`, `/orders`… (setup below).
- NFT-backed merch: sellers mark listings as NFT-backed and/or limited editions with timed drops. Each unit sold
  gets a numbered collectible the buyer claims to their TON wallet; `/verify/<serial>` checks authenticity.
- Growth: verified-buyer reviews, wishlist, follow stores, referral links (`?ref=CODE`: 10% off the first
  order, 5% credit to the referrer), Telegram bot notifications for buyers and sellers.
- `/design`: 3D studio. Buyers order their own designs; sellers publish them to their store; `?product=<id>`
  personalizes a listing the seller marked customizable.
- `/collab`: open a store as an artist or merchant. `/account`: products, sales, payout address, orders.
- `/admin`: fulfillment queue for admins (`npm run make-admin -- <username>` in the backend).

## Structure

| Path          | What it is                                                        |
| ------------- | ----------------------------------------------------------------- |
| `frontend/`   | Next.js app (UI). See [frontend/README.md](frontend/README.md).   |
| `backend/`    | Express + Prisma REST API. See [backend/README.md](backend/README.md). |
| `assets/brand/` | Master logo files (the web-ready copies live in `frontend/public`). |
| `hezar/`      | Separate Python utility app, not used by the shop.                |
| `specs/`      | Feature specs.                                                    |

## Running with Docker

The whole stack (PostgreSQL, API, Next.js) runs with Docker Compose:

```bash
cp .env.example .env    # set JWT_SECRET and SESSION_SECRET (e.g. `openssl rand -hex 32`)
docker compose up -d --build
```

The site is served at http://localhost:3000 (change with `FRONTEND_PORT`); the browser
only talks to Next.js, which proxies `/api` and `/uploads` to the backend container. On start
the backend upgrades older data (`prisma/upgrade.sql`) and syncs the schema with `prisma db push`.
Set `NOWPAYMENTS_API_KEY` / `NOWPAYMENTS_IPN_SECRET` in `.env` for crypto checkout (see
[backend/README.md](backend/README.md#crypto-payments)). Without them, checkout reports that payments aren't
configured; to try the full flow, run locally (below), where a mock payment page is the default. Data and uploaded images live
in the `pgdata` and `uploads` volumes.

```bash
docker compose exec backend npm run db:seed   # load demo artists, merchants and products (resets data)
docker compose exec backend npm run make-admin -- <username>
docker compose logs -f backend                # follow API logs
docker compose down                           # stop (add -v to also delete the data)
```

`BACKEND_URL` and `NEXT_PUBLIC_API_URL` are baked into the frontend image at build time,
so rebuild it (`docker compose build frontend`) after changing them.

## Local development

```bash
yarn install                           # installs both workspaces
cp backend/.env.example backend/.env   # then fill in DATABASE_URL and secrets
yarn workspace chth-backend prisma db push
yarn workspace chth-backend dev        # http://localhost:5000/api
yarn workspace chth-frontend dev       # http://localhost:3000
```

## Telegram Mini App

1. In @BotFather: `/setdomain` (Login Widget) and `/newapp` pointing at `https://<your-domain>/shop`; note the
   app short name.
2. Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` (any random string),
   `TELEGRAM_MINI_APP_NAME`, and `TELEGRAM_MINI_APP_LINK=https://t.me/<bot>/<app name>` (frontend build arg).
3. Run `docker compose exec backend npm run telegram:setup` once: it registers the webhook
   (`/api/telegram/webhook`), the chat menu button that opens the shop, and the command list.

Inside Telegram the site signs users in from the Mini App's `initData` (verified with the bot token), so there's
no login screen. Share links use `startapp=ref_<CODE>` (referral) and `startapp=p_<product id>`.

## Payouts

`npm run payouts -- --dry-run` lists balances; `npm run payouts` (cron, e.g. monthly) creates payouts and sends
the USDT-on-TON ones from the platform wallet (`TON_WALLET_MNEMONIC`, funded with USDT plus ~0.05 TON per
payout for fees). Payouts to other networks stay *Scheduled* until an admin sends them and records the
transaction under Admin → Payouts.
