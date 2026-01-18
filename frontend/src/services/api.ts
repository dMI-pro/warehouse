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
  UpdateSaleDto,
  SalesStatistics,
  Return,
  CreateReturnDto,
  UpdateReturnDto,
  PaginatedResponse,
  Warehouse,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  Committee,
  CreateCommitteeDto,
  UpdateCommitteeDto,
  TransactionType,
  CreateTransactionTypeDto,
  UpdateTransactionTypeDto,
  AuditLog,
  UserStatus,
  CreateUserStatusDto,
  UpdateUserStatusDto,
  CreateUserDto,
  UpdateUserDto,
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

  async getUser(id: number): Promise<User> {
    const response = await this.api.get<User>(`/users/${id}`);
    return response.data;
  }

  async revokeUserSessions(id: number): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>(`/users/${id}/sessions/revoke`, {});
    return response.data;
  }

  async blockUser(id: number): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>(`/users/${id}/block`, {});
    return response.data;
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const response = await this.api.post<User>('/users', createUserDto);
    return response.data;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const response = await this.api.patch<User>(`/users/${id}`, updateUserDto);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.api.delete(`/users/${id}`);
  }

  // Products endpoints
  async getProducts(params?: {
    search?: string;
    category?: number;
    warehouse?: number;
    committee?: number;
    page?: number;
    limit?: number;
    inStock?: boolean;
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

  async reorderProductImages(id: number, images: string[]): Promise<Product> {
    const response = await this.api.patch<Product>(`/products/${id}/images/reorder`, {
      images,
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

  async updateSale(id: number, updateSaleDto: UpdateSaleDto): Promise<Sale> {
    const response = await this.api.patch<Sale>(`/sales/${id}`, updateSaleDto);
    return response.data;
  }

  async deleteSale(id: number): Promise<void> {
    await this.api.delete(`/sales/${id}`);
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

  // Warehouses endpoints
  async getWarehouses(): Promise<Warehouse[]> {
    const response = await this.api.get<Warehouse[]>('/warehouses');
    return response.data;
  }

  async getWarehouse(id: number): Promise<Warehouse> {
    const response = await this.api.get<Warehouse>(`/warehouses/${id}`);
    return response.data;
  }

  async createWarehouse(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    const response = await this.api.post<Warehouse>('/warehouses', createWarehouseDto);
    return response.data;
  }

  async updateWarehouse(id: number, updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse> {
    const response = await this.api.patch<Warehouse>(`/warehouses/${id}`, updateWarehouseDto);
    return response.data;
  }

  async deleteWarehouse(id: number): Promise<void> {
    await this.api.delete(`/warehouses/${id}`);
  }

  // Committees endpoints
  async getCommittees(): Promise<Committee[]> {
    const response = await this.api.get<Committee[]>('/committees');
    return response.data;
  }

  async getCommittee(id: number): Promise<Committee> {
    const response = await this.api.get<Committee>(`/committees/${id}`);
    return response.data;
  }

  async getProductHistory(id: number, page?: number, limit?: number): Promise<PaginatedResponse<AuditLog>> {
    const response = await this.api.get<PaginatedResponse<AuditLog>>(`/products/${id}/history`, {
      params: { page, limit },
    });
    return response.data;
  }

  async getCommitteeStatistics(id: number, startDate?: string, endDate?: string): Promise<any> {
    const response = await this.api.get<any>(`/committees/${id}/stats`, {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async createCommittee(createCommitteeDto: CreateCommitteeDto): Promise<Committee> {
    const response = await this.api.post<Committee>('/committees', createCommitteeDto);
    return response.data;
  }

  async updateCommittee(id: number, updateCommitteeDto: UpdateCommitteeDto): Promise<Committee> {
    const response = await this.api.patch<Committee>(`/committees/${id}`, updateCommitteeDto);
    return response.data;
  }

  async deleteCommittee(id: number): Promise<void> {
    await this.api.delete(`/committees/${id}`);
  }

  // Transaction Types endpoints
  async getTransactionTypes(): Promise<TransactionType[]> {
    const response = await this.api.get<TransactionType[]>('/transaction-types');
    return response.data;
  }

  async createTransactionType(createDto: CreateTransactionTypeDto): Promise<TransactionType> {
    const response = await this.api.post<TransactionType>('/transaction-types', createDto);
    return response.data;
  }

  async updateTransactionType(id: number, updateDto: UpdateTransactionTypeDto): Promise<TransactionType> {
    const response = await this.api.patch<TransactionType>(`/transaction-types/${id}`, updateDto);
    return response.data;
  }

  async deleteTransactionType(id: number): Promise<void> {
    await this.api.delete(`/transaction-types/${id}`);
  }

  // Returns endpoints
  async createReturn(createReturnDto: CreateReturnDto): Promise<Return> {
    const response = await this.api.post<Return>('/returns', createReturnDto);
    return response.data;
  }

  async updateReturn(id: number, UpdateReturnDto: UpdateReturnDto): Promise<Return> {
    const response = await this.api.patch<Return>(`/returns/${id}`, UpdateReturnDto);
    return response.data;
  }

  async deleteReturn(id: number): Promise<void> {
    await this.api.delete(`/returns/${id}`);
  }

  async getReturns(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<Return[]> {
    // Note: Backend returns Return[], not PaginatedResponse<Return> yet based on service
    // But usually we want consistency. My backend service returns Return[].
    const response = await this.api.get<Return[]>('/returns', { params });
    return response.data;
  }

  // Audit Logs endpoints
  async getAuditLogs(params?: {
    userId?: number;
    action?: string;
    entityType?: string;
    entityId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AuditLog>> {
    const response = await this.api.get<PaginatedResponse<AuditLog>>('/audit-logs', { params });
    return response.data;
  }

  // User Statuses endpoints
  async getUserStatuses(): Promise<UserStatus[]> {
    const response = await this.api.get<UserStatus[]>('/user-statuses');
    return response.data;
  }

  async createUserStatus(createUserStatusDto: CreateUserStatusDto): Promise<UserStatus> {
    const response = await this.api.post<UserStatus>('/user-statuses', createUserStatusDto);
    return response.data;
  }

  async updateUserStatus(id: number, updateUserStatusDto: UpdateUserStatusDto): Promise<UserStatus> {
    const response = await this.api.patch<UserStatus>(`/user-statuses/${id}`, updateUserStatusDto);
    return response.data;
  }

  async deleteUserStatus(id: number): Promise<void> {
    await this.api.delete(`/user-statuses/${id}`);
  }
}

export const apiService = new ApiService();
