import axios, { type AxiosError } from 'axios'
import { API_URL } from './config'
import type {
  Cart,
  CartItem,
  CatalogItem,
  Collectible,
  LineOptions,
  Order,
  OrderStatus,
  Pagination,
  PaymentMethods,
  PaymentStart,
  Payout,
  PayoutBalance,
  PayoutSummary,
  Product,
  ProductInput,
  ProductType,
  ReferralInfo,
  Review,
  SalesReport,
  Store,
  StoreInput,
  StoreKind,
  StoreSummary,
  User,
} from '@/types'

const TOKEN_KEY = 'token'

/** Error thrown for any failed API call, carrying the HTTP status when there is one. */
export class ApiError extends Error {
  constructor(message: string, public status = 0) {
    super(message)
    this.name = 'ApiError'
  }
}

interface Envelope<T> {
  success: boolean
  message?: string
  data: T
}

/* ---------- Token storage ---------- */

export const tokenStorage = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

let handleUnauthorized: () => void = () => {}

/** Registers what to do when the API rejects the stored token (e.g. clear the session). */
export function onUnauthorized(handler: () => void) {
  handleUnauthorized = handler
}

/* ---------- HTTP client ---------- */

const http = axios.create({ baseURL: API_URL, timeout: 10_000 })

http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (!error.response) {
      return Promise.reject(new ApiError('Network error - please check your connection'))
    }
    const { status, data } = error.response
    if (status === 401 && tokenStorage.get()) {
      tokenStorage.clear()
      handleUnauthorized()
    }
    return Promise.reject(new ApiError(data?.message || 'Something went wrong', status))
  }
)

async function request<T>(promise: Promise<{ data: Envelope<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}

/* ---------- Endpoints ---------- */

export interface ProductQuery {
  type?: string
  kind?: StoreKind
  search?: string
  store?: string
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'name' | 'top'
  /** `drops`: limited editions, NFT-backed items and timed releases. */
  collection?: 'drops'
  /** `1`: only stores the signed-in user follows. */
  following?: '1'
  page?: number
  limit?: number
}

export const api = {
  auth: {
    /** Starts a redirect-based OAuth sign-in; the backend sends the browser back to /auth/callback. */
    providerUrl: (provider: 'google' | 'x' | 'telegram') => `${API_URL}/auth/${provider}`,
    /** Opens the CHTH bot, which replies with a one-tap sign-in button back to /auth/callback. */
    telegramBotUrl: () => `${API_URL}/auth/telegram/bot`,
    /** Telegram Mini App sign-in with `Telegram.WebApp.initData`. */
    telegramWebApp: (initData: string) =>
      request<{ user: User; token: string; startParam: string | null }>(http.post('/auth/telegram/webapp', { initData })),
    me: () => request<{ user: User }>(http.get('/auth/me')).then((d) => d.user),
    updateUsername: (newUsername: string) =>
      request<{ user: User; token: string }>(http.put('/auth/username', { newUsername })),
  },

  users: {
    isUsernameAvailable: (username: string) =>
      request<{ available: boolean }>(http.get('/users/username-available', { params: { username } })).then(
        (d) => d.available
      ),
    deleteAccount: () => request<void>(http.delete('/users/me')),
  },

  stores: {
    get: (username: string) => request<{ store: Store }>(http.get(`/stores/${username}`)).then((d) => d.store),
    me: () => request<{ store: Store }>(http.get('/stores/me')).then((d) => d.store),
    sales: () => request<SalesReport>(http.get('/stores/me/sales')),
    create: (profile: StoreInput) => request<{ store: Store }>(http.post('/stores', profile)).then((d) => d.store),
    update: (profile: Partial<StoreInput>) =>
      request<{ store: Store }>(http.put('/stores', profile)).then((d) => d.store),
    remove: () => request<void>(http.delete('/stores')),
    acceptContract: (kind: StoreKind) =>
      request<{ store: Store }>(http.post('/stores/contract/accept', { kind })).then((d) => d.store),
    follow: (username: string) =>
      request<{ followerCount: number }>(http.put(`/stores/${username}/follow`)).then((d) => d.followerCount),
    unfollow: (username: string) =>
      request<{ followerCount: number }>(http.delete(`/stores/${username}/follow`)).then((d) => d.followerCount),
    following: () => request<{ stores: StoreSummary[] }>(http.get('/stores/following')).then((d) => d.stores),
  },

  catalog: () => request<{ catalog: CatalogItem[] }>(http.get('/catalog')).then((d) => d.catalog),

  products: {
    list: (query: ProductQuery = {}) =>
      request<{ products: Product[]; pagination: Pagination }>(http.get('/products', { params: query })),
    get: (id: string) => request<{ product: Product }>(http.get(`/products/${id}`)).then((d) => d.product),
    mine: () => request<{ products: Product[] }>(http.get('/products/mine')).then((d) => d.products),
    create: (product: ProductInput) =>
      request<{ product: Product }>(http.post('/products', product)).then((d) => d.product),
    update: (id: string, changes: ProductInput) =>
      request<{ product: Product }>(http.put(`/products/${id}`, changes)).then((d) => d.product),
    remove: (id: string) => request<void>(http.delete(`/products/${id}`)),
    reviews: (id: string) => request<{ reviews: Review[]; canReview: boolean }>(http.get(`/products/${id}/reviews`)),
    review: (id: string, rating: number, body: string) =>
      request<void>(http.put(`/products/${id}/reviews`, { rating, body })),
    deleteReview: (id: string) => request<void>(http.delete(`/products/${id}/reviews`)),
  },

  wishlist: {
    list: () => request<{ products: Product[]; ids: string[] }>(http.get('/wishlist')),
    add: (productId: string) => request<void>(http.put(`/wishlist/${productId}`)),
    remove: (productId: string) => request<void>(http.delete(`/wishlist/${productId}`)),
  },

  referrals: {
    me: () => request<ReferralInfo>(http.get('/referrals/me')),
    claim: (code: string) =>
      http.post<{ message: string }>('/referrals/claim', { code }).then((response) => response.data.message),
    setRewardAddress: (address: string | null) => request<void>(http.put('/referrals/address', { address })),
  },

  payouts: {
    me: () => request<PayoutSummary>(http.get('/payouts/me')),
  },

  collectibles: {
    mine: () => request<{ collectibles: Collectible[] }>(http.get('/collectibles')).then((d) => d.collectibles),
    claim: (id: string, address: string) =>
      request<{ collectible: Collectible }>(http.post(`/collectibles/${id}/claim`, { address })).then((d) => d.collectible),
    verify: (serial: string) =>
      request<{ collectible: Collectible }>(http.get(`/collectibles/verify/${encodeURIComponent(serial)}`)).then(
        (d) => d.collectible
      ),
  },

  /** Uploads an image (as a data URL) and returns its `/uploads/...` path. */
  uploadImage: (dataUrl: string) =>
    request<{ url: string }>(http.post('/uploads', { dataUrl }, { timeout: 30_000 })).then((d) => d.url),

  cart: {
    get: () => request<{ cart: Cart }>(http.get('/cart')).then((d) => d.cart),
    add: (line: CartLineInput) =>
      request<{ cartItem: CartItem }>(http.post('/cart', line)).then((d) => d.cartItem),
    updateItem: (itemId: string, quantity: number) =>
      request<{ cartItem: CartItem }>(http.put(`/cart/items/${itemId}`, { quantity })).then((d) => d.cartItem),
    removeItem: (itemId: string) => request<void>(http.delete(`/cart/items/${itemId}`)),
    clear: () => request<void>(http.delete('/cart')),
  },

  orders: {
    list: () => request<{ orders: Order[] }>(http.get('/orders')).then((d) => d.orders),
    get: (orderId: string) => request<{ order: Order }>(http.get(`/orders/${orderId}`)).then((d) => d.order),
    create: (shippingAddress: string) =>
      request<{ order: Order }>(http.post('/orders', { shippingAddress })).then((d) => d.order),
    /** Starts (or resumes) paying: a hosted checkout URL, or a TON Connect transaction request. */
    pay: (orderId: string, method: 'hosted' | 'ton' | 'usdt' = 'hosted', walletAddress?: string) =>
      request<PaymentStart>(http.post(`/orders/${orderId}/pay`, { method, walletAddress }, { timeout: 30_000 })),
    /** Asks the server to look for this order's TON transfer now. */
    checkTon: (orderId: string) =>
      request<{ order: Order }>(http.post(`/orders/${orderId}/ton/check`, {}, { timeout: 30_000 })).then((d) => d.order),
    cancel: (orderId: string) =>
      request<{ order: Order }>(http.put(`/orders/${orderId}/cancel`)).then((d) => d.order),
  },

  payments: {
    methods: () => request<PaymentMethods>(http.get('/payments/methods')),
    confirmMock: (orderId: string) => request<void>(http.post(`/payments/mock/${orderId}/confirm`)),
  },

  admin: {
    orders: (status?: OrderStatus) =>
      request<{ orders: Order[] }>(http.get('/admin/orders', { params: { status } })).then((d) => d.orders),
    setOrderStatus: (orderId: string, status: OrderStatus) =>
      request<{ order: Order }>(http.put(`/admin/orders/${orderId}/status`, { status })).then((d) => d.order),
    payouts: () =>
      request<{ balances: PayoutBalance[]; payouts: Payout[]; minAmount: number; holdDays: number; automatic: boolean }>(
        http.get('/admin/payouts')
      ),
    runPayouts: () =>
      request<{ payouts: Payout[]; skipped: { username: string; amount: number; reason: string }[] }>(
        http.post('/admin/payouts/run', {}, { timeout: 120_000 })
      ),
    sendPayout: (id: string) =>
      request<{ payout: Payout }>(http.post(`/admin/payouts/${id}/send`, {}, { timeout: 120_000 })).then((d) => d.payout),
    markPayoutSent: (id: string, txHash: string) =>
      request<{ payout: Payout }>(http.put(`/admin/payouts/${id}/sent`, { txHash })).then((d) => d.payout),
    cancelPayout: (id: string) => request<void>(http.delete(`/admin/payouts/${id}`)),
  },
}

/** A store listing (`productId`) or the buyer's own design on a catalog blank (`type`). */
export type CartLineInput = { quantity?: number; options?: LineOptions } & (
  | { productId: string; type?: never }
  | { type: ProductType; productId?: never }
)

export default api
