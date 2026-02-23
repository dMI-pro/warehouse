<template>
  <div class="media-view">
    <div class="header">
      <h2>Медиа</h2>
      <div class="actions">
        <ToggleButton
          v-model="modeGallery"
          onLabel="Таблица"
          offLabel="Галерея"
          onIcon="pi pi-images"
          offIcon="pi pi-table"
          :pt="{ root: { class: 'mode-toggle' } }"
        />
        <Button
          label="Удалить выбранные"
          icon="pi pi-trash"
          severity="danger"
          :disabled="selectedKeys.length === 0 || deleting"
          @click="confirmDeleteSelected"
        />
      </div>
    </div>

    <div class="filters">
      <IconField class="search">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="filters.search"
          placeholder="Поиск по названию"
          @keyup.enter="() => load()"
        />
      </IconField>

      <Calendar
        v-model="filters.date"
        dateFormat="dd.mm.yy"
        placeholder="Дата добавления"
        showIcon
        class="date-filter"
        @date-select="onDateSelect"
        :manualInput="false"
      />

      <ToggleButton
        v-model="filters.unusedOnly"
        onLabel="Нигде не используются"
        offLabel="Все"
        onIcon="pi pi-filter-slash"
        offIcon="pi pi-filter"
        class="unused-toggle"
        @update:modelValue="() => load()"
      />

      <Dropdown
        v-model="sortBy"
        :options="sortByOptions"
        optionLabel="label"
        optionValue="value"
        class="sort-by"
      />
      <Dropdown
        v-model="sortOrder"
        :options="sortOrderOptions"
        optionLabel="label"
        optionValue="value"
        class="sort-order"
      />
      <Button label="Применить" icon="pi pi-filter" @click="() => load()" />
      <Button label="Сбросить" icon="pi pi-times" text @click="resetFilters" />
    </div>

    <div v-if="!modeGallery" class="table-mode">
      <DataTable
        :value="items"
        dataKey="key"
        :loading="loading"
        :paginator="true"
        :rows="pagination.limit"
        :totalRecords="pagination.total"
        :lazy="true"
        :first="(pagination.page - 1) * pagination.limit"
        @page="onPage"
        sortMode="single"
        :sortField="tableSortField"
        :sortOrder="tableSortOrder"
        :rowClass="rowClass"
        @sort="onSort"
        selectionMode="multiple"
        v-model:selection="selectedRows"
      >
        <Column selectionMode="multiple" headerStyle="width:3rem" />
        <Column field="preview" header="" headerStyle="width:80px">
          <template #body="{ data }">
            <img
              v-if="data.type === 'image'"
              :src="data.url"
              :alt="data.key"
              class="product-image"
            />
            <i v-else class="pi pi-video" />
          </template>
        </Column>
        <Column field="key" header="Имя" sortable />
        <Column field="type" header="Тип" sortable />
        <Column field="size" header="Размер" sortable>
          <template #body="{ data }">{{ formatSize(data.size) }}</template>
        </Column>
        <Column field="lastModified" header="Добавлено" sortable>
          <template #body="{ data }">{{ formatDate(data.lastModified) }}</template>
        </Column>
        <Column field="usedCount" header="Используется" headerStyle="width:140px" sortable>
          <template #body="{ data }">
            <Tag :severity="data.used ? 'success' : 'secondary'"
                 :value="data.used ? `Да (${data.usedCount})` : 'Нет'" />
          </template>
        </Column>
        <Column header="Действия" headerStyle="width:120px">
          <template #body="{ data }">
            <Button icon="pi pi-trash" severity="danger" text
                    @click="confirmDelete([data.key])" />
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-else class="gallery-mode">
      <div class="grid">
        <div v-for="item in items" :key="item.key" class="card">
          <div class="select">
            <Checkbox v-model="selectedKeyMap[item.key]" :binary="true" />
          </div>
          <div class="preview">
            <img v-if="item.type==='image'" :src="item.url" />
            <div v-else class="video-badge">
              <i class="pi pi-video" />
            </div>
          </div>
          <div class="meta">
            <div class="name" :title="item.key">{{ item.key }}</div>
            <div class="info">
              <span>{{ formatSize(item.size) }}</span>
              <span>•</span>
              <span>{{ formatDate(item.lastModified) }}</span>
            </div>
            <div class="used">
              <Tag :severity="item.used ? 'success' : 'secondary'"
                   :value="item.used ? `Исп.: ${item.usedCount}` : 'Не используется'" />
              <Button icon="pi pi-trash" text size="small" severity="danger"
                      @click="confirmDelete([item.key])" />
            </div>
          </div>
        </div>
      </div>
      <Paginator
        class="media-paginator"
        :rows="pagination.limit"
        :totalRecords="pagination.total"
        :first="(pagination.page - 1) * pagination.limit"
        @page="onPage"
      />
    </div>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import ToggleButton from 'primevue/togglebutton';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import DataTable, { type DataTableSortEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Paginator from 'primevue/paginator';
import Checkbox from 'primevue/checkbox';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Toast from 'primevue/toast';

import { apiService } from '@/services/api';
import type { MediaItem, PaginatedResponse } from '@/types/api';

const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const deleting = ref(false);
const items = ref<MediaItem[]>([]);
const pagination = reactive({ total: 0, page: 1, limit: 24, totalPages: 0 });

const modeGallery = ref(false);
const filters = reactive<{ search: string; unusedOnly: boolean; date: Date | null }>({
  search: '',
  unusedOnly: false,
  date: null,
});
const sortBy = ref<'date' | 'name' | 'size' | 'type' | 'used'>('date');
const sortOrder = ref<'asc' | 'desc'>('desc');

const sortByOptions = [
  { label: 'По дате', value: 'date' },
  { label: 'По названию', value: 'name' },
  { label: 'По типу', value: 'type' },
  { label: 'По размеру', value: 'size' },
  { label: 'По использованию', value: 'used' },
];
const sortOrderOptions = [
  { label: 'По убыванию', value: 'desc' },
  { label: 'По возрастанию', value: 'asc' },
];

const selectedRows = ref<MediaItem[]>([]);
const selectedKeyMap = reactive<Record<string, boolean>>({});
const selectedKeys = computed(() => {
  const keysFromRows = selectedRows.value.map((r) => r.key);
  const keysFromMap = Object.keys(selectedKeyMap).filter((k) => selectedKeyMap[k]);
  const set = new Set([...keysFromRows, ...keysFromMap]);
  return Array.from(set);
});

const tableSortField = computed(() => {
  if (sortBy.value === 'name') return 'key';
  if (sortBy.value === 'type') return 'type';
  if (sortBy.value === 'size') return 'size';
  if (sortBy.value === 'used') return 'usedCount';
  return 'lastModified';
});
const tableSortOrder = computed(() => (sortOrder.value === 'asc' ? 1 : -1));

function formatSize(bytes: number) {
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  if (bytes === 0) return '0 Б';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function rowClass(data: MediaItem) {
  return selectedKeys.value.includes(data.key) ? 'row-selected' : '';
}

function computeDateRange() {
  if (!filters.date) return { startDate: undefined as string | undefined, endDate: undefined as string | undefined };
  const start = new Date(filters.date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(filters.date);
  end.setHours(23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

async function load(page?: number) {
  loading.value = true;
  try {
    if (typeof page === 'number') pagination.page = page;
    const { startDate, endDate } = computeDateRange();
    const res: PaginatedResponse<MediaItem> = await apiService.getMedia({
      search: filters.search || undefined,
      unusedOnly: filters.unusedOnly || undefined,
      startDate,
      endDate,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      page: pagination.page,
      limit: pagination.limit,
    });
    items.value = res.data;
    Object.keys(selectedKeyMap).forEach((k) => (selectedKeyMap[k] = !!selectedKeyMap[k] && !!res.data.find((i) => i.key === k)));
    pagination.total = res.meta.total;
    pagination.totalPages = res.meta.totalPages;
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: e?.response?.data?.message || 'Не удалось загрузить медиа', life: 4000 });
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.search = '';
  filters.unusedOnly = false;
  filters.date = null;
  sortBy.value = 'date';
  sortOrder.value = 'desc';
  pagination.page = 1;
  load();
}

function onPage(evt: { page: number; rows: number }) {
  pagination.page = evt.page + 1;
  pagination.limit = evt.rows;
  load();
}

function onSort(evt: DataTableSortEvent) {
  const field = typeof evt.sortField === 'string' ? evt.sortField : 'lastModified';
  if (field === 'key') sortBy.value = 'name';
  else if (field === 'type') sortBy.value = 'type';
  else if (field === 'size') sortBy.value = 'size';
  else if (field === 'usedCount') sortBy.value = 'used';
  else sortBy.value = 'date';
  sortOrder.value = evt.sortOrder === 1 ? 'asc' : 'desc';
  pagination.page = 1;
  load();
}

function onDateSelect() {
  pagination.page = 1;
  load();
}

function confirmDeleteSelected() {
  confirmDelete(selectedKeys.value);
}

function confirmDelete(keys: string[]) {
  if (!keys.length) return;
  confirm.require({
    message: `Удалить ${keys.length} файл(ов) безвозвратно?`,
    header: 'Подтверждение',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Отмена',
    acceptLabel: 'Удалить',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await doDelete(keys);
    },
  });
}

async function doDelete(keys: string[]) {
  deleting.value = true;
  try {
    const res = await apiService.deleteMedia(keys);
    if (res.errors && res.errors.length) {
      toast.add({ severity: 'warn', summary: 'Частично удалено', detail: `Ошибок: ${res.errors.length}`, life: 4000 });
    } else {
      toast.add({ severity: 'success', summary: 'Удалено', detail: `Файлов: ${res.deleted.length}`, life: 3000 });
    }
    keys.forEach((k) => {
      delete selectedKeyMap[k];
    });
    selectedRows.value = [];
    load();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Ошибка удаления', detail: e?.response?.data?.message || 'Не удалось удалить', life: 4000 });
  } finally {
    deleting.value = false;
  }
}

onMounted(() => load());
</script>

<style scoped>
.media-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.actions {
  display: flex;
  gap: .5rem;
  align-items: center;
}
.filters {
  display: grid;
  grid-template-columns: 1fr auto auto auto auto auto;
  gap: .5rem;
  align-items: center;
}
:deep(.p-datatable-tbody > tr.row-selected) {
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
}
.thumb {
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
}
.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.no-image {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}
.gallery-mode .grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.media-paginator {
  margin-top: 1rem;
}
.gallery-mode .card {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  background: var(--surface-card);
}
.gallery-mode .select {
  position: absolute;
  top: .5rem;
  left: .5rem;
  z-index: 2;
}
.gallery-mode .preview {
  height: 160px;
  background: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: center;
}
.gallery-mode .preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.video-badge {
  font-size: 2rem;
  opacity: .6;
}
.meta {
  padding: .5rem .75rem;
  display: flex;
  flex-direction: column;
  gap: .25rem;
}
.meta .name {
  font-size: .9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta .info {
  font-size: .8rem;
  opacity: .8;
  display: flex;
  gap: .25rem;
}
.meta .used {
  margin-top: .25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
