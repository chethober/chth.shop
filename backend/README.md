# CHTH backend

Express REST API with Prisma (PostgreSQL). Sign-in is OAuth only (Google, X, Telegram); the API issues JWTs.

```bash
cp .env.example .env        # DATABASE_URL, JWT_SECRET, SESSION_SECRET, OAuth keys
npm run prisma:migrate
npm run db:seed             # optional demo artists and products (wipes users!)
npm run dev                 # http://localhost:5000/api
```

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
  services/               Logic shared by controllers (OAuth identity, X, Telegram).
  middleware/             requireAuth / optionalAuth, 404 + error handler.
  lib/                    prisma client, HTTP helpers, JWT, query shapes, response serializers.
prisma/                   Schema and migrations.
scripts/seed.js           Demo data.
```

Controllers throw `HttpError(status, message)`; the error middleware turns it into
`{ success: false, message }`. Successful responses are `{ success: true, message?, data }`.

## Endpoints (all under `/api`)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | – | Health check |
| GET | `/auth/google`, `/auth/google/callback` | – | Google OAuth |
| GET | `/auth/x`, `/auth/x/callback` (also `/auth/twitter/…`) | – | X OAuth 2.0 (PKCE) |
| GET | `/auth/telegram/config` | – | Telegram widget config |
| GET | `/auth/telegram/callback` · POST `/auth/telegram` | – | Telegram login (redirect / JSON) |
| GET | `/auth/me` | ✓ | Current user |
| PUT | `/auth/username` | ✓ | Change username (returns a new token) |
| GET | `/users/me` | ✓ | Current user |
| GET | `/users/username-available?username=` | ✓ | Username availability |
| DELETE | `/users/me` | ✓ | Delete account (cascades) |
| GET | `/artists` · `/artists/:username` | – | List / view artists |
| GET | `/artists/profile/me` | ✓ | Own artist profile |
| POST · PUT · DELETE | `/artists` | ✓ | Create / update / delete own store |
| POST | `/artists/contract/accept` | ✓ | Join the artist program |
| GET | `/products` (`?type&artist&search&page&limit`) | – | Browse products |
| GET | `/products/:id` · `/products/artist/:username` | – | Product / artist products |
| GET | `/products/user/me` | ✓ | Own products |
| POST · PUT · DELETE | `/products`, `/products/:id` | ✓ | Manage own products |
| GET · POST · DELETE | `/cart` | ✓ | View / add to / clear cart |
| PUT · DELETE | `/cart/items/:itemId` | ✓ | Change quantity / remove |
| GET · POST | `/orders` | ✓ | List orders / check out the cart |
| GET | `/orders/:orderId` | ✓ | Order details |
| PUT | `/orders/:orderId/cancel` | ✓ | Cancel a pending order |
