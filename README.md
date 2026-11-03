# chth.shop

Monorepo for CHTH: a centralized print-on-demand marketplace where artists and merchants sell merch
(tees, hoodies, pants, mugs, caps, totes) that buyers can personalize in a 3D studio and pay for in crypto.
Sign-in is Google or Telegram.

- `/shop`: every listing from every store: All, Drops & limited, and Following feeds, filters by product
  type and seller kind, sort by top rated. `/p/<id>`: product page with options, reviews and wishlist.
- 12 products: tee, hoodie, joggers, cap, beanie, mug, takeaway cup, water bottle, tote, phone case, poster,
  sticker. Models and their licenses: [frontend/public/models/LICENSES.md](frontend/public/models/LICENSES.md).
- Payments: pay from a TON wallet through TON Connect, or any coin through NOWPayments.
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
