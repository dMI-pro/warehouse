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

// Функция для проверки активного маршрута
const isActive = (path: string | { name: string } | Array<string | { name: string }>) => {
  if (Array.isArray(path)) {
    return path.some(p => isActive(p));
  }
  
  if (typeof path === 'string') {
    return route.path === path || route.path.startsWith(path);
  }
  
  if (path.name) {
    if (path.name === 'dashboard' && route.name === 'dashboard') return true;
    if (path.name === 'products' && (route.name === 'products' || route.name === 'product-details')) return true;
    if (path.name === 'settings' && route.name === 'settings') return true;
    if (path.name === 'reports' && route.name === 'reports') return true;
    if (path.name === 'audit-log' && route.name === 'audit-log') return true;
    if (path.name === 'users' && route.name === 'users') return true;
    
    // Проверка для коммитетов
    if (path.name === 'settings' && route.query?.tab === 'committees') return true;
  }
  
  return false;
};

const menuItems = computed(() => {
  const items: any[] = [
    {
      label: 'Главная',
      icon: 'pi pi-home',
      command: () => router.push({ name: 'dashboard' }),
      class: isActive({ name: 'dashboard' }) ? 'p-highlight' : '',
    },
    {
      label: 'Товары',
      icon: 'pi pi-box',
      command: () => router.push({ name: 'products' }),
      class: isActive([{ name: 'products' }, { name: 'product-details' }]) ? 'p-highlight' : '',
    },
  ];

  if (authStore.hasRole(Role.MANAGER) || authStore.isAdmin) {
    items.push({
      label: 'Отчеты',
      icon: 'pi pi-chart-bar',
      command: () => router.push({ name: 'reports' }),
      class: isActive({ name: 'reports' }) ? 'p-highlight' : '',
    });
    items.push({
      label: 'Настройки',
      icon: 'pi pi-cog',
      command: () => router.push({ name: 'settings', query: { tab: 'categories' } }),
      class: isActive({ name: 'settings' }) ? 'p-highlight' : '',
    });
    // Не удалять дальше вкладка будет нужна!!
    // items.push({
    //   label: 'Коммитеты',
    //   icon: 'pi pi-users',
    //   command: () => router.push({ name: 'settings', query: { tab: 'committees' } }),
    //   class: isActive({ name: 'settings' }) && route.query?.tab === 'committees' ? 'p-highlight' : '',
    // });
  }

  if (authStore.isAdmin) {
    items.push({
      label: 'Журнал действий',
      icon: 'pi pi-history',
      command: () => router.push({ name: 'audit-log' }),
      class: isActive({ name: 'audit-log' }) ? 'p-highlight' : '',
    });
    items.push({
      label: 'Пользователи',
      icon: 'pi pi-users',
      command: () => router.push({ name: 'users' }),
      class: isActive({ name: 'users' }) ? 'p-highlight' : '',
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

/* Удалите все предыдущие стили для .p-highlight и добавьте только это: */
:deep(.p-highlight) {
  background-color: var(--p-menubar-item-focus-background);
}

:deep(.p-highlight *) {
  /* color: white !important; */
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

  :deep(.p-menubar-root-list) {
    flex-direction: column;
    width: 100%;
  }
}
</style>