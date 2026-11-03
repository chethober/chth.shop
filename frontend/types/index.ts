// Shapes of the data returned by the backend API.

export type AuthProvider = 'google' | 'telegram'

export type UserRole = 'CUSTOMER' | 'ADMIN'

export interface User {
  id: string
  username: string
  email: string
  isSeller?: boolean | null
  role?: UserRole
  authProvider?: AuthProvider | string | null
  googleId?: string | null
  telegramId?: string | null
  createdAt?: string
  updatedAt?: string
}

/** Base products the platform prints on. */
export type ProductType =
  | 'tshirt'
  | 'hoodie'
  | 'pants'
  | 'hat'
  | 'beanie'
  | 'mug'
  | 'cup'
  | 'bottle'
  | 'tote'
  | 'phonecase'
  | 'poster'
  | 'sticker'

export interface CatalogItem {
  type: ProductType
  name: string
  description: string
  baseCost: number
  retailPrice: number
  sizes: string[]
  colors: string[]
  customizable: boolean
}

type Vec3 = [number, number, number]

/** A movable image or text layer placed on a product in the 3D studio. */
export interface DesignLayer {
  id: string
  type: 'image' | 'text'
  content: string
  imageUrl?: string
  position: Vec3
  rotation: number
  scale: Vec3
  color?: string
  fontSize?: number
}

export interface Design {
  color: string | null
  logoUrl: string | null
  layers: DesignLayer[]
}

export type StoreKind = 'ARTIST' | 'MERCHANT'

export interface StoreSummary {
  id: string
  kind: StoreKind
  storeName: string | null
  username: string
}

export interface Product {
  id: string
  name: string
  description?: string | null
  type: string
  price: number
  imageUrl: string | null
  colors: string[]
  sizes: string[]
  customizable: boolean
  design?: Design | null
  isActive: boolean
  nftBacked: boolean
  editionSize: number | null
  editionsSold: number
  editionsRemaining: number | null
  dropStartsAt: string | null
  dropEndsAt: string | null
  dropStatus: 'upcoming' | 'live' | 'ended' | null
  ratingAvg: number
  ratingCount: number
  store?: StoreSummary | null
  createdAt?: string
  updatedAt?: string
}

export type ProductInput = Partial<
  Pick<
    Product,
    | 'name'
    | 'description'
    | 'type'
    | 'price'
    | 'imageUrl'
    | 'colors'
    | 'sizes'
    | 'customizable'
    | 'isActive'
    | 'nftBacked'
    | 'editionSize'
    | 'dropStartsAt'
    | 'dropEndsAt'
  >
> & { design?: Design | null }

export interface Pagination {
  total: number
  page: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
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

export interface Store extends SocialHandles {
  id: string
  userId: string
  kind: StoreKind
  bio: string | null
  storeName: string | null
  payoutAddress?: string | null
  payoutNetwork?: string | null
  createdAt?: string
  updatedAt?: string
  user?: Pick<User, 'username' | 'email'>
  products?: Product[]
  followerCount?: number
  isFollowing?: boolean
}

export type StoreInput = SocialHandles & {
  kind: StoreKind
  storeName: string
  bio: string
  payoutAddress: string
  payoutNetwork: string
}

/** What the buyer picked for a cart / order line. */
export interface LineOptions {
  size?: string
  color?: string
  design?: Design
  /** On order lines: the listing's design at purchase time, when the buyer didn't personalize. */
  sellerDesign?: Design
  previewUrl?: string
}

export interface CartItem {
  id: string
  productId: string | null
  type: string
  name: string
  options: LineOptions
  quantity: number
  unitPrice: number
  product: (Pick<Product, 'id' | 'name' | 'type' | 'price' | 'imageUrl'> & { store?: StoreSummary | null }) | null
}

export interface Cart {
  id: string | null
  items: CartItem[]
  totalItems: number
  totalPrice: number
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export type PaymentStatus =
  | 'UNPAID'
  | 'WAITING'
  | 'CONFIRMING'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'EXPIRED'
  | 'FAILED'
  | 'REFUNDED'

export interface OrderItem {
  id: string
  productId: string | null
  type: string
  name: string
  options: LineOptions
  quantity: number
  price: number
  imageUrl: string | null
  store: StoreSummary | null
}

export interface Order {
  id: string
  status: OrderStatus
  subtotal: number
  discount: number
  total: number
  currency: string
  shippingAddress?: string | null
  paymentStatus: PaymentStatus
  paymentUrl?: string | null
  payCurrency?: string | null
  txHash?: string | null
  paidAt?: string | null
  createdAt: string
  items: OrderItem[]
  customer?: Pick<User, 'username' | 'email'>
}

export interface Sale {
  id: string
  orderId: string
  orderStatus: OrderStatus
  paidAt: string | null
  name: string
  type: string
  options: Pick<LineOptions, 'size' | 'color'>
  quantity: number
  price: number
  earning: number
}

export interface SalesReport {
  summary: { unitsSold: number; revenue: number; earnings: number }
  sales: Sale[]
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

export interface PaymentMethods {
  hosted: boolean
  ton: boolean
  hostedProvider: string
  tonNetwork: 'mainnet' | 'testnet'
}

/** What POST /orders/:id/pay returns for each method. */
export type PaymentStart =
  | { method: 'hosted'; paymentUrl: string; provider: string }
  | {
      method: 'ton'
      address: string
      /** Nanotons. */
      amount: string
      amountTon: string
      /** Base64 BOC of the comment that identifies the order. */
      payload: string
      validUntil: number
      network: 'mainnet' | 'testnet'
    }

export type CollectibleStatus = 'UNCLAIMED' | 'MINTING' | 'MINTED' | 'FAILED'

export interface Collectible {
  id: string
  serial: string
  name: string
  imageUrl: string | null
  productId: string | null
  productType: string | null
  store: { storeName: string | null; username: string } | null
  edition: number | null
  editionSize: number | null
  status: CollectibleStatus
  ownerAddress: string | null
  nftIndex: number | null
  nftAddress: string | null
  mintError: string | null
  claimedAt: string | null
  createdAt: string
  ownerUsername?: string
}

export interface Review {
  id: string
  rating: number
  body: string | null
  username: string
  isMine: boolean
  createdAt: string
}

export interface ReferralInfo {
  code: string
  invited: number
  converted: number
  earned: number
  discountPercent: number
  rewardPercent: number
  referredBy: string | null
  hasWelcomeDiscount: boolean
}
