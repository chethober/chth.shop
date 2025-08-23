// User types
export interface User {
  id: number;
  username: string;
  email: string;
  isArtist?: boolean;
  googleId?: string;
  isGoogleUser?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Artist types
export interface Artist {
  id: number;
  userId: number;
  bio: string | null;
  storeName: string | null;
  contractAccepted?: boolean;
  contractAcceptedAt?: string;
  user?: User;
  products?: Product[];
  createdAt?: string;
  updatedAt?: string;
}

// Product types
export type ProductType = 'tshirt' | 'hoodie' | 'pants';

export interface ProductCustomization {
  color?: string;
  texture?: string;
  design?: string;
  logoUrl?: string;
  [key: string]: any;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  type: string;
  imageUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginationData {
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationData;
}

export interface ArtistsResponse {
  artists: Artist[];
  pagination: PaginationData;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface GoogleAuthResponse {
  user: User;
  token: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Google OAuth types
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

// Form types
export interface ProductFormData {
  name: string;
  type: ProductType;
  price: number;
  imageUrl?: string;
  customization?: ProductCustomization;
}

export interface ArtistProfileFormData {
  bio: string;
  storeName: string;
}

// 3D Design types
export interface ColorOption {
  name: string;
  value: string;
  hex: string;
}

export interface TextureOption {
  name: string;
  url: string;
  preview: string;
}

export interface DesignState {
  selectedProductType: ProductType;
  color: string;
  texture: string | null;
  uploadedDesign: string | null;
  logoPosition: { x: number; y: number; z: number };
  logoScale: number;
}

export interface Model3D {
  type: ProductType;
  path: string;
  name: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

// Store types
export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export interface ProductStore {
  products: Product[];
  userProducts: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  fetchProducts: (params?: { type?: ProductType; artist?: string; page?: number }) => Promise<void>;
  fetchUserProducts: () => Promise<void>;
  createProduct: (data: ProductFormData) => Promise<void>;
  updateProduct: (id: string, data: Partial<ProductFormData>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setCurrentProduct: (product: Product | null) => void;
}

export interface DesignStore {
  designState: DesignState;
  availableColors: ColorOption[];
  availableTextures: TextureOption[];
  updateDesign: (updates: Partial<DesignState>) => void;
  resetDesign: () => void;
  saveDesign: (name: string) => Promise<void>;
}

// Component props
export interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
  showArtist?: boolean;
}

export interface ArtistCardProps {
  artist: Artist;
  onClick?: (artist: Artist) => void;
}

export interface Model3DViewerProps {
  productType: ProductType;
  color?: string;
  texture?: string | null;
  design?: string | null;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface ColorPickerProps {
  colors: ColorOption[];
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onUpload: (file: File) => void;
  onError?: (error: string) => void;
  preview?: boolean;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  requireAuth?: boolean;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class CustomError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'CustomError';
    this.status = status;
    this.code = code;
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
