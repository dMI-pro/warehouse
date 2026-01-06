import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TransactionType, CreateTransactionTypeDto, UpdateTransactionTypeDto } from '@/types/api';
import { apiService } from '@/services/api';

export const useTransactionTypesStore = defineStore('transactionTypes', () => {
  const transactionTypes = ref<TransactionType[]>([]);
  const current = ref<TransactionType | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchTransactionTypes = async () => {
    loading.value = true;
    error.value = null;
    try {
      transactionTypes.value = await apiService.getTransactionTypes();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки типов транзакций';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createTransactionType = async (createDto: CreateTransactionTypeDto) => {
    loading.value = true;
    error.value = null;
    try {
      const item = await apiService.createTransactionType(createDto);
      await fetchTransactionTypes();
      return item;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка создания типа транзакции';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateTransactionType = async (id: number, updateDto: UpdateTransactionTypeDto) => {
    loading.value = true;
    error.value = null;
    try {
      const item = await apiService.updateTransactionType(id, updateDto);
      await fetchTransactionTypes();
      return item;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления типа транзакции';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteTransactionType = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteTransactionType(id);
      await fetchTransactionTypes();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления типа транзакции';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    transactionTypes,
    current,
    loading,
    error,
    fetchTransactionTypes,
    createTransactionType,
    updateTransactionType,
    deleteTransactionType,
  };
});

