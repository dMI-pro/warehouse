import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';

vi.mock('@/services/api', () => ({
  apiService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
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
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('logs in successfully', async () => {
    const store = useAuthStore();
    const mockResponse = {
      access_token: 'test-token',
      user: {
        id: 1,
        email: 'test@test.com',
        username: 'test',
        fullName: 'Test User',
        role: 'GUEST' as const,
        isSuperAdmin: false,
      },
    };

    vi.mocked(apiService.login).mockResolvedValue(mockResponse);

    await store.login({ username: 'test', password: 'password' });

    expect(store.token).toBe('test-token');
    expect(store.user).toEqual(mockResponse.user);
    expect(store.isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('test-token');
  });

  it('logs out successfully', () => {
    const store = useAuthStore();
    store.user = {
      id: 1,
      email: 'test@test.com',
      username: 'test',
      fullName: 'Test User',
      role: 'GUEST' as const,
      isSuperAdmin: false,
    };
    store.token = 'test-token';
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('user', JSON.stringify(store.user));

    store.logout();

    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
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
      role: 'ADMIN' as const,
      isSuperAdmin: false,
    };

    expect(store.isAdmin).toBe(true);
    expect(store.hasRole('ADMIN')).toBe(true);
  });
});

