import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User, CreateUserDto, UpdateUserDto } from '@/types/api';
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

  const createUser = async (dto: CreateUserDto) => {
    loading.value = true;
    error.value = null;
    try {
      const user = await apiService.createUser(dto);
      await fetchUsers();
      return user;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка создания пользователя';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateUser = async (id: number, dto: UpdateUserDto) => {
    loading.value = true;
    error.value = null;
    try {
      const user = await apiService.updateUser(id, dto);
      await fetchUsers();
      return user;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления пользователя';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteUser = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteUser(id);
      await fetchUsers();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления пользователя';
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
    createUser,
    updateUser,
    deleteUser,
  };
});



