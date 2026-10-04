<template>
  <Button
    :icon="themeStore.currentTheme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
    :label="themeStore.currentTheme === 'dark' ? '☀️' : '🌙'"
    severity="secondary"
    text
    rounded
    @click="themeStore.toggleTheme"
    v-tooltip.top="themeStore.currentTheme === 'dark' ? 'Светлая тема' : 'Темная тема'"
  />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Button from 'primevue/button';
import { useThemeStore } from '@/stores/themeStore';

const themeStore = useThemeStore();

onMounted(() => {
  themeStore.setTheme(themeStore.currentTheme);
});
</script>

<style scoped>
:deep(.p-button-label) {
  font-size: 1.25rem;
}
</style>

