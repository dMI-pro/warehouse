export enum Role {
  GUEST = 'GUEST',
  SELLER = 'SELLER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  isSuperAdmin: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
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
  createdAt: string;
}

export interface CreateSaleDto {
  productId: number;
  quantity: number;
  salePrice?: number;
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



