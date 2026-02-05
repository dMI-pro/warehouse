<template>
  <div class="audit-log" v-if="authStore.isAdmin || authStore.user?.isSuperAdmin">
    <div class="flex align-items-center justify-content-between mb-3">
      <h1 class="page-title">Журнал действий</h1>
      <Button label="Экспорт Excel" icon="pi pi-file-excel" class="p-button-sm" @click="exportAuditExcel" />
    </div>

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
          :rows="pagination.limit"
          :totalRecords="pagination.total"
          :first="(pagination.page - 1) * pagination.limit"
          :rowsPerPageOptions="[20, 50, 100]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} - {last} из {totalRecords}"
          :emptyMessage="loading ? 'Загрузка...' : 'Нет записей'"
          class="audit-table"
          @page="onPageChange"
        >
          <Column header="Время" :sortable="true" style="width: 150px">
            <template #body="{ data }">
              {{ formatDateTime(data.createdAt) }}
            </template>
          </Column>
          <Column header="Пользователь" :sortable="true" style="width: 200px">
            <template #body="{ data }">
              <div v-if="data.user" class="user-cell">
                <div class="avatar-small" :style="{ backgroundColor: getAvatarColor(data.user.role) }">
                  {{ getInitials(getActorDisplayName(data.user)) }}
                </div>
                <span :class="['audit-user-label', { 'self-actor': isCurrentUserActor(data.user) }]">
                  {{ getActorDisplayName(data.user) }}
                </span>
              </div>
              <span v-else>Система</span>
            </template>
          </Column>
          <Column header="Действие" :sortable="true">
            <template #body="{ data }">
              <div class="action-cell">
                <i :class="getActionIcon(data.action)" :style="{ color: getActionColor(data.action) }"></i>
                <span>{{ getActionLabel(data.action) }}</span>
                <Tag
                  v-if="data.success === false"
                  value="Неудачно"
                  severity="danger"
                  style="margin-left: 0.5rem"
                />
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
                v-if="data.oldValues || data.newValues"
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
      :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
      maximizable
    >
        <div v-if="selectedLog" class="details-content">
          <div class="detail-section">
            <h4>Действие</h4>
            <p>{{ getActionLabel(selectedLog.action) }}</p>
          </div>
          <div class="detail-section">
            <h4>Пользователь</h4>
            <p>
              {{ selectedLog.user ? getActorDisplayName(selectedLog.user) : 'Система' }}
            </p>
          </div>
          <div class="detail-section">
            <h4>Время</h4>
            <p>{{ formatDateTime(selectedLog.createdAt) }}</p>
          </div>
          <div v-if="selectedLog.ipAddress || selectedLog.userAgent" class="detail-section">
            <h4>Информация о подключении</h4>
            <p v-if="selectedLog.ipAddress"><strong>IP адрес:</strong> {{ selectedLog.ipAddress }}</p>
            <p v-if="selectedLog.userAgent"><strong>User Agent:</strong> {{ selectedLog.userAgent }}</p>
          </div>
          <div v-if="selectedLogChanges.length" class="detail-section">
            <h4>Изменения</h4>
            <div class="changes-table-wrapper">
              <table class="changes-table">
                <thead>
                  <tr>
                    <th>Поле</th>
                    <th>Было</th>
                    <th>Стало</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="change in selectedLogChanges" :key="change.key">
                    <td class="change-key">{{ change.key }}</td>
                    <td class="change-old">{{ change.old }}</td>
                    <td class="change-new">{{ change.new }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </Dialog>
  </div>
  <div v-else class="audit-log">
    <Message severity="error" :closable="false">
      У вас нет доступа к этой странице. Только администраторы могут просматривать журнал действий.
    </Message>
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
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import { useUsersStore } from '@/stores/usersStore';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';
import type { User, Role, AuditLog, PaginatedResponse } from '@/types/api';
import { isCurrentUserActor, getActorDisplayName, getInitials, getAvatarColor } from '@/utils/user-utils';
import { getDefaultTemplate } from '@/utils/exportTemplates';
import { exportExcelTable, type ExcelColumn } from '@/utils/excelExport';

const usersStore = useUsersStore();
const authStore = useAuthStore();
const loading = ref(false);
const selectedUser = ref<User | null>(null);
const userSuggestions = ref<User[]>([]);
const detailsDialogVisible = ref(false);
const selectedLog = ref<AuditLog | null>(null);
const selectedLogChanges = ref<Array<{ key: string; old: string; new: string }>>([]);
const auditLogs = ref<AuditLog[]>([]);
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
});

const filters = reactive({
  actionType: null as string | null,
  startDate: null as Date | null,
  endDate: null as Date | null,
});

const actionTypeOptions = [
  { label: 'Все типы', value: null },
  { label: 'Вход в систему', value: 'login' },
  { label: 'Попытка входа', value: 'login_attempt' },
  { label: 'Создание товара', value: 'product.create' },
  { label: 'Обновление товара', value: 'product.update' },
  { label: 'Удаление товара', value: 'product.delete' },
  { label: 'Продажа', value: 'sale.create' },
  { label: 'Создание пользователя', value: 'user.create' },
  { label: 'Обновление пользователя', value: 'user.update' },
];

const fetchAuditLogs = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    };

    if (selectedUser.value) {
      params.userId = selectedUser.value.id;
    }

    if (filters.actionType) {
      params.action = filters.actionType;
    }

    if (filters.startDate) {
      params.startDate = filters.startDate.toISOString().split('T')[0];
    }

    if (filters.endDate) {
      params.endDate = filters.endDate.toISOString().split('T')[0];
    }

    const response: PaginatedResponse<AuditLog> = await apiService.getAuditLogs(params);
    auditLogs.value = response.data;
    pagination.value = {
      total: response.meta.total,
      page: response.meta.page,
      limit: response.meta.limit,
      totalPages: response.meta.totalPages,
    };
  } catch (error) {
    console.error('Failed to load audit logs', error);
  } finally {
    loading.value = false;
  }
};

const filteredLogs = computed(() => {
  return auditLogs.value;
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
    'login': 'pi pi-sign-in',
    'login_attempt': 'pi pi-exclamation-triangle',
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
    'login': '#52c41a',
    'login_attempt': '#ff4d4f',
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
    'login': 'Вход в систему',
    'login_attempt': 'Попытка входа',
    'product.create': 'Создание товара',
    'product.update': 'Обновление товара',
    'product.delete': 'Удаление товара',
    'sale.create': 'Продажа',
    'user.create': 'Создание пользователя',
    'user.update': 'Обновление пользователя',
  };
  return labelMap[action] || action;
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

const applyFilters = async () => {
  pagination.value.page = 1;
  await fetchAuditLogs();
};

const buildChanges = (log: AuditLog | null) => {
  const result: Array<{ key: string; old: string; new: string }> = [];
  if (!log) {
    return result;
  }
  const oldValues = (log.oldValues || {}) as Record<string, any>;
  const newValues = (log.newValues || {}) as Record<string, any>;
  const keys = new Set<string>([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {}),
  ]);
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };
  keys.forEach((key) => {
    const oldVal = oldValues ? oldValues[key] : undefined;
    const newVal = newValues ? newValues[key] : undefined;
    if (oldVal === undefined && newVal === undefined) {
      return;
    }
    result.push({
      key,
      old: formatValue(oldVal),
      new: formatValue(newVal),
    });
  });
  return result;
};

const showDetails = (log: AuditLog) => {
  selectedLog.value = log;
  selectedLogChanges.value = buildChanges(log);
  detailsDialogVisible.value = true;
};

const viewEntity = (log: any) => {
  // В реальном приложении здесь будет переход на страницу сущности
  console.log('View entity:', log);
};

const onPageChange = async (event: any) => {
  pagination.value.page = event.page + 1;
  await fetchAuditLogs();
};

onMounted(async () => {
  if (authStore.isAdmin || authStore.user?.isSuperAdmin) {
    await usersStore.fetchUsers();
    await fetchAuditLogs();
  }
});

const exportAuditExcel = async () => {
  const logs = filteredLogs.value;
  if (!logs.length) {
    return;
  }
  const rows = logs.map((l) => ({
    createdAt: l.createdAt,
    user: l.user ? getActorDisplayName(l.user) : 'Система',
    action: getActionLabel(l.action),
    entity: l.entityType ? `${l.entityType} #${l.entityId ?? ''}` : '—',
    success: l.success === false ? 'Неудачно' : 'Успешно',
    ipAddress: l.ipAddress || '',
    userAgent: l.userAgent || '',
  }));
  const allColumns: ExcelColumn[] = [
    { key: 'createdAt', header: 'Время', type: 'date' },
    { key: 'user', header: 'Пользователь', type: 'string' },
    { key: 'action', header: 'Действие', type: 'string' },
    { key: 'entity', header: 'Сущность', type: 'string' },
    { key: 'success', header: 'Статус', type: 'string' },
    { key: 'ipAddress', header: 'IP адрес', type: 'string' },
    { key: 'userAgent', header: 'User Agent', type: 'string' },
  ];
  const template = getDefaultTemplate('audit');
  const columns = template?.columns?.length
    ? allColumns.filter((c) => template!.columns!.includes(c.key))
    : allColumns;
  await exportExcelTable(columns, rows, {
    totals: false,
    tableName: 'AuditLog',
    fileName: `audit_${new Date().toISOString().split('T')[0]}.xlsx`,
  });
};
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

.audit-user-label.self-actor {
  font-weight: 600;
  color: var(--primary-color);
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

.changes-table-wrapper {
  max-height: 300px;
  overflow-y: auto;
}

.changes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.changes-table th,
.changes-table td {
  border: 1px solid var(--surface-border);
  padding: 0.5rem;
  vertical-align: top;
}

.changes-table th {
  background: var(--surface-50);
  font-weight: 600;
}

.change-key {
  width: 25%;
  font-weight: 500;
}

.change-old {
  width: 37.5%;
}

.change-new {
  width: 37.5%;
}
</style>

