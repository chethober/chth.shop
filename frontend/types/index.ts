// Shapes of the data returned by the backend API.

export type AuthProvider = 'google' | 'x' | 'telegram'

export interface User {
  id: string
  username: string
  email: string
  isArtist?: boolean | null
  authProvider?: AuthProvider | string | null
  googleId?: string | null
  twitterId?: string | null
  telegramId?: string | null
  createdAt?: string
  updatedAt?: string
}

export type ProductType = 'tshirt' | 'hoodie' | 'pants'

export interface Product {
  id: string
  name: string
  type: string
  price: number
  imageUrl: string | null
  createdAt?: string
  updatedAt?: string
}

export interface SocialHandles {
  instagram?: string | null
  twitter?: string | null
  tiktok?: string | null
  youtube?: string | null
  spotify?: string | null
  telegram?: string | null
  discord?: string | null
  website?: string | null
}

export interface Artist extends SocialHandles {
  id: string
  userId: string
  bio: string | null
  storeName: string | null
  createdAt?: string
  updatedAt?: string
  user?: Pick<User, 'username' | 'email'>
  products?: Product[]
}

export type ArtistProfileInput = SocialHandles & {
  storeName: string
  bio: string
}

export interface CartItem {
  id: string
  productId: string
  quantity: number
  product: (Product & { artist?: { id: string; storeName: string | null; username: string } | null }) | null
}

export interface Cart {
  id: string | null
  items: CartItem[]
  totalItems: number
  totalPrice: number
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product?: Pick<Product, 'id' | 'name' | 'type' | 'imageUrl'> | null
}

export interface Order {
  id: string
  status: OrderStatus
  total: number
  shippingAddress?: string | null
  createdAt: string
  items: OrderItem[]
}

export interface TelegramAuthData {
  id: number | string
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export interface TelegramConfig {
  botUsername: string
  isConfigured: boolean
}
