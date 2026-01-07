import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiService } from '@/services/api';
import type { Return, CreateReturnDto } from '@/types/api';

export const useReturnsStore = defineStore('returns', () => {
  const returns = ref<Return[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchReturns(params?: any) {
    loading.value = true;
    error.value = null;
    try {
      const data = await apiService.getReturns(params);
      returns.value = data;
    } catch (err: any) {
      error.value = err.message || 'Ошибка загрузки возвратов';
    } finally {
      loading.value = false;
    }
  }

  async function createReturn(data: CreateReturnDto) {
    loading.value = true;
    error.value = null;
    try {
      const newReturn = await apiService.createReturn(data);
      returns.value.unshift(newReturn);
      return newReturn;
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Ошибка создания возврата';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    returns,
    loading,
    error,
    fetchReturns,
    createReturn,
  };
});
