import type { AuditLog } from '@/types/api';
import { getActorDisplayName } from '@/utils/user-utils';

const ACTION_LABELS: Record<string, string> = {
  login: 'Вход в систему',
  login_attempt: 'Попытка входа',
  'product.create': 'Добавление товара',
  'product.update': 'Обновление товара',
  'product.price_change': 'Изменение цены',
  'product.quantity_change': 'Изменение остатка',
  'product.image_add': 'Добавление изображения',
  'product.image_delete': 'Удаление изображения',
  'product.image_reorder': 'Изменение порядка изображений',
  'product.delete': 'Удаление товара',
  'sale.create': 'Продажа',
  'sale.update': 'Изменение продажи',
  'sale.delete': 'Удаление продажи',
  'return.create': 'Возврат',
  'return.update': 'Изменение возврата',
  'return.delete': 'Удаление возврата',
  'user.create': 'Создание пользователя',
  'user.update': 'Обновление пользователя',
  'user.delete': 'Удаление пользователя',
  'user.sessions.revoke': 'Сброс сессий',
  'user.block': 'Блокировка пользователя',
  'warehouse.create': 'Создание склада',
  'warehouse.update': 'Обновление склада',
  'warehouse.delete': 'Удаление склада',
  'committee.create': 'Создание комитета',
  'committee.update': 'Обновление комитета',
  'committee.delete': 'Удаление комитета',
  'user_status.create': 'Создание статуса',
  'user_status.update': 'Обновление статуса',
  'user_status.delete': 'Удаление статуса',
};

export function getAuditActionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

export function mapAuditLogToDashboardAction(log: AuditLog): {
  type: string;
  entity: string;
  details: string;
  user: string;
  time: string;
} {
  const newValues = (log.newValues ?? {}) as Record<string, unknown>;
  const quantity = newValues.quantity as number | undefined;
  const salePrice = newValues.salePrice as number | string | undefined;
  const productId = newValues.productId as number | undefined;

  let entity = '—';
  if (typeof newValues.name === 'string' && newValues.name) {
    entity = newValues.name;
  } else if (log.entityType && log.entityId) {
    entity = `${log.entityType} #${log.entityId}`;
  } else if (log.entityType) {
    entity = log.entityType;
  }

  let details = '—';
  if (log.action === 'sale.create' && quantity != null && salePrice != null) {
    const amount = Number(salePrice) * quantity;
    details = `${quantity} шт. на ${formatRub(amount)}`;
  } else if (
    (log.action === 'return.create' || log.action === 'product.create') &&
    quantity != null
  ) {
    details = `${quantity} шт.`;
  } else if (productId != null) {
    details = `Товар #${productId}`;
  }

  return {
    type: getAuditActionLabel(log.action),
    entity,
    details,
    user: log.user ? getActorDisplayName(log.user) : 'Система',
    time: log.createdAt,
  };
}

function formatRub(value: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(value);
}
