import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserStatus, CreateUserStatusDto, UpdateUserStatusDto } from '@/types/api';
import { apiService } from '@/services/api';

export const useUserStatusesStore = defineStore('userStatuses', () => {
  const userStatuses = ref<UserStatus[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchUserStatuses = async () => {
    loading.value = true;
    error.value = null;
    try {
      userStatuses.value = await apiService.getUserStatuses();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки статусов пользователей';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createUserStatus = async (createUserStatusDto: CreateUserStatusDto) => {
    loading.value = true;
    error.value = null;
    try {
      const status = await apiService.createUserStatus(createUserStatusDto);
      await fetchUserStatuses();
      return status;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка создания статуса пользователя';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateUserStatus = async (id: number, updateUserStatusDto: UpdateUserStatusDto) => {
    loading.value = true;
    error.value = null;
    try {
      const status = await apiService.updateUserStatus(id, updateUserStatusDto);
      await fetchUserStatuses();
      return status;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления статуса пользователя';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteUserStatus = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteUserStatus(id);
      await fetchUserStatuses();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления статуса пользователя';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    userStatuses,
    loading,
    error,
    fetchUserStatuses,
    createUserStatus,
    updateUserStatus,
    deleteUserStatus,
  };
});
