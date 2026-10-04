import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';

import { Role } from '@/types/api';

vi.mock('@/services/api', () => ({
  apiService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('initializes with empty state', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('logs in successfully', async () => {
    const store = useAuthStore();
    const mockResponse = {
      user: {
        id: 1,
        email: 'test@test.com',
        username: 'test',
        fullName: 'Test User',
        role: Role.GUEST as const,
        isSuperAdmin: false,
      },
    };

    vi.mocked(apiService.login).mockResolvedValue(mockResponse);

    await store.login({ username: 'test', password: 'password' });

    expect(store.user).toEqual(mockResponse.user);
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('logs out successfully', async () => {
    const store = useAuthStore();
    store.user = {
      id: 1,
      email: 'test@test.com',
      username: 'test',
      fullName: 'Test User',
      role: Role.GUEST as const,
      isSuperAdmin: false,
    };
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('user', JSON.stringify(store.user));
    vi.mocked(apiService.logout).mockResolvedValue(undefined);

    await store.logout();

    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('checks admin role correctly', () => {
    const store = useAuthStore();
    store.user = {
      id: 1,
      email: 'test@test.com',
      username: 'admin',
      fullName: 'Admin',
      role: Role.ADMIN as const,
      isSuperAdmin: false,
    };

    expect(store.isAdmin).toBe(true);
    expect(store.hasRole(Role.ADMIN)).toBe(true);
  });
});
