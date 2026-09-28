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

## Getting started

```bash
npm install                            # installs both workspaces
cp backend/.env.example backend/.env   # then fill in DATABASE_URL and secrets
npm run prisma:migrate --workspace=backend
npm run dev --workspace=backend        # http://localhost:5000/api
npm run dev --workspace=frontend       # http://localhost:3000
```
