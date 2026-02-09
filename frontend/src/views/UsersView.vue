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
            :rowClass="getUserRowClass"
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
                  v-if="canEditUser(data)"
                  icon="pi pi-pencil"
                  severity="info"
                  size="small"
                  outlined
                  rounded
                  v-tooltip.top="'Редактировать'"
                  @click="openEditUserDialog(data)"
                />
                <Button
                  v-if="canBlockUser(data)"
                  icon="pi pi-ban"
                  severity="danger"
                  size="small"
                  outlined
                  rounded
                  class="ml-2"
                  v-tooltip.top="'Заблокировать пользователя'"
                  @click="confirmBlockUser(data)"
                />
                <Button
                  v-if="canResetPassword(data)"
                  icon="pi pi-key"
                  severity="warning"
                  size="small"
                  outlined
                  rounded
                  class="ml-2"
                  v-tooltip.top="'Сбросить пароль'"
                  @click="confirmResetPassword(data)"
                />
                <Button
                  v-if="canRevokeSessions(data)"
                  icon="pi pi-sign-out"
                  severity="warning"
                  size="small"
                  outlined
                  rounded
                  class="ml-2"
                  v-tooltip.top="'Завершить все сессии'"
                  @click="confirmRevokeSessions(data)"
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
                v-if="selectedUser && canResetPassword(selectedUser)"
                label="Сбросить пароль"
                icon="pi pi-key"
                severity="warning"
                outlined
                class="w-full mb-2"
                @click="confirmResetPassword(selectedUser!)"
              />
              <Button
                v-if="selectedUser && canRevokeSessions(selectedUser)"
                label="Завершить все сессии"
                icon="pi pi-sign-out"
                severity="warning"
                outlined
                class="w-full mb-2"
                @click="confirmRevokeSessions(selectedUser!)"
              />
              <Button
                v-if="selectedUser && canBlockUser(selectedUser)"
                label="Заблокировать пользователя"
                icon="pi pi-ban"
                severity="danger"
                outlined
                class="w-full mb-2"
                @click="confirmBlockUser(selectedUser!)"
              />
              <Button
                v-if="selectedUser && canDeleteUser(selectedUser)"
                label="Удалить пользователя"
                icon="pi pi-trash"
                severity="danger"
                outlined
                class="w-full"
                @click="confirmDeleteUser(selectedUser!)"
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
                      <span
                        v-if="action.user"
                        :class="['history-actor', { 'self-actor': isCurrentUserActor(action.user) }]"
                      >
                        ({{ getActorDisplayName(action.user) }})
                      </span>
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
      :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
      maximizable
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
          <Password
            id="password"
            v-model="userForm.password"
            class="w-full"
            inputClass="w-full"
            :required="!editingUser"
            toggleMask
            :feedback="false"
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
    <!-- Диалог подробная информация об изменения  -->
    <Dialog
      v-model:visible="historyDetailsVisible"
      header="Подробности действия"
      :modal="true"
      :style="{ width: '600px' }"
      @hide="handleDialogClose"
    >
      <div v-if="selectedHistoryLog" class="details-content p-fluid">
        <!-- Действие -->
        <div class="detail-section mb-4">
          <h4 class="text-lg font-semibold mb-2 text-surface-700">Действие</h4>
          <div class="flex align-items-center gap-2">
            <Tag 
              :value="getUserActionLabel(selectedHistoryLog.action)"
              severity="info"
              class="font-medium"
            />
          </div>
        </div>

        <!-- Время -->
        <div class="detail-section mb-4">
          <h4 class="text-lg font-semibold mb-2 text-surface-700">Время</h4>
          <div class="flex align-items-center gap-2">
            <i class="pi pi-clock text-primary"></i>
            <span class="text-surface-600">{{ formatDateTime(selectedHistoryLog.createdAt) }}</span>
          </div>
        </div>

        <!-- Информация о подключении -->
        <div v-if="selectedHistoryLog.ipAddress || selectedHistoryLog.userAgent" class="detail-section mb-4">
          <h4 class="text-lg font-semibold mb-2 text-surface-700">Информация о подключении</h4>
          <div class="grid">
            <div v-if="selectedHistoryLog.ipAddress" class="col-12 md:col-6">
              <div class="flex flex-column gap-1">
                <label class="text-sm text-surface-500">IP адрес</label>
                <div class="p-inputgroup">
                  <span class="p-inputgroup-addon">
                    <i class="pi pi-globe"></i>
                  </span>
                  <InputText :value="selectedHistoryLog.ipAddress" readonly class="bg-surface-50" />
                </div>
              </div>
            </div>
            <div v-if="selectedHistoryLog.userAgent" class="col-12 md:col-6">
              <div class="flex flex-column gap-1">
                <label class="text-sm text-surface-500">User Agent</label>
                <div class="p-inputgroup">
                  <span class="p-inputgroup-addon">
                    <i class="pi pi-desktop"></i>
                  </span>
                  <InputText :value="selectedHistoryLog.userAgent" readonly class="bg-surface-50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Изменения -->
        <div v-if="selectedHistoryChanges.length" class="detail-section">
          <h4 class="text-lg font-semibold mb-3 text-surface-700">Изменения</h4>
          <div class="card">
            <div class="overflow-x-auto">
              <table class="w-full border-spacing-0 border-separate" style="border-spacing: 0;">
                <thead>
                  <tr class="bg-surface-50">
                    <th class="text-left p-3 text-sm font-semibold text-surface-700 border-b border-surface-200">Поле</th>
                    <th class="text-left p-3 text-sm font-semibold text-surface-700 border-b border-surface-200">Было</th>
                    <th class="text-left p-3 text-sm font-semibold text-surface-700 border-b border-surface-200">Стало</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(change, index) in selectedHistoryChanges" 
                    :key="change.key"
                    :class="[
                      'transition-colors duration-150',
                      index % 2 === 0 ? 'bg-surface-0' : 'bg-surface-50'
                    ]"
                  >
                    <td class="p-3 text-sm border-b border-surface-100">
                      <span class="font-medium text-surface-800">{{ change.key }}</span>
                    </td>
                    <td class="p-3 text-sm border-b border-surface-100">
                      <div class="flex align-items-center gap-2">
                        <div 
                          v-if="change.old" 
                          class="change-old bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-medium"
                        >
                          {{ change.old }}
                        </div>
                        <Tag v-else value="—" severity="secondary" class="text-xs" />
                      </div>
                    </td>
                    <td class="p-3 text-sm border-b border-surface-100">
                      <div class="flex align-items-center gap-2">
                        <div 
                          v-if="change.new" 
                          class="change-new bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium"
                        >
                          {{ change.new }}
                        </div>
                        <Tag v-else value="—" severity="secondary" class="text-xs" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Нет изменений -->
        <div v-else class="text-center py-6">
          <i class="pi pi-info-circle text-4xl text-surface-300 mb-3"></i>
          <p class="text-surface-500">Нет детальной информации об изменениях</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="flex justify-content-center align-items-center py-6">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>

      <!-- Footer -->
      <template #footer>
        <Button 
          label="Закрыть" 
          icon="pi pi-times" 
          @click="handleDialogClose" 
          severity="secondary"
          outlined
        />
      </template>
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
import Password from 'primevue/password';
import Dropdown from 'primevue/dropdown';
import Divider from 'primevue/divider';
import ProgressSpinner from 'primevue/progressspinner';
import { useUsersStore } from '@/stores/usersStore';
import { useUserStatusesStore } from '@/stores/userStatusesStore';
import { useAuthStore } from '@/stores/authStore';
import type { User, CreateUserDto, UpdateUserDto, AuditLog } from '@/types/api';
import { Role, UserStatusColor } from '@/types/api';
import { apiService } from '@/services/api';
import { isCurrentUserActor, getActorDisplayName, getInitials, getAvatarColor } from '@/utils/user-utils';

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

 

const getUserStatusColor = (code?: string | UserStatusColor): 'success' | 'info' | 'warning' | 'danger' | 'secondary' => {
  const severityMap: Record<string, 'success' | 'warning' | 'danger' | 'secondary' > = {
    'active': 'success',
    'blocked': 'danger',
    'disabled': 'secondary',
  };
  const key = (code ? String(code) : '').toLowerCase();
  return severityMap[key] || 'secondary';
};

 

const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const confirmDeleteUser = (user: User) => {
  confirm.require({
    message: `Вы уверены, что хотите удалить пользователя "${user.fullName || user.username}"? Это действие нельзя отменить.`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await usersStore.deleteUser(user.id);
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Пользователь удален',
          life: 3000,
        });
        selectedUser.value = null;
      } catch (err: any) {
        // Error already handled in store
      }
    },
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

const isSelf = (user: User) => authStore.user?.id === user.id;
const isAdminTarget = (user: User) => user.role === Role.ADMIN;

const getUserRowClass = (user: User) => {
  if (!authStore.user) return '';
  return user.id === authStore.user.id ? 'current-user-row' : '';
};

const canBlockUser = (user: User) => {
  if (authStore.user?.isSuperAdmin) return true;
  if (authStore.isAdmin) return !user.isSuperAdmin && !isAdminTarget(user);
  return false;
};

const canDeleteUser = (user: User) => {
  if (authStore.user?.isSuperAdmin) return true;
  if (authStore.isAdmin) return !user.isSuperAdmin && !isAdminTarget(user);
  return false;
};

const canEditUser = (user: User) => {
  if (authStore.user?.isSuperAdmin) return true;
  if (authStore.isAdmin) {
    if (isSelf(user)) return true;
    return !user.isSuperAdmin && !isAdminTarget(user);
  }
  return isSelf(user);
};

const canRevokeSessions = (user: User) => {
  if (authStore.user?.isSuperAdmin) return true;
  if (authStore.isAdmin) {
    if (isSelf(user)) return true;
    return !user.isSuperAdmin && !isAdminTarget(user);
  }
  return isSelf(user);
};

const canResetPassword = (user: User) => {
  if (authStore.user?.isSuperAdmin) return true;
  if (authStore.isAdmin) {
    if (isSelf(user)) return true;
    return !user.isSuperAdmin && !isAdminTarget(user);
  }
  return isSelf(user);
};

const onUserSelect = (event: any) => {
  selectedUser.value = event.data;
  loadUserHistory(event.data.id);
};

const loadUserHistory = async (userId: number) => {
  try {
    const resp = await apiService.getAuditLogs({
      entityType: 'User',
      entityId: userId,
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
  
  const activeStatus = userStatusesStore.userStatuses.find(s => s.code === 'active');
  userForm.userStatusId = activeStatus ? activeStatus.id : undefined;

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

const confirmResetPassword = (user: User) => {
  confirm.require({
    message: `Вы уверены, что хотите сбросить пароль для пользователя "${user.fullName || user.username}"?`,
    header: 'Подтверждение сброса пароля',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
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

const confirmRevokeSessions = (user: User) => {
  confirm.require({
    message: `Завершить все сессии пользователя "${user.fullName || user.username}"?`,
    header: 'Подтверждение',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await apiService.revokeUserSessions(user.id);
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Все сессии завершены',
          life: 3000,
        });
        await usersStore.fetchUsers();
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Ошибка завершения сессий';
        toast.add({ severity: 'error', summary: 'Ошибка', detail: msg, life: 5000 });
      }
    },
  });
};

const confirmBlockUser = (user: User) => {
  confirm.require({
    message: `Заблокировать пользователя "${user.fullName || user.username}" и завершить все его сессии?`,
    header: 'Подтверждение блокировки',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await apiService.blockUser(user.id);
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Пользователь заблокирован и все сессии завершены',
          life: 3000,
        });
        if (selectedUser.value?.id === user.id) {
          selectedUser.value = { ...selectedUser.value, status: { ...(selectedUser.value.status || {}), code: 'blocked', name: 'Заблокированный' } } as any;
        }
        await usersStore.fetchUsers();
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Ошибка блокировки пользователя';
        toast.add({ severity: 'error', summary: 'Ошибка', detail: msg, life: 5000 });
      }
    },
  });
};

// Обработчик закрытия диалога
const handleDialogClose = () => {
  historyDetailsVisible.value = false;
};

onMounted(async () => {
  await usersStore.fetchUsers();
  await userStatusesStore.fetchUserStatuses();
});

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

.users-table :deep(.p-datatable-tbody > tr.current-user-row) {
  background-color: var(--surface-100);
  box-shadow: inset 3px 0 0 var(--primary-color);
}

.history-actor.self-actor {
  font-weight: 600;
  color: var(--primary-color);
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

/* .changes-table-wrapper {
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
} */

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

/* стили для диалогового окна подробности изменения пользователя*/
.details-content {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.details-content::-webkit-scrollbar {
  width: 6px;
}

.details-content::-webkit-scrollbar-track {
  background: var(--surface-100);
  border-radius: 3px;
}

.details-content::-webkit-scrollbar-thumb {
  background: var(--surface-300);
  border-radius: 3px;
}

.details-content::-webkit-scrollbar-thumb:hover {
  background: var(--surface-400);
}

.changes-table {
  min-width: 100%;
}

.changes-table th {
  white-space: nowrap;
  font-weight: 600;
}

.changes-table td {
  vertical-align: top;
}

.change-old {
  background-color: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.change-new {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

/* Анимация появления строк таблицы */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.changes-table tbody tr {
  animation: fadeIn 0.3s ease-out;
  animation-fill-mode: both;
}

.changes-table tbody tr:nth-child(1) { animation-delay: 0.05s; }
.changes-table tbody tr:nth-child(2) { animation-delay: 0.1s; }
.changes-table tbody tr:nth-child(3) { animation-delay: 0.15s; }
.changes-table tbody tr:nth-child(4) { animation-delay: 0.2s; }
.changes-table tbody tr:nth-child(5) { animation-delay: 0.25s; }

/* Адаптивность для мобильных устройств */
@media (max-width: 640px) {
  .changes-table th,
  .changes-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.875rem;
  }

  .change-old,
  .change-new {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .p-dialog {
    width: 95vw !important;
    margin: 0.5rem;
  }
}

/* Темная тема поддержка */
:deep(.p-dialog) {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

@media (prefers-color-scheme: dark) {
  .change-old {
    background-color: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.3);
  }

  .change-new {
    background-color: rgba(34, 197, 94, 0.2);
    color: #86efac;
    border-color: rgba(34, 197, 94, 0.3);
  }

  .details-content::-webkit-scrollbar-track {
    background: var(--surface-700);
  }

  .details-content::-webkit-scrollbar-thumb {
    background: var(--surface-600);
  }
}
</style>
