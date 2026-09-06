<template>
  <Card
    class="filter-bar mb-4"
    :class="[
      cardClass,
      {
        'filter-bar--collapsed': collapsible && collapsed,
        'section-card': collapsible,
        'section-card--collapsed': collapsible && collapsed,
      },
    ]"
  >
    <template v-if="collapsible || title" #title>
      <button
        v-if="collapsible"
        type="button"
        class="filter-bar__header"
        :aria-expanded="!collapsed"
        @click="toggleCollapsed"
      >
        <div class="filter-bar__header-title">
          <i v-if="icon" :class="['pi', icon, 'text-primary']" aria-hidden="true" />
          <span>{{ title || 'Фильтры' }}</span>
        </div>
        <i
          class="pi filter-bar__chevron"
          :class="collapsed ? 'pi-chevron-down' : 'pi-chevron-up'"
          aria-hidden="true"
        />
      </button>
      <div v-else class="filter-bar__header filter-bar__header--static">
        <div class="filter-bar__header-title">
          <i v-if="icon" :class="['pi', icon, 'text-primary']" aria-hidden="true" />
          <span>{{ title }}</span>
        </div>
      </div>
    </template>

    <template v-if="!collapsible || !collapsed" #content>
      <div class="filter-bar__body">
        <div class="filter-bar__grid" :class="`filter-bar__grid--${layout}`">
          <slot />
        </div>
        <slot name="footer" />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card';

withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    /** Grid preset: auto | products | reports | reports-extended | media */
    layout?: 'auto' | 'products' | 'reports' | 'reports-extended' | 'media';
    collapsible?: boolean;
    cardClass?: string;
  }>(),
  {
    icon: 'pi-filter',
    layout: 'auto',
    collapsible: false,
    cardClass: '',
  },
);

const collapsed = defineModel<boolean>('collapsed', { default: false });

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};
</script>

<style scoped>
.filter-bar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  flex-wrap: nowrap;
}

.filter-bar__header--static {
  cursor: default;
}

.filter-bar__header:hover .filter-bar__chevron {
  color: var(--primary-color);
}

.filter-bar__header:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 4px;
  border-radius: 4px;
}

.filter-bar__header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.filter-bar__chevron {
  flex-shrink: 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.filter-bar__body {
  padding-top: 0.25rem;
}

.filter-bar__grid {
  display: grid;
  gap: 1rem 1.25rem;
  align-items: end;
}

.filter-bar__grid--auto {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.filter-bar__grid--products {
  grid-template-columns: minmax(160px, 2fr) repeat(3, minmax(120px, 1fr)) auto auto;
}

.filter-bar__grid--reports {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.filter-bar__grid--reports-extended {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.filter-bar__grid--media {
  grid-template-columns: minmax(160px, 1.4fr) repeat(auto-fit, minmax(140px, 1fr));
}

.filter-bar.section-card :deep(.p-card-body) {
  gap: 1rem;
}

.filter-bar--collapsed :deep(.p-card-body) {
  gap: 0;
}

.filter-bar--collapsed :deep(.p-card-content) {
  display: none;
  padding: 0;
}

@media (min-width: 768px) {
  .filter-bar__grid--reports {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .filter-bar__grid--reports-extended {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .filter-bar__grid--reports-extended {
    grid-template-columns:
      minmax(140px, 1.1fr)
      minmax(130px, 1fr)
      minmax(120px, 1fr)
      minmax(130px, 1fr)
      minmax(130px, 1fr)
      minmax(130px, 1fr)
      minmax(110px, auto)
      minmax(110px, auto);
  }
}

@media (max-width: 768px) {
  .filter-bar__grid--products,
  .filter-bar__grid--reports,
  .filter-bar__grid--reports-extended,
  .filter-bar__grid--media {
    grid-template-columns: 1fr;
  }
}
</style>
