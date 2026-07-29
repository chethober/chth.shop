import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import {
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  GoogleAuthResponse,
  Product,
  ProductFormData,
  ProductsResponse,
  Artist,
  ArtistsResponse,
  ArtistProfileFormData,
  User,
  CustomError
} from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        const customError = this.handleError(error);
        return Promise.reject(customError);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || Cookies.get('token') || null;
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      Cookies.set('token', token, { expires: 7 }); // 7 days
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      Cookies.remove('token');
    }
  }

  private handleError(error: AxiosError): CustomError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = (data as any)?.message || 'An error occurred';

      // Handle auth errors - clear token storage without forcing hard window redirects
      if (status === 401 || message.toLowerCase().includes('token') || message.toLowerCase().includes('unauthorized')) {
        this.removeToken();
      }

      return new CustomError(message, status, (data as any)?.code);
    } else if (error.request) {
      // Request was made but no response received
      return new CustomError('Network error - please check your connection', 0, 'NETWORK_ERROR');
    } else {
      // Something else happened
      return new CustomError(error.message || 'An unexpected error occurred', 0, 'UNKNOWN_ERROR');
    }
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const { user, token } = response.data.data!;
    this.setToken(token);
    return { user, token };
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    const { user, token } = response.data.data!;
    this.setToken(token);
    return { user, token };
  }

  // Google OAuth methods
  async initiateGoogleAuth(): Promise<void> {
    // Redirect to backend Google OAuth endpoint
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const googleAuthUrl = `${base}/auth/google`;
    window.location.href = googleAuthUrl;
  }

  async handleGoogleCallback(token: string, user: User): Promise<GoogleAuthResponse> {
    this.setToken(token);
    return { user, token };
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data!.user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    return response.data.data!.user;
  }

  async updateUsername(newUsername: string): Promise<{ user: User; token: string }> {
    console.log('Frontend: Calling updateUsername with:', newUsername);
    console.log('Frontend: Request URL:', '/auth/username');
    console.log('Frontend: Request payload:', { newUsername });
    
    try {
      const response = await this.client.put<ApiResponse<{ user: User; token: string }>>('/auth/username', { newUsername });
      console.log('Frontend: Response received:', response);
      return response.data.data!;
    } catch (error) {
      console.error('Frontend: Error in updateUsername:', error);
      throw error;
    }
  }

  logout(): void {
    this.removeToken();
  }

  // Product endpoints
  async getProducts(params?: {
    type?: string;
    artist?: string;
    page?: number;
    limit?: number
  }): Promise<ProductsResponse> {
    const response = await this.client.get<ApiResponse<ProductsResponse>>('/products', { params });
    return response.data.data!;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.client.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
    return response.data.data!.product;
  }

  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await this.client.post<ApiResponse<{ product: Product }>>('/products', data);
    return response.data.data!.product;
  }

  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const response = await this.client.put<ApiResponse<{ product: Product }>>(`/products/${id}`, data);
    return response.data.data!.product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.client.delete(`/products/${id}`);
  }

  async getUserProducts(params?: { page?: number; limit?: number }): Promise<ProductsResponse> {
    const response = await this.client.get<ApiResponse<ProductsResponse>>('/products/user/me', { params });
    return response.data.data!;
  }

  // Artist endpoints
  async getArtists(params?: { page?: number; limit?: number }): Promise<ArtistsResponse> {
    const response = await this.client.get<ApiResponse<ArtistsResponse>>('/artists', { params });
    return response.data.data!;
  }

  async getArtist(username: string): Promise<Artist> {
    const response = await this.client.get<ApiResponse<{ artist: Artist }>>(`/artists/${username}`);
    return response.data.data!.artist;
  }

  async getCurrentArtistProfile(): Promise<Artist> {
    const response = await this.client.get<ApiResponse<{ artist: Artist }>>('/artists/profile/me');
    return response.data.data!.artist;
  }

  async createArtistProfile(data: ArtistProfileFormData): Promise<Artist> {
    const response = await this.client.post<ApiResponse<{ artist: Artist }>>('/artists', data);
    return response.data.data!.artist;
  }

  async updateArtistProfile(data: Partial<ArtistProfileFormData>): Promise<Artist> {
    const response = await this.client.put<ApiResponse<{ artist: Artist }>>('/artists', data);
    return response.data.data!.artist;
  }

  async acceptContract(): Promise<Artist> {
    const response = await this.client.post<ApiResponse<{ artist: Artist }>>('/artists/contract/accept');
    return response.data.data!.artist;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get<ApiResponse<{ status: string; timestamp: string }>>('/health');
    return response.data.data!;
  }

  // File upload utility
  async uploadFile(file: File, endpoint: string = '/upload'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<{ url: string }>>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data!;
  }

  // Generic request methods
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data.data!;
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data!;
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data.data!;
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data.data!;
  }
}

// Create and export a singleton instance
export const api = new ApiClient();

// Export individual methods for convenience
export const {
  login,
  register,
  initiateGoogleAuth,
  handleGoogleCallback,
  getProfile,
  updateProfile,
  updateUsername,
  logout,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getArtists,
  getArtist,
  getCurrentArtistProfile,
  createArtistProfile,
  updateArtistProfile,
  acceptContract,
  healthCheck,
  uploadFile,
} = api;

export default api;
