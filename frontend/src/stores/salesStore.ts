import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Sale, CreateSaleDto, SalesStatistics, PaginatedResponse } from '@/types/api';
import { apiService } from '@/services/api';

export const useSalesStore = defineStore('sales', () => {
  const sales = ref<Sale[]>([]);
  const statistics = ref<SalesStatistics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchSales = async (params?: {
    productId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    loading.value = true;
    error.value = null;
    try {
      const response: PaginatedResponse<Sale> = await apiService.getSales({
        ...params,
        page: params?.page || pagination.value.page,
        limit: params?.limit || pagination.value.limit,
      });
      sales.value = response.data;
      pagination.value = {
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
        totalPages: response.meta.totalPages,
      };
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки продаж';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createSale = async (createSaleDto: CreateSaleDto) => {
    loading.value = true;
    error.value = null;
    try {
      const sale = await apiService.createSale(createSaleDto);
      await fetchSales();
      return sale;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка создания продажи';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchStatistics = async (startDate?: string, endDate?: string) => {
    loading.value = true;
    error.value = null;
    try {
      statistics.value = await apiService.getSalesStatistics(startDate, endDate);
      return statistics.value;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки статистики';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setPage = (page: number) => {
    pagination.value.page = page;
  };

  return {
    sales,
    statistics,
    loading,
    error,
    pagination,
    fetchSales,
    createSale,
    fetchStatistics,
    setPage,
  };
});

