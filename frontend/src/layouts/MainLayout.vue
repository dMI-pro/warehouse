<template>
  <div class="layout-wrapper">
    <Menubar :model="menuItems" class="main-menu">
      <template #start>
        <div class="logo">Warehouse</div>
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
import { useRouter } from 'vue-router';
import Menubar from 'primevue/menubar';
import Button from 'primevue/button';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { useAuthStore } from '@/stores/authStore';

import { Role } from '@/types/api';

const router = useRouter();
const authStore = useAuthStore();

const menuItems = computed(() => {
  const items = [
    {
      label: 'Главная',
      icon: 'pi pi-home',
      command: () => router.push({ name: 'dashboard' }),
    },
    {
      label: 'Товары',
      icon: 'pi pi-box',
      command: () => router.push({ name: 'products' }),
    },
  ];

  if (authStore.hasRole(Role.MANAGER) || authStore.isAdmin) {
    items.push({
      label: 'Отчеты',
      icon: 'pi pi-chart-bar',
      command: () => router.push({ name: 'reports' }),
    });
    items.push({
      label: 'Настройки',
      icon: 'pi pi-cog',
      command: () => router.push({ name: 'settings' }),
    });
    items.push({
      label: 'Журнал действий',
      icon: 'pi pi-history',
      command: () => router.push({ name: 'audit-log' }),
    });
  }

  if (authStore.isAdmin) {
    items.push({
      label: 'Пользователи',
      icon: 'pi pi-users',
      command: () => router.push({ name: 'users' }),
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



