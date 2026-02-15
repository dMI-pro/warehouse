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

:root {
  /* Цветовая палитра */
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  --background-color: #f5f5f5;
  --text-color: #262626;
  --card-background: #ffffff;
  --border-color: #d9d9d9;
}

.light-theme {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  --background-color: #f5f5f5;
  --text-color: #262626;
  --card-background: #ffffff;
  --border-color: #d9d9d9;
  --surface-ground: #f5f5f5;
  --surface-card: #ffffff;
  --text-color-primary: #262626;
  --text-color-secondary: #8c8c8c;
}

.dark-theme {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  --background-color: #141414;
  --text-color: #ffffff;
  --card-background: #1f1f1f;
  --border-color: #434343;
  --surface-ground: #141414;
  --surface-card: #1f1f1f;
  --text-color-primary: #ffffff;
  --text-color-secondary: #a6a6a6;
}

body {
  font-family: var(--font-family);
  color: var(--text-color);
  background-color: var(--background-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  min-height: 100vh;
  background-color: var(--background-color);
  transition: background-color 0.3s ease;
}

/* Переопределение цветов PrimeVue для соответствия палитре */
.p-button-primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.p-button-primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.p-button-success {
  background: var(--success-color);
  border-color: var(--success-color);
}

.p-button-warning {
  background: var(--warning-color);
  border-color: var(--warning-color);
}

.p-button-danger {
  background: var(--error-color);
  border-color: var(--error-color);
}

/* Адаптивные стили */
@media (max-width: 768px) {
  .p-datatable .p-datatable-thead > tr > th,
  .p-datatable .p-datatable-tbody > tr > td {
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  .p-datatable-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .p-dialog {
    width: 95vw !important;
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>
