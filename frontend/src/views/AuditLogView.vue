<template>
  <div class="audit-log">
    <h1 class="page-title">Журнал действий</h1>

    <!-- Фильтры -->
    <Card class="filters-card mb-4">
      <template #content>
        <div class="filters-grid">
          <div class="filter-item">
            <label for="user" class="filter-label">Пользователь</label>
            <AutoComplete
              id="user"
              v-model="selectedUser"
              :suggestions="userSuggestions"
              @complete="searchUsers"
              optionLabel="fullName"
              placeholder="Выберите пользователя"
              class="w-full"
            />
          </div>
          <div class="filter-item">
            <label for="actionType" class="filter-label">Тип действия</label>
            <Dropdown
              id="actionType"
              v-model="filters.actionType"
              :options="actionTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Все типы"
              class="w-full"
            />
          </div>
          <div class="filter-item">
            <label for="startDate" class="filter-label">Дата начала</label>
            <Calendar
              id="startDate"
              v-model="filters.startDate"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-full"
            />
          </div>
          <div class="filter-item">
            <label for="endDate" class="filter-label">Дата окончания</label>
            <Calendar
              id="endDate"
              v-model="filters.endDate"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-full"
            />
          </div>
          <div class="filter-item">
            <Button
              label="Применить фильтры"
              icon="pi pi-filter"
              class="w-full"
              @click="applyFilters"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Таблица журнала -->
    <Card>
      <template #content>
        <DataTable
          :value="filteredLogs"
          :loading="loading"
          :paginator="true"
          :rows="20"
          :rowsPerPageOptions="[20, 50, 100]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} - {last} из {totalRecords}"
          :emptyMessage="loading ? 'Загрузка...' : 'Нет записей'"
          class="audit-table"
        >
          <Column header="Время" :sortable="true" style="width: 150px">
            <template #body="{ data }">
              {{ formatDateTime(data.time) }}
            </template>
          </Column>
          <Column header="Пользователь" :sortable="true" style="width: 200px">
            <template #body="{ data }">
              <div class="user-cell">
                <div class="avatar-small" :style="{ backgroundColor: getAvatarColor(data.user.role) }">
                  {{ getInitials(data.user.fullName || data.user.username) }}
                </div>
                <span>{{ data.user.fullName || data.user.username }}</span>
              </div>
            </template>
          </Column>
          <Column header="Действие" :sortable="true">
            <template #body="{ data }">
              <div class="action-cell">
                <i :class="getActionIcon(data.action)" :style="{ color: getActionColor(data.action) }"></i>
                <span>{{ getActionLabel(data.action) }}</span>
              </div>
            </template>
          </Column>
          <Column header="Сущность" :sortable="true">
            <template #body="{ data }">
              <a v-if="data.entityId" href="#" class="entity-link" @click.prevent="viewEntity(data)">
                {{ data.entityType }} #{{ data.entityId }}
              </a>
              <span v-else>—</span>
            </template>
          </Column>
          <Column header="Подробности" style="width: 120px">
            <template #body="{ data }">
              <Button
                v-if="data.details"
                label="Показать"
                icon="pi pi-eye"
                severity="info"
                text
                size="small"
                @click="showDetails(data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Диалог с подробностями -->
    <Dialog
      v-model:visible="detailsDialogVisible"
      header="Подробности действия"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div v-if="selectedLog" class="details-content">
        <div class="detail-section">
          <h4>Действие</h4>
          <p>{{ getActionLabel(selectedLog.action) }}</p>
        </div>
        <div class="detail-section">
          <h4>Пользователь</h4>
          <p>{{ selectedLog.user.fullName || selectedLog.user.username }}</p>
        </div>
        <div class="detail-section">
          <h4>Время</h4>
          <p>{{ formatDateTime(selectedLog.time) }}</p>
        </div>
        <div v-if="selectedLog.details" class="detail-section">
          <h4>Изменения</h4>
          <div class="changes">
            <div v-if="selectedLog.details.old" class="change-item">
              <strong>Было:</strong>
              <pre>{{ JSON.stringify(selectedLog.details.old, null, 2) }}</pre>
            </div>
            <div v-if="selectedLog.details.new" class="change-item">
              <strong>Стало:</strong>
              <pre>{{ JSON.stringify(selectedLog.details.new, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import AutoComplete from 'primevue/autocomplete';
import Dialog from 'primevue/dialog';
import { useUsersStore } from '@/stores/usersStore';
import type { User, Role } from '@/types/api';

const usersStore = useUsersStore();
const loading = ref(false);
const selectedUser = ref<User | null>(null);
const userSuggestions = ref<User[]>([]);
const detailsDialogVisible = ref(false);
const selectedLog = ref<any>(null);

const filters = reactive({
  actionType: null as string | null,
  startDate: null as Date | null,
  endDate: null as Date | null,
});

const actionTypeOptions = [
  { label: 'Все типы', value: null },
  { label: 'Создание товара', value: 'product.create' },
  { label: 'Обновление товара', value: 'product.update' },
  { label: 'Удаление товара', value: 'product.delete' },
  { label: 'Продажа', value: 'sale.create' },
  { label: 'Создание пользователя', value: 'user.create' },
  { label: 'Обновление пользователя', value: 'user.update' },
];

// Моковые данные для журнала
const auditLogs = ref([
  {
    id: 1,
    time: new Date().toISOString(),
    user: { id: 1, username: 'admin', fullName: 'Администратор', role: 'ADMIN' as Role },
    action: 'product.create',
    entityType: 'Товар',
    entityId: 123,
    details: {
      old: null,
      new: { name: 'Новый товар', price: 1000 },
    },
  },
  {
    id: 2,
    time: new Date(Date.now() - 3600000).toISOString(),
    user: { id: 2, username: 'seller1', fullName: 'Иван Иванов', role: 'SELLER' as Role },
    action: 'sale.create',
    entityType: 'Продажа',
    entityId: 456,
    details: {
      old: null,
      new: { quantity: 5, total: 5000 },
    },
  },
  {
    id: 3,
    time: new Date(Date.now() - 7200000).toISOString(),
    user: { id: 3, username: 'manager1', fullName: 'Петр Петров', role: 'MANAGER' as Role },
    action: 'product.update',
    entityType: 'Товар',
    entityId: 123,
    details: {
      old: { price: 1000 },
      new: { price: 1200 },
    },
  },
]);

const filteredLogs = computed(() => {
  let logs = auditLogs.value;

  if (selectedUser.value) {
    logs = logs.filter((log) => log.user.id === selectedUser.value!.id);
  }

  if (filters.actionType) {
    logs = logs.filter((log) => log.action === filters.actionType);
  }

  if (filters.startDate) {
    logs = logs.filter((log) => new Date(log.time) >= filters.startDate!);
  }

  if (filters.endDate) {
    logs = logs.filter((log) => new Date(log.time) <= filters.endDate!);
  }

  return logs;
});

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getActionIcon = (action: string): string => {
  const iconMap: Record<string, string> = {
    'product.create': 'pi pi-plus-circle',
    'product.update': 'pi pi-pencil',
    'product.delete': 'pi pi-trash',
    'sale.create': 'pi pi-shopping-cart',
    'user.create': 'pi pi-user-plus',
    'user.update': 'pi pi-user-edit',
  };
  return iconMap[action] || 'pi pi-info-circle';
};

const getActionColor = (action: string): string => {
  const colorMap: Record<string, string> = {
    'product.create': '#52c41a',
    'product.update': '#1890ff',
    'product.delete': '#ff4d4f',
    'sale.create': '#faad14',
    'user.create': '#52c41a',
    'user.update': '#1890ff',
  };
  return colorMap[action] || '#8c8c8c';
};

const getActionLabel = (action: string): string => {
  const labelMap: Record<string, string> = {
    'product.create': 'Создание товара',
    'product.update': 'Обновление товара',
    'product.delete': 'Удаление товара',
    'sale.create': 'Продажа',
    'user.create': 'Создание пользователя',
    'user.update': 'Обновление пользователя',
  };
  return labelMap[action] || action;
};

const getAvatarColor = (role: Role): string => {
  const colorMap: Record<Role, string> = {
    GUEST: '#8c8c8c',
    SELLER: '#faad14',
    MANAGER: '#52c41a',
    ADMIN: '#1890ff',
  };
  return colorMap[role] || '#8c8c8c';
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const searchUsers = (event: any) => {
  const query = event.query.toLowerCase();
  userSuggestions.value = usersStore.users.filter(
    (user) =>
      user.fullName?.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
  );
};

const applyFilters = () => {
  // Фильтры применяются через computed свойство
};

const showDetails = (log: any) => {
  selectedLog.value = log;
  detailsDialogVisible.value = true;
};

const viewEntity = (log: any) => {
  // В реальном приложении здесь будет переход на страницу сущности
  console.log('View entity:', log);
};

onMounted(() => {
  usersStore.fetchUsers();
});
</script>

<style scoped>
.audit-log {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.filters-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.audit-table {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.audit-table :deep(.p-datatable-tbody > tr) {
  background-color: var(--surface-card);
}

.audit-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
}

.action-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.entity-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.entity-link:hover {
  text-decoration: underline;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.detail-section p {
  margin: 0;
  color: var(--text-color);
}

.changes {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.change-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.change-item pre {
  background: var(--surface-50);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 0;
}
</style>

