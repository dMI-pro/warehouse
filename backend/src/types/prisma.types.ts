/**
 * TypeScript типы на основе Prisma моделей
 * Эти типы автоматически генерируются Prisma Client,
 * но здесь представлены для удобства использования в приложении
 */

import {
  User,
  Product,
  Category,
  Sale,
  AuditLog,
  Prisma,
} from '@prisma/client';

// ============================================
// Базовые типы моделей
// ============================================

export type UserModel = User;
export type ProductModel = Product;
export type CategoryModel = Category;
export type SaleModel = Sale;
export type AuditLogModel = AuditLog;

// ============================================
// Типы с отношениями (включают связанные данные)
// ============================================

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    sales: true;
    auditLogs: true;
  };
}>;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    sales: true;
  };
}>;

export type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: {
    parent: true;
    children: true;
    products: true;
  };
}>;

export type SaleWithRelations = Prisma.SaleGetPayload<{
  include: {
    product: true;
    user: true;
  };
}>;

export type AuditLogWithRelations = Prisma.AuditLogGetPayload<{
  include: {
    user: true;
  };
}>;

// ============================================
// Типы для создания (Create)
// ============================================

export type CreateUserInput = Prisma.UserCreateInput;
export type CreateProductInput = Prisma.ProductCreateInput;
export type CreateCategoryInput = Prisma.CategoryCreateInput;
export type CreateSaleInput = Prisma.SaleCreateInput;
export type CreateAuditLogInput = Prisma.AuditLogCreateInput;

// ============================================
// Типы для обновления (Update)
// ============================================

export type UpdateUserInput = Prisma.UserUpdateInput;
export type UpdateProductInput = Prisma.ProductUpdateInput;
export type UpdateCategoryInput = Prisma.CategoryUpdateInput;
export type UpdateSaleInput = Prisma.SaleUpdateInput;
export type UpdateAuditLogInput = Prisma.AuditLogUpdateInput;

// ============================================
// Типы для запросов (Where)
// ============================================

export type UserWhereInput = Prisma.UserWhereInput;
export type ProductWhereInput = Prisma.ProductWhereInput;
export type CategoryWhereInput = Prisma.CategoryWhereInput;
export type SaleWhereInput = Prisma.SaleWhereInput;
export type AuditLogWhereInput = Prisma.AuditLogWhereInput;

// ============================================
// Дополнительные типы для бизнес-логики
// ============================================

/**
 * Роли пользователей
 */
export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

/**
 * Типы действий в аудит-логе
 */
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  VIEW = 'view',
}

/**
 * Типы сущностей для аудит-лога
 */
export enum EntityType {
  USER = 'User',
  PRODUCT = 'Product',
  CATEGORY = 'Category',
  SALE = 'Sale',
}

/**
 * Тип для данных пользователя без пароля (для безопасной передачи)
 */
export type UserWithoutPassword = Omit<User, 'password'>;

/**
 * Тип для создания пользователя (без id и timestamps)
 */
export type CreateUserDto = Omit<
  CreateUserInput,
  'id' | 'createdAt' | 'updatedAt' | 'sales' | 'auditLogs'
>;

/**
 * Тип для создания товара (без id и timestamps)
 */
export type CreateProductDto = Omit<
  CreateProductInput,
  'id' | 'createdAt' | 'updatedAt' | 'sales'
>;

/**
 * Тип для создания категории (без id и timestamps)
 */
export type CreateCategoryDto = Omit<
  CreateCategoryInput,
  'id' | 'createdAt' | 'updatedAt' | 'products' | 'parent' | 'children'
>;

/**
 * Тип для создания продажи (без id)
 */
export type CreateSaleDto = Omit<CreateSaleInput, 'id'>;

/**
 * Тип для создания записи аудит-лога (без id и createdAt)
 */
export type CreateAuditLogDto = Omit<CreateAuditLogInput, 'id' | 'createdAt'>;

/**
 * Тип для JSON значений в аудит-логе
 */
export type AuditLogValues = Record<string, any> | null;

/**
 * Тип для фильтрации товаров
 */
export interface ProductFilter {
  categoryId?: number;
  minQuantity?: number;
  maxQuantity?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string; // Поиск по name или sku
}

/**
 * Тип для пагинации
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

/**
 * Тип для результата с пагинацией
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

