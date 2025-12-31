import type { AxiosError } from 'axios';
import type { ApiError } from '@/types/api';
import { useToast } from 'primevue/usetoast';

/**
 * Обрабатывает ошибки API и показывает уведомления
 */
export function handleApiError(error: unknown, toast?: ReturnType<typeof useToast>): string {
  const axiosError = error as AxiosError<ApiError>;

  let message = 'Произошла ошибка';

  if (axiosError.response) {
    // Сервер вернул ошибку
    const apiError = axiosError.response.data;
    message = apiError?.message || apiError?.error || `Ошибка ${axiosError.response.status}`;

    // Специальная обработка для разных статусов
    switch (axiosError.response.status) {
      case 400:
        message = apiError?.message || 'Неверный запрос';
        break;
      case 401:
        message = 'Необходима авторизация';
        break;
      case 403:
        message = 'Доступ запрещен';
        break;
      case 404:
        message = 'Ресурс не найден';
        break;
      case 422:
        message = apiError?.message || 'Ошибка валидации данных';
        break;
      case 500:
        message = 'Внутренняя ошибка сервера';
        break;
      default:
        message = apiError?.message || `Ошибка ${axiosError.response.status}`;
    }
  } else if (axiosError.request) {
    // Запрос был отправлен, но ответа не получено
    message = 'Сервер не отвечает. Проверьте подключение к интернету.';
  } else {
    // Ошибка при настройке запроса
    message = axiosError.message || 'Ошибка при выполнении запроса';
  }

  // Показываем уведомление, если передан toast
  if (toast) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: message,
      life: 5000,
    });
  }

  return message;
}

/**
 * Валидация email
 */
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Валидация пароля
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Пароль должен содержать не менее 6 символов' };
  }
  return { valid: true };
}

/**
 * Валидация SKU
 */
export function validateSKU(sku: string): { valid: boolean; message?: string } {
  if (!sku.trim()) {
    return { valid: false, message: 'SKU обязателен' };
  }
  if (sku.length > 100) {
    return { valid: false, message: 'SKU не может быть длиннее 100 символов' };
  }
  return { valid: true };
}

