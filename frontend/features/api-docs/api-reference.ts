// Public API reference shown at /api-docs. Mirrors docs/API.md; source of truth is
// backend/src/routes/index.js — update all three together.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** `required` needs a Bearer token; `optional` uses one when present. */
export type EndpointAuth = 'none' | 'optional' | 'required'

export interface Endpoint {
  method: HttpMethod
  path: string
  auth: EndpointAuth
  summary: string
  /** Example JSON request body. */
  body?: string
}

export interface EndpointGroup {
  id: string
  title: string
  intro?: string
  endpoints: Endpoint[]
}

export const API_BASE_PATH = '/api'

export const AUTH_ERRORS: { message: string; cause: string }[] = [
  { message: 'Access token is required', cause: 'No Bearer header on a protected route' },
  { message: 'Token expired', cause: 'The JWT is past its 7-day lifetime' },
  { message: 'Invalid token', cause: 'Bad signature or malformed token' },
  { message: 'Invalid token - user not found', cause: 'The account was deleted' },
]

export const STATUS_CODES: { status: number; meaning: string }[] = [
  { status: 400, meaning: 'Validation failed; the message names the field' },
  { status: 401, meaning: 'Missing, expired or invalid token' },
  { status: 403, meaning: 'Not allowed, e.g. editing another artist’s product' },
  { status: 404, meaning: 'Resource or route not found' },
  { status: 409, meaning: 'Username taken, or the product appears in an order' },
  { status: 429, meaning: 'Rate limited (100 requests / 15 min per IP by default)' },
]

export const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    id: 'meta',
    title: 'Meta',
    endpoints: [
      { method: 'GET', path: '/api', auth: 'none', summary: 'API name and the list of resource prefixes.' },
      { method: 'GET', path: '/api/health', auth: 'none', summary: 'Health check with a server timestamp.' },
    ],
  },
  {
    id: 'auth',
    title: 'Auth',
    intro:
      'Sign-in routes are browser redirects, not JSON calls. On success the backend redirects to /auth/callback?token=<jwt>&user=<json>; on failure to /auth?error=<code>.',
    endpoints: [
      { method: 'GET', path: '/api/auth/google', auth: 'none', summary: 'Start Google OAuth. The provider returns to /api/auth/google/callback.' },
      { method: 'GET', path: '/api/auth/x', auth: 'none', summary: 'Start X OAuth 2.0 (PKCE). /auth/twitter is an alias.' },
      { method: 'GET', path: '/api/auth/telegram', auth: 'none', summary: 'Start Telegram OAuth (OpenID Connect, PKCE).' },
      { method: 'GET', path: '/api/auth/telegram/bot', auth: 'none', summary: 'Sign in through the Telegram bot, which sends a one-tap login button.' },
      { method: 'GET', path: '/api/auth/me', auth: 'required', summary: 'Current user, including the artist profile if there is one.' },
      {
        method: 'PUT',
        path: '/api/auth/username',
        auth: 'required',
        summary: 'Change username (at least 5 characters: letters, digits, _). Returns a new token. Replace the stored one.',
        body: '{ "newUsername": "new_name" }',
      },
    ],
  },
  {
    id: 'users',
    title: 'Users',
    endpoints: [
      { method: 'GET', path: '/api/users/me', auth: 'required', summary: 'Current user (same as /auth/me).' },
      { method: 'GET', path: '/api/users/username-available?username=', auth: 'required', summary: 'Returns { available }.' },
      { method: 'DELETE', path: '/api/users/me', auth: 'required', summary: 'Delete the account. The artist profile, products, cart and orders go with it.' },
    ],
  },
  {
    id: 'artists',
    title: 'Artists',
    intro:
      'Profile fields: storeName, bio, instagram, twitter, tiktok, youtube, spotify, telegram, discord, website. PUT writes every field, so a field you leave out is cleared.',
    endpoints: [
      { method: 'GET', path: '/api/artists', auth: 'none', summary: 'All artists, newest first, each with their 3 latest products.' },
      { method: 'GET', path: '/api/artists/:username', auth: 'none', summary: 'One artist and their products.' },
      { method: 'GET', path: '/api/artists/profile/me', auth: 'required', summary: 'Your artist profile.' },
      { method: 'POST', path: '/api/artists/contract/accept', auth: 'required', summary: 'Join the artist program. Creates a default store if needed.' },
      { method: 'POST', path: '/api/artists', auth: 'required', summary: 'Create your store. storeName is required.', body: '{ "storeName": "My Store", "bio": "…" }' },
      { method: 'PUT', path: '/api/artists', auth: 'required', summary: 'Update your store. Send the full profile.' },
      { method: 'DELETE', path: '/api/artists', auth: 'required', summary: 'Delete your store and its products.' },
    ],
  },
  {
    id: 'products',
    title: 'Products',
    endpoints: [
      {
        method: 'GET',
        path: '/api/products',
        auth: 'optional',
        summary: 'Browse products, newest first. Query: type, artist, search, page (default 1), limit (default 20).',
      },
      { method: 'GET', path: '/api/products/:id', auth: 'none', summary: 'One product, with its artist.' },
      { method: 'GET', path: '/api/products/artist/:username', auth: 'none', summary: 'An artist and their products.' },
      { method: 'GET', path: '/api/products/user/me', auth: 'required', summary: 'Your products. Empty if you aren’t an artist.' },
      {
        method: 'POST',
        path: '/api/products',
        auth: 'required',
        summary: 'Create a product (artists only). name, type and price are required.',
        body: '{ "name": "Tour Tee", "type": "tshirt", "price": 35, "imageUrl": "/uploads/tee.png" }',
      },
      { method: 'PUT', path: '/api/products/:id', auth: 'required', summary: 'Update the fields you send (owner only).' },
      { method: 'DELETE', path: '/api/products/:id', auth: 'required', summary: 'Delete (owner only). 409 if the product appears in an order.' },
    ],
  },
  {
    id: 'cart',
    title: 'Cart',
    endpoints: [
      { method: 'GET', path: '/api/cart', auth: 'required', summary: 'Your cart with items, totalItems and totalPrice.' },
      {
        method: 'POST',
        path: '/api/cart',
        auth: 'required',
        summary: 'Add a product. quantity defaults to 1, and adding a product already in the cart increases its quantity.',
        body: '{ "productId": "…", "quantity": 1 }',
      },
      { method: 'DELETE', path: '/api/cart', auth: 'required', summary: 'Remove every item.' },
      { method: 'PUT', path: '/api/cart/items/:itemId', auth: 'required', summary: 'Set the quantity (at least 1).', body: '{ "quantity": 2 }' },
      { method: 'DELETE', path: '/api/cart/items/:itemId', auth: 'required', summary: 'Remove one item.' },
    ],
  },
  {
    id: 'orders',
    title: 'Orders',
    intro: 'Status values: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED.',
    endpoints: [
      { method: 'GET', path: '/api/orders', auth: 'required', summary: 'Your orders, newest first.' },
      {
        method: 'POST',
        path: '/api/orders',
        auth: 'required',
        summary: 'Check out the cart at current prices. Empties the cart.',
        body: '{ "shippingAddress": "1 Example St, City" }',
      },
      { method: 'GET', path: '/api/orders/:orderId', auth: 'required', summary: 'One of your orders.' },
      { method: 'PUT', path: '/api/orders/:orderId/cancel', auth: 'required', summary: 'Cancel a PENDING order.' },
    ],
  },
]
