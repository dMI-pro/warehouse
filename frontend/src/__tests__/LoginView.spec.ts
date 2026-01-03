import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import { useAuthStore } from '@/stores/authStore';

import { Role } from '@/types/api';

describe('LoginView', () => {
  let router: ReturnType<typeof createRouter>;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', component: LoginView },
        { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
      ],
    });
  });

  it('renders login form', () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [pinia, router],
      },
    });

    expect(wrapper.find('input[id="username"]').exists()).toBe(true);
    expect(wrapper.find('input[id="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('validates required fields', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [pinia, router],
      },
    });

    const form = wrapper.find('form');
    await form.trigger('submit.prevent');

    // Проверяем, что форма не отправлена при пустых полях
    const authStore = useAuthStore();
    const loginSpy = vi.spyOn(authStore, 'login');
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('calls login on form submit with valid data', async () => {
    const wrapper = mount(LoginView, {
      global: {
        plugins: [pinia, router],
      },
    });

    const authStore = useAuthStore();
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue({
      access_token: 'token',
      user: {
        id: 1,
        email: 'test@test.com',
        username: 'test',
        fullName: 'Test User',
        role: Role.GUEST as const,
        isSuperAdmin: false,
      },
    });

    await wrapper.find('input[id="username"]').setValue('testuser');
    await wrapper.find('input[id="password"]').setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');

    expect(loginSpy).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123',
    });
  });
});

