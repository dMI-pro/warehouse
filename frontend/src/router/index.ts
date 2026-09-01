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
      beforeEnter(_to, _from, next) {
        // Временно закрыто. Чтобы открыть: VITE_ENABLE_PUBLIC_REGISTRATION=true
        if (import.meta.env.VITE_ENABLE_PUBLIC_REGISTRATION !== 'true') {
          next({ name: 'login' });
          return;
        }
        next();
      },
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
          meta: { requiredRoles: [Role.SELLER, Role.MANAGER, Role.ADMIN] },
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/views/ProductsView.vue'),
        },
        {
          path: 'products/:id',
          name: 'product-details',
          component: () => import('@/views/ProductDetailsView.vue'),
          props: true,
        },
        {
          path: 'committees/:id',
          name: 'committee-details',
          component: () => import('@/views/CommitteeDetailsView.vue'),
          meta: { requiredRoles: [Role.ADMIN] },
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/views/ReportsView.vue'),
          meta: { requiredRoles: [Role.MANAGER, Role.ADMIN] },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
          meta: { requiredRoles: [Role.MANAGER, Role.ADMIN] },
        },
        {
          path: 'media',
          name: 'media',
          component: () => import('@/views/MediaView.vue'),
          meta: { requiredRoles: [Role.MANAGER, Role.ADMIN] },
        },
        {
          path: 'audit-log',
          name: 'audit-log',
          component: () => import('@/views/AuditLogView.vue'),
          meta: { requiredRoles: [Role.ADMIN] },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
          meta: { requiredRoles: [Role.ADMIN] },
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

      // Проверяем роли, если требуется (поддержка requiredRoles массива и старого requiredRole)
      const requiredRoles = (to.meta.requiredRoles as Role[]) ||
        (to.meta.requiredRole ? [to.meta.requiredRole as Role] : []);
      if (requiredRoles && requiredRoles.length > 0) {
        const user = authStore.user;
        const isAllowed = !!user && (user.isSuperAdmin || requiredRoles.includes(user.role as Role));
        if (!isAllowed) {
          if (authStore.isGuest) {
            next({ name: 'products' });
            return;
          }
          next({ name: 'dashboard' });
          return;
        }
      }
    } else {
      // Если пользователь уже авторизован, перенаправляем на dashboard
      if (authStore.isAuthenticated) {
        const defaultRedirect = authStore.isGuest ? '/products' : '/dashboard';
        const redirect = (to.query.redirect as string) || defaultRedirect;
        next(redirect);
        return;
      }
    }

    next();
  }
);

export default router;
