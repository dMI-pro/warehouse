export enum Role {
  GUEST = 'GUEST',
  SELLER = 'SELLER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum UserStatusColor {
  active = 'active',
  blocked = 'blocked',
  disabled = 'disabled',
}

export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  isSuperAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
  status?: UserStatus | null;
}

export interface AuthResponse {
  access_token?: string;
  user?: User;
  message?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  parent?: Category;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: number;
  name: string;
  description?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Committee {
  id: number;
  name: string;
  description?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionType {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minStockLevel: number;
  categoryId?: number;
  category?: Category;
  warehouseId?: number;
  warehouse?: Warehouse;
  committeeId?: number;
  committee?: Committee;
  transactionTypeId?: number;
  transactionType?: TransactionType;
  arrivalDate?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minStockLevel?: number;
  categoryId?: number;
  warehouseId?: number;
  committeeId?: number;
  transactionTypeId?: number;
  arrivalDate?: string;
  images?: string[];
}

export interface UpdateProductDto {
  name?: string;
  sku?: string;
  description?: string;
  purchasePrice?: number;
  salePrice?: number;
  quantity?: number;
  minStockLevel?: number;
  categoryId?: number;
  warehouseId?: number;
  committeeId?: number;
  transactionTypeId?: number;
  arrivalDate?: string;
  images?: string[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: number;
}

export interface Sale {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  salePrice: number;
  totalAmount: number;
  userId: number;
  user?: User;
  soldAt?: string;
  createdAt: string;
}

export interface CreateSaleDto {
  productId: number;
  quantity: number;
  salePrice?: number;
  soldAt?: string; // Дата продажи (ISO string)
}

export interface UpdateSaleDto {
  productId?: number;
  quantity?: number;
  salePrice?: number;
  soldAt?: string;
}

export interface SalesStatistics {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  averageSalePrice: number;
  salesByDate?: Array<{ date: string; count: number; revenue: number }>;
  salesByProduct?: Array<{ productId: number; productName: string; count: number; revenue: number }>;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Дополнительные типы для работы с изображениями
export interface ImageUploadResult {
  url: string;
  thumbnailUrl?: string;
  size: number;
  width: number;
  height: number;
}

// Типы для ошибок валидации
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  message: string | string[];
  error?: string;
  statusCode: number;
  validationErrors?: ValidationError[];
}

export interface AuditLog {
  id: number;
  userId?: number;
  user?: User;
  action: string;
  entityType?: string;
  entityId?: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  createdAt: string;
}

export interface CreateWarehouseDto {
  name: string;
  description?: string;
  address?: string;
}

export interface UpdateWarehouseDto {
  name?: string;
  description?: string;
  address?: string;
}

export interface CreateCommitteeDto {
  name: string;
  description?: string;
  contactInfo?: string;
}

export interface UpdateCommitteeDto {
  name?: string;
  description?: string;
  contactInfo?: string;
}

export interface CreateTransactionTypeDto {
  name: string;
}

export interface UpdateTransactionTypeDto {
  name?: string;
}

export interface Return {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  reason?: string;
  returnedAt: string;
  returnedBy: number;
  user?: User;
}

export interface CreateReturnDto {
  productId: number;
  quantity: number;
  reason?: string;
  returnedAt?: string;
}

export interface UpdateReturnDto {
  productId: number;
  quantity: number;
  reason?: string;
  returnedAt?: string;
}

export interface DashboardStats {
  totalPositions: number;
  totalItemsQuantity: number;
  activePositions: number;
  activeItemsCount: number;
  soldItemsCount: number;
  returnedItemsCount: number;
  totalValue: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  newArrivals: Array<{ name: string; quantity: number; arrivalDate: string }>;
  lowStockProducts: Product[];
  longStorageProducts: Product[];
  recentSales: Array<{ productName: string; quantity: number; amount: number; time: string; userName: string }>;
  lastReturns: Array<{ productName: string; quantity: number; time: string; userName: string }>;
  salesChart: Array<{ date: string; amount: number }>;
}

export interface FileUploadEvent {
    files: File[];
    originalEvent: Event;
}

// Медиа (MinIO)
export interface MediaItem {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  type: 'image' | 'video';
  used: boolean;
  usedCount: number;
}

export interface UserStatus {
  id: number;
  code: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserStatusDto {
  name: string;
  code: string;
  description?: string;
  color?: string;
}

export interface UpdateUserStatusDto {
  name?: string;
  code?: string;
  description?: string;
  color?: string;
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  fullName: string;
  role?: Role;
  userStatusId?: number;
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
  password?: string;
  fullName?: string;
  role?: Role;
  userStatusId?: number;
}


