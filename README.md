<div align="center">

<img src="frontend/public/logo-white.png" alt="CHTH" width="120" />

# chth.shop

**Design merch in 3D, sell it from your own storefront.**

A full-stack platform for artists: a real-time 3D garment designer, per-artist storefronts,
cart and orders, OAuth sign-in, and a Telegram bot for managing stock and sales.

[![CI](https://github.com/chethober/chth.shop/actions/workflows/ci.yml/badge.svg)](https://github.com/chethober/chth.shop/actions/workflows/ci.yml)
[![Release](https://github.com/chethober/chth.shop/actions/workflows/release.yml/badge.svg)](https://github.com/chethober/chth.shop/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![Node 22](https://img.shields.io/badge/Node-22-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)

</div>

![Landing page](docs/screenshots/landing.png)

## Features

- **3D design studio**: pick a garment (tee, hoodie, pants), colourway and artwork, and preview it
  live in a React Three Fiber scene.
- **Artist storefronts**: every artist gets a page at `/<username>` with their bio, social links
  and products (filter by type, sort), editable from the account dashboard.
- **Shop flow**: cart, checkout and order history with cancellation, backed by a products API
  with type, artist and search filters.
- **OAuth-only sign-in**: Google, X (OAuth 2.0 + PKCE) and Telegram Login. The API issues JWTs.
- **Artist program**: users accept the collab terms and open a store; artists earn royalties
  per sale.
- **Telegram bot**: artists manage items, prices and stock from Telegram and get sale and
  low-stock alerts. It runs on Telegram Serverless; see [`telegram-bot/`](telegram-bot/).
- **One-command deploy**: Docker Compose runs PostgreSQL, the API and Next.js, and CI publishes
  images to GHCR.

## Screenshots

| Design studio | Artist storefront |
| :---: | :---: |
| ![Design studio](docs/screenshots/design-studio.png) | ![Storefront](docs/screenshots/storefront.png) |
| **Artist program** | **Sign in** |
| ![Collab](docs/screenshots/collab.png) | ![Sign in](docs/screenshots/sign-in.png) |
| **API reference** (`/api-docs`) | **Mobile** |
| ![API docs](docs/screenshots/api-docs.png) | <img src="docs/screenshots/mobile-landing.png" alt="Mobile landing" width="260" /> |

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Three.js / React Three Fiber / drei, Framer Motion, GSAP, Zustand, HeroUI |
| Backend | Node.js 22, Express 4, Prisma 6, PostgreSQL, Passport, JWT, Helmet, rate limiting |
| Bot | Telegram Serverless (`tgcloud`), SQLite |
| Ops | Docker, Docker Compose, GitHub Actions, GHCR, Dependabot |

## Repository layout

| Path            | What it is                                                              |
| --------------- | ----------------------------------------------------------------------- |
| `frontend/`     | Next.js app (UI). See [frontend/README.md](frontend/README.md).         |
| `backend/`      | Express + Prisma REST API. See [backend/README.md](backend/README.md).  |
| `telegram-bot/` | Artist bot on Telegram Serverless. See its README.                      |
| `docs/API.md`   | REST API reference (also served on the site at `/api-docs`).            |
| `assets/brand/` | Master logo files (the web-ready copies live in `frontend/public`).     |
| `hezar/`        | Separate Python utility app, not used by the shop.                      |
| `specs/`        | Feature specs.                                                          |

## Quick start (Docker)

The whole stack (PostgreSQL, API, Next.js) runs with Docker Compose:

```bash
git clone https://github.com/chethober/chth.shop.git && cd chth.shop
cp .env.example .env    # set JWT_SECRET and SESSION_SECRET (e.g. `openssl rand -hex 32`)
docker compose up -d --build
```

The site is served at http://localhost:3000 (change with `FRONTEND_PORT`). The browser
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

### Prebuilt images

Every push to `main` and every `v*` tag publishes multi-arch images:

```
ghcr.io/chethober/chth-backend:<edge|latest|x.y.z>
ghcr.io/chethober/chth-frontend:<edge|latest|x.y.z>
```

The frontend image expects the API at `http://backend:5000`, the service name used in
`docker-compose.yml`. To run from the images instead of building, replace each `build:` block
in the compose file with the matching `image:`.

## Local development

You need Node.js 22, Yarn 1 (`corepack enable`), and PostgreSQL.

```bash
yarn install                           # installs both workspaces
cp backend/.env.example backend/.env   # then fill in DATABASE_URL and secrets
yarn workspace chth-backend prisma:migrate
yarn workspace chth-backend dev        # http://localhost:5000/api
yarn workspace chth-frontend dev       # http://localhost:3000
```

### Configuration

All settings come from environment variables. The annotated templates are
[`.env.example`](.env.example) (Docker) and [`backend/.env.example`](backend/.env.example) (local).

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET`, `SESSION_SECRET` | yes | Signing secrets: long random strings |
| `FRONTEND_URL` | | Public URL(s) of the site, comma-separated |
| `GOOGLE_CLIENT_ID` / `_SECRET` | | Google sign-in |
| `TWITTER_CLIENT_ID` / `_SECRET` | | X sign-in |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` | | Telegram Login widget |

Every sign-in provider is optional; providers without keys are simply unavailable. OAuth
callback setup is described in [backend/README.md](backend/README.md#oauth-and-other-devices).

## CI/CD

| Workflow | Trigger | What it does |
| --- | --- | --- |
| [`ci.yml`](.github/workflows/ci.yml) | PRs, pushes to `main` | Frontend typecheck + production build, ESLint (non-blocking for now), Prisma schema validation + backend syntax check, Docker image builds, compose validation |
| [`release.yml`](.github/workflows/release.yml) | pushes to `main`, `v*.*.*` tags | Builds `linux/amd64` + `linux/arm64` images and pushes them to GHCR; tags also create a GitHub release with generated notes |
| [`issues.yml`](.github/workflows/issues.yml) | new issues | Auto-labels and acknowledges issues |
| [Dependabot](.github/dependabot.yml) | weekly | npm, GitHub Actions and Docker base-image updates |

To cut a release:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

## Contributing

Contributions are welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started. Please
follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report security issues privately as
described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Cheth
