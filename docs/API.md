# CHTH API reference

The REST API served by `backend/` (Express + Prisma). Every route is declared in
[`backend/src/routes/index.js`](../backend/src/routes/index.js); this document describes
what each one accepts and returns. The site also shows this reference at `/api-docs`
(`frontend/features/api-docs/api-reference.ts`), so update both when the API changes.

## Basics

**Base URL.** All endpoints live under `/api`. Browsers call the site's own origin
(`https://<site>/api/...`): Next.js proxies `/api` and `/uploads` to the backend
(`frontend/next.config.js`). In local development the backend listens on
`http://localhost:5000/api`.

**Bodies.** Requests with a body are JSON (`Content-Type: application/json`, max 10 MB).

**Response envelope.**

```jsonc
// 2xx
{ "success": true, "message": "Optional human-readable message", "data": { /* ... */ } }
// 4xx / 5xx
{ "success": false, "message": "What went wrong" }
```

`data` is omitted when there's nothing to return (for example after a delete). In
development, 500 responses also carry an `error` field with the underlying message.

**Authentication.** Sign-in is OAuth only (Google, X, Telegram). A successful sign-in
ends with a JWT, valid for 7 days. Send it on protected routes:

```
Authorization: Bearer <token>
```

| Status | `message` | Cause |
| --- | --- | --- |
| 401 | `Access token is required` | No `Bearer` header on a protected route |
| 401 | `Token expired` | The JWT is past its 7-day lifetime |
| 401 | `Invalid token` | Bad signature or malformed token |
| 401 | `Invalid token - user not found` | The account was deleted |

Routes marked **optional** accept a token but also work without one.

**Common errors.**

| Status | When |
| --- | --- |
| 400 | Validation failed (the message says which field) |
| 403 | Not allowed (e.g. editing another artist's product) |
| 404 | Resource not found, or `API endpoint not found` for unknown routes |
| 409 | Conflict: username taken, or deleting a product that appears in orders |
| 429 | Rate limit: `RATE_LIMIT_MAX_REQUESTS` (default 100) per IP per `RATE_LIMIT_WINDOW_MS` (default 15 min). Production only; `/health` is exempt |

**IDs** are UUID strings. **Prices** are numbers in the store currency.

## Meta

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api` | – | API name and the list of resource prefixes |
| GET | `/api/health` | – | `{ success, message: "Server is running", timestamp }` |

## Auth

The sign-in routes are browser redirects, not JSON calls: send the user's browser to the
`start` URL. The provider returns to the matching callback, and the backend then redirects to
the frontend:

- **Success:** `/auth/callback?token=<jwt>&user=<json>`. `user` holds `{ id, username, email, authProvider }`.
- **Failure:** `/auth?error=<code>`, for example `google_not_configured`, `oauth_failed`,
  `x_invalid_state`, `telegram_token_failed` or `telegram_bot_failed`.

Redirect URLs are built from the origin the user started on, which must be allowed by `FRONTEND_URL`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/auth/google` → `/api/auth/google/callback` | – | Google OAuth |
| GET | `/api/auth/x` → `/api/auth/x/callback` | – | X OAuth 2.0 with PKCE. `/auth/twitter` and `/auth/twitter/callback` are aliases |
| GET | `/api/auth/telegram` → `/api/auth/telegram/callback` | – | Telegram OAuth (OpenID Connect, PKCE) |
| GET | `/api/auth/telegram/bot` → `/api/auth/telegram/bot/callback` | – | Sign in through the Telegram bot. It sends a one-tap login button, and the callback verifies Telegram's signed login data |
| GET | `/api/auth/me` | ✓ | Current user, including the `artist` profile if there is one |
| PUT | `/api/auth/username` | ✓ | Change username. Returns a **new token** |

### `PUT /api/auth/username`

```json
{ "newUsername": "new_name" }
```

The username must be at least 5 characters, using only letters, digits and `_`. The route
returns 409 if another user has the name. The response is `data: { user, token }`. Replace the
stored token with the new one, because the old one still carries the old username.

## Users

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/users/me` | ✓ | Current user (same as `/auth/me`) |
| GET | `/api/users/username-available?username=` | ✓ | `data: { available }`. Invalid names return `false`; your own name returns `true` |
| DELETE | `/api/users/me` | ✓ | Delete the account. The artist profile, products, cart and orders are deleted with it |

**User object:** `{ id, username, email, googleId, twitterId, telegramId, authProvider, isGoogleUser, isArtist, createdAt, updatedAt, artist? }`

## Artists

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/artists` | – | All artists, newest first, each with `user.username` and their 3 latest products |
| GET | `/api/artists/:username` | – | `data: { artist, products }` |
| GET | `/api/artists/profile/me` | ✓ | Your artist profile. 404 if you don't have one |
| POST | `/api/artists/contract/accept` | ✓ | Join the artist program. Creates a default store (`"<username>'s Store"`) if you don't have one yet. Safe to call more than once |
| POST | `/api/artists` | ✓ | Create your store. `storeName` is required. 400 if you already have one. Returns 201 |
| PUT | `/api/artists` | ✓ | Update your store |
| DELETE | `/api/artists` | ✓ | Delete your store and its products |

**Profile fields** (POST/PUT body):
`storeName, bio, instagram, twitter, tiktok, youtube, spotify, telegram, discord, website`.
All are strings.

**Note:** PUT writes every profile field, so a field you leave out is cleared. Send the full profile.

**Artist object:** the profile fields plus `{ id, userId, createdAt, updatedAt, user: { username, email } }`.

## Products

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/products` | optional | Browse products, newest first. Paginated |
| GET | `/api/products/:id` | – | One product, with its artist |
| GET | `/api/products/artist/:username` | – | `data: { artist, products }` |
| GET | `/api/products/user/me` | ✓ | Your products. Empty if you aren't an artist |
| POST | `/api/products` | ✓ artist | Create a product. Returns 201 |
| PUT | `/api/products/:id` | ✓ owner | Update the fields you send |
| DELETE | `/api/products/:id` | ✓ owner | Delete. 409 if the product appears in an order |

### `GET /api/products`

| Query | Description |
| --- | --- |
| `type` | Exact product type, e.g. `tshirt` |
| `artist` | Artist username |
| `search` | Case-insensitive match on the name |
| `page`, `limit` | Defaults: 1 and 20 |

The response is `data: { products, pagination: { total, page, pages, limit, hasNext, hasPrev } }`.
`/products/user/me` returns the same shape as a single page, without `limit`.

### `POST /api/products` / `PUT /api/products/:id`

```json
{ "name": "Tour Tee", "type": "tshirt", "price": 35, "imageUrl": "/uploads/tee.png" }
```

`name`, `type` and `price` are required on create, and `imageUrl` is optional. Only artists
can create products (403 otherwise), and only the owner can update or delete one.

**Product object:** `{ id, name, type, price, imageUrl, artistId, createdAt, updatedAt, artist }`

## Cart

Every user has one cart, which is created on first use.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/cart` | ✓ | `data: { cart: { id, items, totalItems, totalPrice } }` |
| POST | `/api/cart` | ✓ | Add `{ productId, quantity? }`. `quantity` defaults to 1, and adding a product that's already in the cart increases its quantity |
| DELETE | `/api/cart` | ✓ | Remove every item |
| PUT | `/api/cart/items/:itemId` | ✓ | Set `{ quantity }` (at least 1) |
| DELETE | `/api/cart/items/:itemId` | ✓ | Remove one item |

**Cart item:** `{ id, cartId, productId, quantity, createdAt, updatedAt, product: { id, name, type, price, imageUrl, artist: { id, storeName, username } } }`

## Orders

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/orders` | ✓ | Your orders, newest first |
| POST | `/api/orders` | ✓ | Check out the cart. Returns 201 |
| GET | `/api/orders/:orderId` | ✓ | One of your orders |
| PUT | `/api/orders/:orderId/cancel` | ✓ | Cancel. Only `PENDING` orders can be cancelled (400 otherwise) |

### `POST /api/orders`

```json
{ "shippingAddress": "1 Example St, City" }
```

`shippingAddress` is required, and the call returns 400 if the cart is empty. Each line is
priced at the product's current price. The cart is emptied in the same transaction, and the
artists and admins get a Telegram notification if that's configured.

**Order object:** `{ id, userId, status, total, shippingAddress, createdAt, updatedAt, items: [{ id, orderId, productId, quantity, price, product }] }`

**Status values:** `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`

## Static files

| Method | Path | Description |
| --- | --- | --- |
| GET | `/uploads/<file>` | Uploaded product images, referenced by `imageUrl`. This path is outside `/api` |
