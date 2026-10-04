import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type Theme = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'light');

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  };

  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
  };

  // Применяем тему при инициализации
  applyTheme(currentTheme.value);

  // Следим за изменениями темы
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme);
  });

  return {
    currentTheme,
    setTheme,
    toggleTheme,
  };
});

