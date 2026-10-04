<template>
  <div
    class="filter-field"
    :class="{
      'filter-field--actions': actions,
      'filter-field--wide': wide,
    }"
  >
    <label v-if="label" :for="htmlFor" class="filter-field__label">{{ label }}</label>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    htmlFor?: string;
    /** Stretch control for apply/reset buttons */
    actions?: boolean;
    /** Prefer wider column in products-like grids */
    wide?: boolean;
  }>(),
  {
    actions: false,
    wide: false,
  },
);
</script>

<style scoped>
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.filter-field__label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-color);
}

.filter-field--actions {
  justify-content: flex-end;
}

.filter-field--actions :deep(.p-button),
.filter-field--actions :deep(.filter-actions-stack) {
  width: 100%;
}
</style>
