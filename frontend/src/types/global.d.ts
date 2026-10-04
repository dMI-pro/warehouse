// Глобальные типы для приложения

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Расширение типов для PrimeVue
declare module 'primevue' {
  export interface ToastMessageOptions {
    severity?: 'success' | 'info' | 'warn' | 'error';
    summary?: string;
    detail?: string;
    life?: number;
    closable?: boolean;
  }
}

// Типы для window объекта
interface Window {
  // Добавьте здесь глобальные свойства window, если нужно
}

