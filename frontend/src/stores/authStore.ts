import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginDto, RegisterDto, Role } from '@/types/api';
import { apiService } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Инициализация из localStorage
  const initAuth = () => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      token.value = storedToken;
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        clearAuth();
      }
    }
  };

  // Проверка авторизации
  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // Проверка роли
  const hasRole = (role: Role) => {
    return user.value?.role === role || user.value?.isSuperAdmin;
  };

  // Проверка на админа
  const isAdmin = computed(() => {
    return user.value?.role === 'ADMIN' || user.value?.isSuperAdmin;
  });

  // Вход
  const login = async (loginDto: LoginDto) => {
    // debugger
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.login(loginDto);
      token.value = response.access_token;
      user.value = response.user;

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка входа';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Регистрация
  const register = async (registerDto: RegisterDto) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiService.register(registerDto);
      token.value = response.access_token;
      user.value = response.user;

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка регистрации';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Выход
  const logout = () => {
    clearAuth();
  };

  // Очистка данных
  const clearAuth = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  // Проверка текущего пользователя
  const checkAuth = async () => {
    if (!token.value) return false;

    try {
      const currentUser = await apiService.getMe();
      user.value = currentUser;
      localStorage.setItem('user', JSON.stringify(currentUser));
      return true;
    } catch (err) {
      clearAuth();
      return false;
    }
  };

  // Инициализация при старте
  initAuth();

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    hasRole,
    login,
    register,
    logout,
    checkAuth,
    initAuth,
  };
});



