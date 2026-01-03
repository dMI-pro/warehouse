import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { Role } from '@/types/api';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/views/ProductsView.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
          meta: { requiredRole: Role.ADMIN },
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/views/ReportsView.vue'),
          meta: { requiredRole: Role.MANAGER },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { requiredRole: Role.ADMIN },
        },
        {
          path: 'audit-log',
          name: 'audit-log',
          component: () => import('@/views/AuditLogView.vue'),
          meta: { requiredRole: Role.ADMIN },
        },
      ],
    },
  ],
});

// Защита маршрутов
router.beforeEach(
  async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore();

    // Если маршрут требует авторизации
    if (to.meta.requiresAuth !== false) {
      // Проверяем авторизацию
      if (!authStore.isAuthenticated) {
        // Пытаемся проверить токен
        const isValid = await authStore.checkAuth();
        if (!isValid) {
          next({ name: 'login', query: { redirect: to.fullPath } });
          return;
        }
      }

      // Проверяем роль, если требуется
      if (to.meta.requiredRole) {
        const requiredRole = to.meta.requiredRole as Role;
        if (!authStore.hasRole(requiredRole)) {
          next({ name: 'dashboard' });
          return;
        }
      }
    } else {
      // Если пользователь уже авторизован, перенаправляем на dashboard
      if (authStore.isAuthenticated) {
        const redirect = (to.query.redirect as string) || '/dashboard';
        next(redirect);
        return;
      }
    }

    next();
  }
);

export default router;
