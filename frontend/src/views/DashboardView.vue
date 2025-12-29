<template>
  <div class="dashboard">
    <h1 class="page-title">Главная</h1>

    <div class="stats-grid">
      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-box" style="font-size: 2rem"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Товары</div>
              <div class="stat-value">{{ stats.products || 0 }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-users" style="font-size: 2rem"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Пользователи</div>
              <div class="stat-value">{{ stats.users || 0 }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-shopping-cart" style="font-size: 2rem"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Заказы</div>
              <div class="stat-value">{{ stats.orders || 0 }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon">
              <i class="pi pi-chart-line" style="font-size: 2rem"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Продажи</div>
              <div class="stat-value">{{ stats.sales || 0 }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card class="welcome-card mt-4">
      <template #title>Добро пожаловать!</template>
      <template #content>
        <p>Вы вошли в систему управления складом.</p>
        <p v-if="authStore.user">
          Ваша роль: <strong>{{ getRoleName(authStore.user.role) }}</strong>
        </p>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';
import type { Role } from '@/types/api';

const authStore = useAuthStore();

const stats = ref({
  products: 0,
  users: 0,
  orders: 0,
  sales: 0,
});

const getRoleName = (role: Role): string => {
  const roleNames: Record<Role, string> = {
    GUEST: 'Гость',
    SELLER: 'Продавец',
    MANAGER: 'Менеджер',
    ADMIN: 'Администратор',
  };
  return roleNames[role] || role;
};

const loadStats = async () => {
  try {
    // Загружаем базовую статистику
    const productsData = await apiService.getProducts({ limit: 1 });
    stats.value.products = productsData.meta?.total || 0;

    if (authStore.isAdmin) {
      const usersStore = (await import('@/stores/usersStore')).useUsersStore();
      await usersStore.fetchUsers();
      stats.value.users = usersStore.users.length;
    }
  } catch (error) {
    console.error('Failed to load stats', error);
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon {
  color: var(--primary-color);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-color);
}

.welcome-card {
  max-width: 600px;
}
</style>


