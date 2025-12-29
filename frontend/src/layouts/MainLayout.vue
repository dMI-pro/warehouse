<template>
  <div class="layout-wrapper">
    <Menubar :model="menuItems" class="main-menu">
      <template #start>
        <div class="logo">Warehouse</div>
      </template>
      <template #end>
        <div class="user-info">
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
import { useAuthStore } from '@/stores/authStore';

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
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.username {
  font-weight: 500;
}

.content-wrapper {
  flex: 1;
  padding: 2rem;
  background-color: var(--surface-ground);
}
</style>


