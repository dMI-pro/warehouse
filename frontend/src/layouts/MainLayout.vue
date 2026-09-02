<template>
  <div class="layout-wrapper">
    <Menubar :model="menuItems" class="main-menu">
      <template #start>
        <div class="logo">Склад Анти...</div>
      </template>
      <template #end>
        <div class="user-info">
          <div class="user-desktop">
          <ThemeToggle />
            <span class="username">{{ userDisplayName }}</span>
          <Button
            label="Выход"
            icon="pi pi-sign-out"
            severity="secondary"
            text
            @click="handleLogout"
          />
          </div>

          <div class="user-mobile" @click="toggleUserMenu">
            <div class="header-avatar" :style="{ backgroundColor: userAvatarColor }">
              {{ userInitials }}
            </div>
            <span class="username username-mobile">{{ userDisplayName }}</span>
            <i class="pi pi-chevron-down user-menu-icon" />
          </div>

          <OverlayPanel ref="userMenuRef" class="user-menu-panel">
            <div class="user-menu-header">
              <div class="header-avatar" :style="{ backgroundColor: userAvatarColor }">
                {{ userInitials }}
              </div>
              <div class="user-menu-text">
                <div class="user-menu-name">{{ userDisplayName }}</div>
              </div>
            </div>
            <div class="user-menu-item">
              <span class="user-menu-label">Тема</span>
              <ThemeToggle />
            </div>
            <Button
              label="Выйти"
              icon="pi pi-sign-out"
              severity="secondary"
              text
              class="user-menu-logout"
              @click="handleLogout"
            />
          </OverlayPanel>
        </div>
      </template>
    </Menubar>

    <div class="content-wrapper">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Menubar from 'primevue/menubar';
import Button from 'primevue/button';
import OverlayPanel from 'primevue/overlaypanel';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';

import { Role } from '@/types/api';
import { getInitials, getAvatarColor } from '@/utils/user-utils';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { isGuest, isAdminOrManager, isAdmin } = storeToRefs(authStore);
const userMenuRef = ref();
const mobileMenuOpen = ref(false);

const userDisplayName = computed(() => authStore.user?.fullName || authStore.user?.username || '');
const userInitials = computed(() => getInitials(userDisplayName.value));
const userAvatarColor = computed(() => {
  if (authStore.user?.role) {
    return getAvatarColor(authStore.user.role as Role);
  }
  return '#8c8c8c';
});

// Функция для проверки активного маршрута
const isActive = (path: string | { name: string } | Array<string | { name: string }>): boolean => {
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
  const items: any[] = [];

  if (!isGuest.value) {
    items.push({
      label: 'Главная',
      icon: 'pi pi-home',
      command: () => router.push({ name: 'dashboard' }),
      class: isActive({ name: 'dashboard' }) ? 'p-highlight' : '',
    });
  }

  items.push({
      label: 'Товары',
      icon: 'pi pi-box',
      command: () => router.push({ name: 'products' }),
      class: isActive([{ name: 'products' }, { name: 'product-details' }]) ? 'p-highlight' : '',
  });

  if (isAdminOrManager.value) {
    items.push({
      label: 'Отчеты',
      icon: 'pi pi-chart-bar',
      command: () => router.push({ name: 'reports' }),
      class: isActive({ name: 'reports' }) ? 'p-highlight' : '',
    });
    items.push({
      label: 'Медиа',
      icon: 'pi pi-images',
      command: () => router.push({ name: 'media' }),
      class: isActive({ name: 'media' }) ? 'p-highlight' : '',
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

  if (isAdmin.value) {
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

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
};

const toggleUserMenu = (event: MouseEvent) => {
  if (!userMenuRef.value) return;
  userMenuRef.value.toggle(event);
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
  min-width: 0;
}

.user-desktop {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-mobile {
  display: none;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.header-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 0.875rem;
}

.username {
  font-weight: 500;
}

.username-mobile {
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu-icon {
  font-size: 0.875rem;
}

.user-menu-panel {
  min-width: 220px;
}

.user-menu-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 0.75rem 0.5rem;
  border-bottom: 1px solid var(--surface-border);
  margin-bottom: 0.5rem;
}

.user-menu-name {
  font-weight: 600;
}

.user-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem;
}

.user-menu-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.user-menu-logout {
  width: 100%;
  justify-content: flex-start;
  padding: 0.5rem;
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
    margin-right: 0.3rem;
    max-width: 40vw;
  }

  .user-info {
    flex-direction: row;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .user-desktop {
    display: none;
  }

  .user-mobile {
    display: flex;
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
