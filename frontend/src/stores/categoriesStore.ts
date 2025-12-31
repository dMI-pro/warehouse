import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/api';
import { apiService } from '@/services/api';

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const categoriesTree = computed(() => {
    const map = new Map<number, Category & { children: Category[] }>();
    const roots: (Category & { children: Category[] })[] = [];

    // Создаем карту всех категорий
    categories.value.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    // Строим дерево
    categories.value.forEach((cat) => {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        const parent = map.get(cat.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  });

  const fetchCategories = async () => {
    loading.value = true;
    error.value = null;
    try {
      categories.value = await apiService.getCategories();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки категорий';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createCategory = async (createCategoryDto: CreateCategoryDto) => {
    loading.value = true;
    error.value = null;
    try {
      const category = await apiService.createCategory(createCategoryDto);
      await fetchCategories();
      return category;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка создания категории';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateCategory = async (id: number, updateCategoryDto: UpdateCategoryDto) => {
    loading.value = true;
    error.value = null;
    try {
      const category = await apiService.updateCategory(id, updateCategoryDto);
      await fetchCategories();
      return category;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления категории';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteCategory = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteCategory(id);
      await fetchCategories();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления категории';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    categories,
    categoriesTree,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
});

