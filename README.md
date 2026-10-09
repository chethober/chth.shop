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
| `docs/API.md` | REST API reference (also served on the site at `/api-docs`).      |

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
