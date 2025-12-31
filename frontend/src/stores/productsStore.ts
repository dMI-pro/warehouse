import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product, CreateProductDto, UpdateProductDto, PaginatedResponse } from '@/types/api';
import { apiService } from '@/services/api';

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([]);
  const currentProduct = ref<Product | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const filters = ref({
    search: '',
    category: undefined as number | undefined,
  });

  const filteredProducts = computed(() => {
    return products.value;
  });

  const fetchProducts = async (params?: {
    search?: string;
    category?: number;
    page?: number;
    limit?: number;
  }) => {
    loading.value = true;
    error.value = null;
    try {
      const response: PaginatedResponse<Product> = await apiService.getProducts({
        ...params,
        search: params?.search || filters.value.search || undefined,
        category: params?.category || filters.value.category,
        page: params?.page || pagination.value.page,
        limit: params?.limit || pagination.value.limit,
      });
      products.value = response.data;
      pagination.value = {
        total: response.meta.total,
        page: response.meta.page,
        limit: response.meta.limit,
        totalPages: response.meta.totalPages,
      };
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки товаров';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchProduct = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      currentProduct.value = await apiService.getProduct(id);
      return currentProduct.value;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки товара';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createProduct = async (createProductDto: CreateProductDto) => {
    loading.value = true;
    error.value = null;
    try {
      const product = await apiService.createProduct(createProductDto);
      await fetchProducts();
      return product;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка создания товара';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateProduct = async (id: number, updateProductDto: UpdateProductDto) => {
    loading.value = true;
    error.value = null;
    try {
      const product = await apiService.updateProduct(id, updateProductDto);
      await fetchProducts();
      return product;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления товара';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteProduct = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteProduct(id);
      await fetchProducts();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления товара';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadImage = async (id: number, file: File) => {
    loading.value = true;
    error.value = null;
    try {
      const product = await apiService.uploadProductImage(id, file);
      await fetchProducts();
      return product;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки изображения';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteImage = async (id: number, imageUrl: string) => {
    loading.value = true;
    error.value = null;
    try {
      const product = await apiService.deleteProductImage(id, imageUrl);
      await fetchProducts();
      return product;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления изображения';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setFilters = (newFilters: { search?: string; category?: number }) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const setPage = (page: number) => {
    pagination.value.page = page;
  };

  return {
    products,
    currentProduct,
    loading,
    error,
    pagination,
    filters,
    filteredProducts,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
    deleteImage,
    setFilters,
    setPage,
  };
});

