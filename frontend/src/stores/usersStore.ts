import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User } from '@/types/api';
import { apiService } from '@/services/api';

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchUsers = async () => {
    loading.value = true;
    error.value = null;
    try {
      users.value = await apiService.getUsers();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки пользователей';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
  };
});


