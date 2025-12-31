<template>
  <Toast />
  <ConfirmDialog />
  <router-view />
</template>

<script setup lang="ts">
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
</script>

<script setup lang="ts"></script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  color: var(--text-color);
  background-color: var(--surface-ground);
}

#app {
  min-height: 100vh;
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .p-datatable .p-datatable-thead > tr > th,
  .p-datatable .p-datatable-tbody > tr > td {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
</style>
