import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginDto, RegisterDto } from '@/types/api';
import { Role } from '@/types/api';
import { apiService } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const dropLegacyTokenStorage = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  dropLegacyTokenStorage();

  const isAuthenticated = computed(() => !!user.value);

  const hasRole = (role: Role) => {
    return user.value?.role === role || user.value?.isSuperAdmin;
  };

  const isAdmin = computed(() => {
    return user.value?.role === Role.ADMIN || user.value?.isSuperAdmin;
  });

  const isManager = computed(() => user.value?.role === Role.MANAGER);
  const isSeller = computed(() => user.value?.role === Role.SELLER);
  const isGuest = computed(() => user.value?.role === Role.GUEST);

  const isAdminOrManager = computed(() => isAdmin.value || isManager.value);

  const login = async (loginDto: LoginDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.login(loginDto);
      user.value = response.user || null;
      dropLegacyTokenStorage();
      return response;
    } catch (err: any) {
      const raw = err.response?.data?.message;
      const fromApi = Array.isArray(raw) ? raw.join(', ') : raw;
      error.value =
        fromApi ||
        (err.response?.status === 429
          ? 'Слишком много попыток входа. Подождите несколько минут.'
          : 'Ошибка входа');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (registerDto: RegisterDto) => {
    loading.value = true;
    error.value = null;
    try {
      return await apiService.register(registerDto);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка регистрации';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch {
      // Cookies/session may already be gone; always clear local state.
    } finally {
      clearAuth();
    }
  };

  const clearAuth = () => {
    user.value = null;
    dropLegacyTokenStorage();
  };

  const checkAuth = async () => {
    try {
      const currentUser = await apiService.getMe();
      user.value = currentUser;
      return true;
    } catch {
      clearAuth();
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isManager,
    isSeller,
    isGuest,
    isAdminOrManager,
    hasRole,
    login,
    register,
    logout,
    checkAuth,
  };
});
