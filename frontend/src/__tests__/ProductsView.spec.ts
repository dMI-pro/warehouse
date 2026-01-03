import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ProductsView from '@/views/ProductsView.vue';
import { useProductsStore } from '@/stores/productsStore';
import { useAuthStore } from '@/stores/authStore';

import { Role } from '@/types/api';

describe('ProductsView', () => {
  let router: ReturnType<typeof createRouter>;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/products', component: ProductsView }],
    });
  });

  it('renders products table', () => {
    const wrapper = mount(ProductsView, {
      global: {
        plugins: [pinia, router],
      },
    });

    expect(wrapper.find('.products').exists()).toBe(true);
  });

  it('loads products on mount', async () => {
    const wrapper = mount(ProductsView, {
      global: {
        plugins: [pinia, router],
      },
    });

    const productsStore = useProductsStore();
    const fetchSpy = vi.spyOn(productsStore, 'fetchProducts').mockResolvedValue();

    await wrapper.vm.$nextTick();

    // Проверяем, что fetchProducts был вызван
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('shows add button for managers and admins', () => {
    const wrapper = mount(ProductsView, {
      global: {
        plugins: [pinia, router],
      },
    });

    const authStore = useAuthStore();
    authStore.user = {
      id: 1,
      email: 'test@test.com',
      username: 'admin',
      fullName: 'Admin',
      role: Role.ADMIN as const,
      isSuperAdmin: false,
    };

    wrapper.vm.$forceUpdate();
    expect(wrapper.find('button[label="Добавить товар"]').exists()).toBe(true);
  });
});

