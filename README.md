# chth.shop

Monorepo for CHTH: a 3D merchandise designer and artist storefront.

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
the backend syncs the database schema with `prisma db push`. Data and uploaded images live
in the `pgdata` and `uploads` volumes.

```bash
docker compose exec backend npm run db:seed   # load demo artists and products (resets data)
docker compose logs -f backend                # follow API logs
docker compose down                           # stop (add -v to also delete the data)
```

`BACKEND_URL` and `NEXT_PUBLIC_API_URL` are baked into the frontend image at build time,
so rebuild it (`docker compose build frontend`) after changing them.

## Local development

```bash
yarn install                           # installs both workspaces
cp backend/.env.example backend/.env   # then fill in DATABASE_URL and secrets
yarn workspace chth-backend prisma:migrate
yarn workspace chth-backend dev        # http://localhost:5000/api
yarn workspace chth-frontend dev       # http://localhost:3000
```

## Languages

The storefront (home page, artist stores, cart and checkout, sign-in and the design studio)
comes in English, Persian, Arabic, Russian and Spanish, with right-to-left layout for Persian and
Arabic. Strings live in `frontend/lib/i18n/strings.ts`, keyed by their English text, so a missing
translation shows English; components use `useT()` from `frontend/lib/i18n`. The language comes
from `?lang=`, the `chth_lang` cookie shared by every CHTH site, or the browser, and visitors
switch it in the footer. Product and artist names are shown as written. The account pages are
English for now.

## CHTH kit and hub

`frontend/chth-kit/` and `backend/src/chth-kit/` are generated from the shared CHTH kit (brand
tokens, logo, languages, product links, the "Part of CHTH" footer, signed hub client): don't edit
them here. With `HUB_URL` and `HUB_SECRET` set, the backend reports new orders, sign-ups and
server errors to the CHTH hub, and answers the hub's signed calls at `GET /api/internal/stats`
and `POST /api/internal/orders/status` (the admin bot's order buttons). Without them nothing is
sent and `/api/internal` refuses every call. `cd backend && npm test` checks the signing.
