import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Warehouse, CreateWarehouseDto, UpdateWarehouseDto } from '@/types/api';
import { apiService } from '@/services/api';

export const useWarehousesStore = defineStore('warehouses', () => {
  const warehouses = ref<Warehouse[]>([]);
  const currentWarehouse = ref<Warehouse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchWarehouses = async () => {
    loading.value = true;
    error.value = null;
    try {
      warehouses.value = await apiService.getWarehouses();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки складов';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchWarehouse = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      currentWarehouse.value = await apiService.getWarehouse(id);
      return currentWarehouse.value;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки склада';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createWarehouse = async (createWarehouseDto: CreateWarehouseDto) => {
    loading.value = true;
    error.value = null;
    try {
      const warehouse = await apiService.createWarehouse(createWarehouseDto);
      await fetchWarehouses();
      return warehouse;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка создания склада';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateWarehouse = async (id: number, updateWarehouseDto: UpdateWarehouseDto) => {
    loading.value = true;
    error.value = null;
    try {
      const warehouse = await apiService.updateWarehouse(id, updateWarehouseDto);
      await fetchWarehouses();
      return warehouse;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления склада';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteWarehouse = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteWarehouse(id);
      await fetchWarehouses();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления склада';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    warehouses,
    currentWarehouse,
    loading,
    error,
    fetchWarehouses,
    fetchWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };
});

