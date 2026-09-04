import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
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
  MediaItem,
  DashboardSummary,
} from '@/types/api';
import type { SaleProfitAlert } from '@/utils/saleProfit';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AUTH_SKIP_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiService {
  private api: AxiosInstance;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const original = error.config as RetryableRequest | undefined;
        const status = error.response?.status;
        const url = original?.url;

        if (status !== 401 || !original || original._retry || this.shouldSkipRefresh(url)) {
          return Promise.reject(error);
        }

        original._retry = true;

        try {
          await this.refreshSession();
          return this.api(original);
        } catch (refreshError) {
          this.redirectToLogin();
          return Promise.reject(refreshError);
        }
      }
    );
  }

  private shouldSkipRefresh(url?: string) {
    if (!url) return false;
    return AUTH_SKIP_REFRESH.some((endpoint) => url.includes(endpoint));
  }

  private refreshSession() {
    if (!this.refreshPromise) {
      this.refreshPromise = this.api
        .post('/auth/refresh')
        .then(() => undefined)
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  private redirectToLogin() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
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

  async refresh(): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/refresh');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
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

  // Media endpoints
  async getMedia(params?: {
    search?: string;
    unusedOnly?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: 'date' | 'name' | 'size' | 'type' | 'used';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<MediaItem>> {
    const response = await this.api.get<PaginatedResponse<MediaItem>>('/media', { params });
    return response.data;
  }

  async deleteMedia(keys: string[]): Promise<{ deleted: string[]; errors: Array<{ key: string; error: string }> }> {
    const response = await this.api.delete('/media', { data: { keys } });
    return response.data;
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
    sortBy?: 'createdAt' | 'arrivalDate';
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
    const response = await this.api.post<Product>(`/products/${id}/images`, formData);
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

  async getLastSku(): Promise<{ sku: string | null }> {
    const response = await this.api.get<{ sku: string | null }>('/products/last-sku');
    return response.data;
  }

  async exportProducts(format: 'xlsx' | 'csv' = 'xlsx'): Promise<{ blob: Blob; filename: string }> {
    const response = await this.api.get<Blob>('/products/export', {
      params: { format },
      responseType: 'blob',
    });
    const date = new Date().toISOString().split('T')[0];
    const disposition = response.headers['content-disposition'] as string | undefined;
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/i);
    const filename = filenameMatch?.[1] ?? `products_all_${date}.${format}`;
    return { blob: response.data, filename };
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
    soldBy?: number;
    committeeId?: number;
    search?: string;
    profitAlert?: SaleProfitAlert;
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
    returnedBy?: number;
    committeeId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<Return[]> {
    const response = await this.api.get<Return[]>('/returns', { params });
    return response.data;
  }

  async getDashboardSummary(params?: { chartDays?: number }): Promise<DashboardSummary> {
    const response = await this.api.get<DashboardSummary>('/dashboard/summary', { params });
    return response.data;
  }

  // Audit Logs endpoints
  async getAuditLogs(params?: {
    userId?: number;
    action?: string;
    entityType?: string;
    entityId?: number;
    relatedUserId?: number;
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
