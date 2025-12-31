import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  User,
  ApiError,
  Product,
  CreateProductDto,
  UpdateProductDto,
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  Sale,
  CreateSaleDto,
  SalesStatistics,
  PaginatedResponse,
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем токен к каждому запросу
    this.api.interceptors.request.use((config) => {
      const publicEndpoints = ['/auth/login', '/auth/register'];
      const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url?.includes(endpoint));

      if (!isPublicEndpoint) {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      return config;
    });

    // Обработка ошибок
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Токен истек или невалиден
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          // Не перенаправляем автоматически, чтобы компоненты могли обработать ошибку
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', loginDto);
    return response.data;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', registerDto);
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.api.get<User>('/auth/me');
    return response.data;
  }

  // Users endpoints
  async getUsers(): Promise<User[]> {
    const response = await this.api.get<User[]>('/users');
    return response.data;
  }

  // Products endpoints
  async getProducts(params?: {
    search?: string;
    category?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    const response = await this.api.get<PaginatedResponse<Product>>('/products', { params });
    return response.data;
  }

  async getProduct(id: number): Promise<Product> {
    const response = await this.api.get<Product>(`/products/${id}`);
    return response.data;
  }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const response = await this.api.post<Product>('/products', createProductDto);
    return response.data;
  }

  async updateProduct(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const response = await this.api.patch<Product>(`/products/${id}`, updateProductDto);
    return response.data;
  }

  async deleteProduct(id: number): Promise<void> {
    await this.api.delete(`/products/${id}`);
  }

  async uploadProductImage(id: number, file: File): Promise<Product> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.api.post<Product>(`/products/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteProductImage(id: number, imageUrl: string): Promise<Product> {
    const response = await this.api.delete<Product>(`/products/${id}/images`, {
      data: { imageUrl },
    });
    return response.data;
  }

  // Categories endpoints
  async getCategories(): Promise<Category[]> {
    const response = await this.api.get<Category[]>('/categories');
    return response.data;
  }

  async getCategory(id: number): Promise<Category> {
    const response = await this.api.get<Category>(`/categories/${id}`);
    return response.data;
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const response = await this.api.post<Category>('/categories', createCategoryDto);
    return response.data;
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const response = await this.api.patch<Category>(`/categories/${id}`, updateCategoryDto);
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  // Sales endpoints
  async createSale(createSaleDto: CreateSaleDto): Promise<Sale> {
    const response = await this.api.post<Sale>('/sales', createSaleDto);
    return response.data;
  }

  async getSales(params?: {
    productId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Sale>> {
    const response = await this.api.get<PaginatedResponse<Sale>>('/sales', { params });
    return response.data;
  }

  async getSale(id: number): Promise<Sale> {
    const response = await this.api.get<Sale>(`/sales/${id}`);
    return response.data;
  }

  async getSalesStatistics(startDate?: string, endDate?: string): Promise<SalesStatistics> {
    const response = await this.api.get<SalesStatistics>('/sales/statistics', {
      params: { startDate, endDate },
    });
    return response.data;
  }
}

export const apiService = new ApiService();



