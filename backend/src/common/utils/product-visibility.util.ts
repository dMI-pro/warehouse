import { Role } from '../enums/role.enum';

export type ProductViewer = {
  role?: string | Role;
  isSuperAdmin?: boolean;
} | null;

/** Admin / Manager (and super-admin) see purchase price, committee, transaction type. */
export function canSeeProductSensitiveFields(user?: ProductViewer): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.role === Role.ADMIN || user.role === Role.MANAGER;
}

const SENSITIVE_PRODUCT_KEYS = [
  'purchasePrice',
  'committee',
  'committeeId',
  'transactionType',
  'transactionTypeId',
] as const;

/**
 * Strip fields that SELLER / GUEST must not see (matches Products table UI).
 * ADMIN / MANAGER get the full product object.
 */
export function sanitizeProductForRole<T extends Record<string, unknown>>(
  product: T,
  user?: ProductViewer,
): T {
  if (!product || canSeeProductSensitiveFields(user)) {
    return product;
  }

  const sanitized = { ...product };
  for (const key of SENSITIVE_PRODUCT_KEYS) {
    delete sanitized[key];
  }
  return sanitized;
}

export function sanitizeNestedProduct<T extends { product?: Record<string, unknown> | null }>(
  entity: T,
  user?: ProductViewer,
): T {
  if (!entity?.product) return entity;
  return {
    ...entity,
    product: sanitizeProductForRole(entity.product, user),
  };
}
