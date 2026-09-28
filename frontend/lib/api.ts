import axios, { type AxiosError } from 'axios'
import { API_URL } from './config'
import type {
  Artist,
  ArtistProfileInput,
  Cart,
  CartItem,
  Order,
  Product,
  TelegramAuthData,
  TelegramConfig,
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

export const api = {
  auth: {
    googleUrl: `${API_URL}/auth/google`,
    xUrl: `${API_URL}/auth/x`,
    telegramConfig: () => request<TelegramConfig>(http.get('/auth/telegram/config')),
    telegram: (data: TelegramAuthData) =>
      request<{ user: User; token: string }>(http.post('/auth/telegram', data)),
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

  artists: {
    get: (username: string) => request<{ artist: Artist }>(http.get(`/artists/${username}`)).then((d) => d.artist),
    me: () => request<{ artist: Artist }>(http.get('/artists/profile/me')).then((d) => d.artist),
    create: (profile: ArtistProfileInput) =>
      request<{ artist: Artist }>(http.post('/artists', profile)).then((d) => d.artist),
    update: (profile: ArtistProfileInput) =>
      request<{ artist: Artist }>(http.put('/artists', profile)).then((d) => d.artist),
    remove: () => request<void>(http.delete('/artists')),
    acceptContract: () =>
      request<{ artist: Artist }>(http.post('/artists/contract/accept')).then((d) => d.artist),
  },

  products: {
    mine: () => request<{ products: Product[] }>(http.get('/products/user/me')).then((d) => d.products),
    update: (id: string, changes: Partial<Pick<Product, 'name' | 'type' | 'price'>>) =>
      request<{ product: Product }>(http.put(`/products/${id}`, changes)).then((d) => d.product),
    remove: (id: string) => request<void>(http.delete(`/products/${id}`)),
  },

  cart: {
    get: () => request<{ cart: Cart }>(http.get('/cart')).then((d) => d.cart),
    add: (productId: string, quantity = 1) =>
      request<{ cartItem: CartItem }>(http.post('/cart', { productId, quantity })).then((d) => d.cartItem),
    updateItem: (itemId: string, quantity: number) =>
      request<{ cartItem: CartItem }>(http.put(`/cart/items/${itemId}`, { quantity })).then((d) => d.cartItem),
    removeItem: (itemId: string) => request<void>(http.delete(`/cart/items/${itemId}`)),
    clear: () => request<void>(http.delete('/cart')),
  },

  orders: {
    list: () => request<{ orders: Order[] }>(http.get('/orders')).then((d) => d.orders),
    create: (shippingAddress: string) =>
      request<{ order: Order }>(http.post('/orders', { shippingAddress })).then((d) => d.order),
    cancel: (orderId: string) =>
      request<{ order: Order }>(http.put(`/orders/${orderId}/cancel`)).then((d) => d.order),
  },
}

export default api
