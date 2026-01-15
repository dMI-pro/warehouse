<template>
  <div class="users">
    <div class="page-header">
      <h1 class="page-title">Пользователи системы</h1>
      <Button
        v-if="authStore.isAdmin"
        label="Добавить пользователя"
        icon="pi pi-plus"
        @click="openAddUserDialog"
      />
    </div>

    <div class="users-layout">
      <!-- Таблица пользователей -->
      <Card class="users-table-card">
        <template #content>
          <Message v-if="usersStore.error" severity="error" :closable="false" class="mb-3">
            {{ usersStore.error }}
          </Message>

          <DataTable
            :value="usersStore.users"
            v-model:selection="selectedUser"
            :loading="usersStore.loading"
            :paginator="true"
            :rows="20"
            :rowsPerPageOptions="[20, 50, 100]"
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} - {last} из {totalRecords}"
            :emptyMessage="usersStore.loading ? 'Загрузка...' : 'Нет пользователей'"
            class="users-table"
            selectionMode="single"
            dataKey="id"
            @row-select="onUserSelect"
          >
            <Column header="Аватар" style="width: 80px">
              <template #body="{ data }">
                <div class="avatar" :style="{ backgroundColor: getAvatarColor(data.role) }">
                  {{ getInitials(data.fullName || data.username) }}
                </div>
              </template>
            </Column>
            <Column field="fullName" header="Имя" :sortable="true" />
            <Column field="username" header="Логин" :sortable="true" />
            <!-- <Column field="email" header="Email" :sortable="true" /> -->
            <Column field="role" header="Роль" :sortable="true">
              <template #body="{ data }">
                <Tag :value="getRoleName(data.role)" :severity="getRoleSeverity(data.role)" />
              </template>
            </Column>
            <Column field="isActive" header="Статус" :sortable="false">
              <template #body="{ data }">
                <Tag
                  :value="data.status?.name"
                  :severity="getUserStatusColor(data.status?.code)"
                />
              </template>
            </Column>
            <Column field="createdAt" header="Дата регистрации" :sortable="true">
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
              </template>
            </Column>
            <Column field="updatedAt" header="Дата изменения" :sortable="true">
              <template #body="{ data }">
                {{ formatDate(data.updatedAt) }}
              </template>
            </Column>
            <Column header="Действия" style="width: 120px">
              <template #body="{ data }">
                <Button
                  v-if="!data.isSuperAdmin || authStore.user?.isSuperAdmin"
                  icon="pi pi-pencil"
                  severity="info"
                  size="small"
                  outlined
                  rounded
                  v-tooltip.top="'Редактировать'"
                  @click="openEditUserDialog(data)"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Правая панель с детальной информацией -->
      <Card v-if="selectedUser" class="user-details-card">
        <template #title>Детальная информация</template>
        <template #content>
          <div class="user-details">
            <div class="user-header">
              <div class="avatar-large" :style="{ backgroundColor: getAvatarColor(selectedUser.role) }">
                {{ getInitials(selectedUser.fullName || selectedUser.username) }}
              </div>
              <div class="user-name">
                <h3>{{ selectedUser.fullName || selectedUser.username }}</h3>
                <Tag :value="getRoleName(selectedUser.role)" :severity="getRoleSeverity(selectedUser.role)" />
              </div>
            </div>

            <Divider />

            <div class="user-info-section">
              <h4>Основная информация</h4>
              <div class="info-item">
                <span class="info-label">Логин:</span>
                <span class="info-value">{{ selectedUser.username }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">{{ selectedUser.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Роль:</span>
                <Tag :value="getRoleName(selectedUser.role)" :severity="getRoleSeverity(selectedUser.role)" />
              </div>
              <div class="info-item">
                <span class="info-label">Статус:</span>
                <Tag
                  :value="selectedUser.status?.name || '—'"
                  :severity="getUserStatusColor(selectedUser.status?.code)"
                />
              </div>
              <div class="info-item">
                <span class="info-label">Дата регистрации:</span>
                <span class="info-value">{{ selectedUser.createdAt ? formatDate(selectedUser.createdAt) : '—' }}</span>
              </div>
            </div>

            <Divider />

            <div class="user-actions-section">
              <h4>Действия</h4>
              <Button
                label="Сбросить пароль"
                icon="pi pi-key"
                severity="warning"
                outlined
                class="w-full"
                @click="handleResetPassword"
              />
            </div>

            <Divider />

            <div class="user-history-section">
              <h4>История действий</h4>
              <div v-if="userHistory.length === 0" class="no-history">
                Нет данных о действиях
              </div>
              <div v-else class="history-list">
                <div
                  v-for="(action, index) in userHistory"
                  :key="index"
                  class="history-item"
                >
                  <div class="history-time">{{ formatDateTime(action.createdAt) }}</div>
                  <div class="history-action-row">
                    <div class="history-action-text">
                      {{ getUserActionLabel(action.action) }}
                    </div>
                    <Button
                      v-if="action.oldValues || action.newValues"
                      label="Подробно"
                      icon="pi pi-eye"
                      text
                      size="small"
                      @click="showHistoryDetails(action)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Диалог добавления/редактирования пользователя -->
    <Dialog
      v-model:visible="userDialogVisible"
      :header="editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'"
      :modal="true"
      :style="{ width: '500px' }"
      @hide="closeUserDialog"
    >
      <form @submit.prevent="saveUser" class="user-form">
        <div class="field">
          <label for="email" class="label">Email *</label>
          <InputText id="email" v-model="userForm.email" type="email" class="w-full" required />
          <small v-if="formErrors.email" class="p-error">{{ formErrors.email }}</small>
        </div>

        <div class="field">
          <label for="username" class="label">Логин *</label>
          <InputText id="username" v-model="userForm.username" class="w-full" required />
          <small v-if="formErrors.username" class="p-error">{{ formErrors.username }}</small>
        </div>

        <div class="field">
          <label for="fullName" class="label">Полное имя *</label>
          <InputText id="fullName" v-model="userForm.fullName" class="w-full" required />
          <small v-if="formErrors.fullName" class="p-error">{{ formErrors.fullName }}</small>
        </div>

        <div class="field">
          <label for="password" class="label">{{ editingUser ? 'Новый пароль' : 'Пароль *' }}</label>
          <InputText
            id="password"
            v-model="userForm.password"
            type="password"
            class="w-full"
            :required="!editingUser"
          />
          <small v-if="formErrors.password" class="p-error">{{ formErrors.password }}</small>
        </div>

        <div class="field">
          <label for="role" class="label">Роль *</label>
          <Dropdown
            id="role"
            v-model="userForm.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            required
          />
        </div>
        <div class="field">
          <label for="userStatusId" class="label">Статус пользователя</label>
          <Dropdown
            id="userStatusId"
            v-model="userForm.userStatusId"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="Выберите статус"
          />
        </div>

        <Message v-if="usersStore.error" severity="error" :closable="false" class="mb-3">
          {{ usersStore.error }}
        </Message>

        <div class="dialog-footer">
          <Button label="Отмена" severity="secondary" outlined @click="closeUserDialog" />
          <Button
            type="submit"
            :label="editingUser ? 'Сохранить' : 'Создать'"
            :loading="usersStore.loading"
          />
        </div>
      </form>
    </Dialog>

    <!-- Диалог подтверждения сброса пароля -->
    <ConfirmDialog />

    <Dialog
      v-model:visible="historyDetailsVisible"
      header="Подробности действия пользователя"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div v-if="selectedHistoryLog" class="details-content">
        <div class="detail-section">
          <h4>Действие</h4>
          <p>{{ getUserActionLabel(selectedHistoryLog.action) }}</p>
        </div>
        <div class="detail-section">
          <h4>Время</h4>
          <p>{{ formatDateTime(selectedHistoryLog.createdAt) }}</p>
        </div>
        <div v-if="selectedHistoryLog.ipAddress || selectedHistoryLog.userAgent" class="detail-section">
          <h4>Информация о подключении</h4>
          <p v-if="selectedHistoryLog.ipAddress"><strong>IP адрес:</strong> {{ selectedHistoryLog.ipAddress }}</p>
          <p v-if="selectedHistoryLog.userAgent"><strong>User Agent:</strong> {{ selectedHistoryLog.userAgent }}</p>
        </div>
        <div v-if="selectedHistoryChanges.length" class="detail-section">
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
                <tr v-for="change in selectedHistoryChanges" :key="change.key">
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Divider from 'primevue/divider';
import ConfirmDialog from 'primevue/confirmdialog';
import { useUsersStore } from '@/stores/usersStore';
import { useUserStatusesStore } from '@/stores/userStatusesStore';
import { useAuthStore } from '@/stores/authStore';
import type { User, CreateUserDto, UpdateUserDto, AuditLog } from '@/types/api';
import { Role, UserStatusColor } from '@/types/api';
import { apiService } from '@/services/api';

const usersStore = useUsersStore();
const authStore = useAuthStore();
const userStatusesStore = useUserStatusesStore();
const confirm = useConfirm();
const toast = useToast();

const selectedUser = ref<User | null>(null);
const userDialogVisible = ref(false);
const editingUser = ref<User | null>(null);

const userForm = reactive({
  email: '',
  username: '',
  fullName: '',
  password: '',
  role: Role.SELLER as Role,
  userStatusId: undefined as number | undefined,
});

const formErrors = reactive({
  email: '',
  username: '',
  fullName: '',
  password: '',
});

const roleOptions = [
  { label: 'Гость', value: Role.GUEST },
  { label: 'Продавец', value: Role.SELLER },
  { label: 'Менеджер', value: Role.MANAGER },
  { label: 'Администратор', value: Role.ADMIN },
];

const statusOptions = computed(() => {
  return userStatusesStore.userStatuses.map(s => ({
    label: s.name,
    value: s.id,
    code: s.code,
  }));
});

const userHistory = ref<AuditLog[]>([]);
const historyDetailsVisible = ref(false);
const selectedHistoryLog = ref<AuditLog | null>(null);
const selectedHistoryChanges = ref<Array<{ key: string; old: string; new: string }>>([]);

const getRoleName = (role: Role): string => {
  const roleNames: Record<Role, string> = {
    GUEST: 'Гость',
    SELLER: 'Продавец',
    MANAGER: 'Менеджер',
    ADMIN: 'Администратор',
  };
  return roleNames[role] || role;
};

const getRoleSeverity = (role: Role): 'success' | 'info' | 'warning' | 'danger' | 'secondary' => {
  const severityMap: Record<Role, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
    GUEST: 'secondary',
    SELLER: 'warning',
    MANAGER: 'success',
    ADMIN: 'info',
  };
  return severityMap[role] || 'info';
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

const getUserStatusColor = (code: UserStatusColor): 'success' | 'info' | 'warn' | 'danger' | 'secondary' => {
  const severityMap: Record<string, 'success' | 'warn' | 'danger' | 'secondary' > = {
    'active': 'success',
    'blocked': 'danger',
    'disabled': 'secondary',
  };
  return severityMap[code?.toLowerCase()] || 'secondary';
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second || '?').toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const onUserSelect = (event: any) => {
  selectedUser.value = event.data;
  loadUserHistory(event.data.id);
};

const loadUserHistory = async (userId: number) => {
  try {
    const resp = await apiService.getAuditLogs({
      userId,
      page: 1,
      limit: 50,
    });
    userHistory.value = resp.data;
  } catch (e) {
    userHistory.value = [];
  }
};

const buildHistoryChanges = (log: AuditLog | null) => {
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

const showHistoryDetails = (log: AuditLog) => {
  selectedHistoryLog.value = log;
  selectedHistoryChanges.value = buildHistoryChanges(log);
  historyDetailsVisible.value = true;
};

const openAddUserDialog = () => {
  editingUser.value = null;
  resetUserForm();
  userDialogVisible.value = true;
};

const openEditUserDialog = (user: User) => {
  editingUser.value = user;
  userForm.email = user.email;
  userForm.username = user.username;
  userForm.fullName = user.fullName;
  userForm.role = user.role;
  userForm.password = '';
  userForm.userStatusId = user.status?.id || undefined;
  userDialogVisible.value = true;
};

const closeUserDialog = () => {
  userDialogVisible.value = false;
  resetUserForm();
};

const resetUserForm = () => {
  userForm.email = '';
  userForm.username = '';
  userForm.fullName = '';
  userForm.password = '';
  userForm.role = Role.SELLER;
  userForm.userStatusId = undefined;
  Object.keys(formErrors).forEach((key) => {
    formErrors[key as keyof typeof formErrors] = '';
  });
};

const validateUserForm = () => {
  let valid = true;
  Object.keys(formErrors).forEach((key) => {
    formErrors[key as keyof typeof formErrors] = '';
  });

  if (!userForm.email.trim()) {
    formErrors.email = 'Email обязателен';
    valid = false;
  }

  if (!userForm.username.trim()) {
    formErrors.username = 'Логин обязателен';
    valid = false;
  }

  if (!userForm.fullName.trim()) {
    formErrors.fullName = 'Полное имя обязательно';
    valid = false;
  }

  if (!editingUser.value && !userForm.password) {
    formErrors.password = 'Пароль обязателен';
    valid = false;
  }

  return valid;
};

const saveUser = async () => {
  if (!validateUserForm()) return;

  try {
    if (editingUser.value) {
      const dto: UpdateUserDto = {
        email: userForm.email,
        username: userForm.username,
        fullName: userForm.fullName,
        role: userForm.role,
        userStatusId: userForm.userStatusId,
        password: userForm.password || undefined,
      };
      await usersStore.updateUser(editingUser.value.id, dto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Пользователь обновлен', life: 3000 });
    } else {
      const dto: CreateUserDto = {
        email: userForm.email,
        username: userForm.username,
        fullName: userForm.fullName,
        role: userForm.role,
        userStatusId: userForm.userStatusId,
        password: userForm.password,
      };
      await usersStore.createUser(dto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Пользователь создан', life: 3000 });
    }
    closeUserDialog();
    await usersStore.fetchUsers();
  } catch (error) {
    // Ошибка уже обработана
  }
};

const handleResetPassword = () => {
  if (!selectedUser.value) return;

  confirm.require({
    message: `Вы уверены, что хотите сбросить пароль для пользователя "${selectedUser.value.fullName || selectedUser.value.username}"?`,
    header: 'Подтверждение сброса пароля',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        // В реальном приложении здесь будет вызов API
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Пароль сброшен. Новый пароль отправлен на email.',
          life: 3000,
        });
      } catch (error) {
        // Ошибка уже обработана
      }
    },
  });
};

onMounted(async () => {
  await usersStore.fetchUsers();
  await userStatusesStore.fetchUserStatuses();
});

// const getStatusSeverity = (code?: string) => {
//   if (!code) return 'secondary';
//   if (code === 'ACTIVE') return 'success';
//   if (code === 'BLOCKED') return 'danger';
//   return 'secondary';
// };

const getUserActionLabel = (action: string): string => {
  const map: Record<string, string> = {
    login: 'Вход в систему',
    login_attempt: 'Попытка входа',
    'user.create': 'Создание пользователя',
    'user.update': 'Обновление пользователя',
    'user.delete': 'Удаление пользователя',
    'sale.create': 'Продажа',
  };
  return map[action] || action;
};
</script>

<style scoped>
.users {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}

.users-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1.5rem;
}

.users-table-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-details-card {
  position: sticky;
  top: 1rem;
  height: fit-content;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.user-info-section,
.user-actions-section,
.user-history-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-info-section h4,
.user-actions-section h4,
.user-history-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.info-label {
  font-weight: 500;
  color: var(--text-color-secondary);
}

.info-value {
  color: var(--text-color);
}

.no-history {
  color: var(--text-color-secondary);
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
}

.history-time {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.history-action {
  font-size: 0.875rem;
  color: var(--text-color);
}

.history-action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.history-action-text {
  flex: 1;
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

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 1200px) {
  .users-layout {
    grid-template-columns: 1fr;
  }

  .user-details-card {
    position: static;
  }
}
</style>
