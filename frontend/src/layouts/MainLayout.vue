<template>
  <div class="layout-wrapper">
    <Menubar :model="menuItems" class="main-menu">
      <template #start>
        <div class="logo">Склад Анти...</div>
      </template>
      <template #end>
        <div class="user-info">
          <ThemeToggle />
          <span class="username">{{ authStore.user?.fullName || authStore.user?.username }}</span>
          <Button
            label="Выход"
            icon="pi pi-sign-out"
            severity="secondary"
            text
            @click="handleLogout"
          />
        </div>
      </template>
    </Menubar>

    <div class="content-wrapper">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Menubar from 'primevue/menubar';
import Button from 'primevue/button';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { useAuthStore } from '@/stores/authStore';

import { Role } from '@/types/api';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const menuItems = computed(() => {
  const items: any[] = [
    {
      label: 'Главная',
      icon: 'pi pi-home',
      to: { name: 'dashboard' },
      exact: false,
      class: route.name === 'dashboard' ? 'menu-active' : '',
    },
    {
      label: 'Товары',
      icon: 'pi pi-box',
      to: { name: 'products' },
      exact: false,
      class:
        route.name === 'products' ||
        route.name === 'product-details' ||
        String(route.path || '').startsWith('/products')
          ? 'menu-active'
          : '',
    },
  ];

  if (authStore.hasRole(Role.MANAGER) || authStore.isAdmin) {
    items.push({
      label: 'Отчеты',
      icon: 'pi pi-chart-bar',
      to: { name: 'reports' },
      exact: false,
      class: route.name === 'reports' ? 'menu-active' : '',
    });
    items.push({
      label: 'Настройки',
      icon: 'pi pi-cog',
      to: { name: 'settings' },
      exact: false,
      class:
        route.name === 'settings' ? 'menu-active' : '',
    });
    items.push({
      label: 'Коммитеты',
      icon: 'pi pi-users',
      command: () => router.push({ name: 'settings', query: { tab: 'committees' } }),
      exact: false,
      class:
        route.name === 'committee-details' ||
        (route.name === 'settings' && route.query?.tab === 'committees') ||
        String(route.path || '').startsWith('/committees')
          ? 'menu-active'
          : '',
    });
  }

  if (authStore.isAdmin) {
    items.push({
      label: 'Журнал действий',
      icon: 'pi pi-history',
      to: { name: 'audit-log' },
      exact: false,
      class: route.name === 'audit-log' ? 'menu-active' : '',
    });
    items.push({
      label: 'Пользователи',
      icon: 'pi pi-users',
      to: { name: 'users' },
      exact: false,
      class: route.name === 'users' ? 'menu-active' : '',
    });
  }

  return items;
});

const handleLogout = () => {
  authStore.logout();
  router.push({ name: 'login' });
};
</script>

<style scoped>
.layout-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-menu {
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: none;
  background: var(--surface-card);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 2rem;
  color: var(--primary-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.username {
  font-weight: 500;
}

.content-wrapper {
  flex: 1;
  padding: 2rem;
  background-color: var(--surface-ground);
  min-height: calc(100vh - 60px);
}

.main-menu :deep(.router-link-active),
.main-menu :deep(.router-link-exact-active) {
  background-color: var(--primary-50);
  border-radius: 6px;
}

.main-menu :deep(.menu-active) {
  background-color: var(--primary-50);
  border-radius: 6px;
}

@media (max-width: 768px) {
  .logo {
    font-size: 1.25rem;
    margin-right: 1rem;
  }

  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .content-wrapper {
    padding: 1rem;
  }

  .main-menu :deep(.p-menubar-root-list) {
    flex-direction: column;
    width: 100%;
  }
}
</style>



