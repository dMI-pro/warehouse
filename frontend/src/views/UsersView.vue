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
            <Column field="email" header="Email" :sortable="true" />
            <Column field="role" header="Роль" :sortable="true">
              <template #body="{ data }">
                <Tag :value="getRoleName(data.role)" :severity="getRoleSeverity(data.role)" />
              </template>
            </Column>
            <Column field="isActive" header="Статус" :sortable="true">
              <template #body="{ data }">
                <Tag
                  :value="data.isActive !== false ? 'Активен' : 'Заблокирован'"
                  :severity="data.isActive !== false ? 'success' : 'danger'"
                />
              </template>
            </Column>
            <Column field="createdAt" header="Дата регистрации" :sortable="true">
              <template #body="{ data }">
                {{ formatDate(data.createdAt) }}
              </template>
            </Column>
            <Column header="Действия" style="width: 120px">
              <template #body="{ data }">
                <Button
                  v-if="!data.isSuperAdmin || authStore.user?.isSuperAdmin"
                  icon="pi pi-pencil"
                  severity="info"
                  text
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
                  :value="selectedUser.isActive !== false ? 'Активен' : 'Заблокирован'"
                  :severity="selectedUser.isActive !== false ? 'success' : 'danger'"
                />
              </div>
              <div class="info-item">
                <span class="info-label">Дата регистрации:</span>
                <span class="info-value">{{ formatDate(selectedUser.createdAt) }}</span>
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
                <div v-for="(action, index) in userHistory" :key="index" class="history-item">
                  <div class="history-time">{{ formatDateTime(action.time) }}</div>
                  <div class="history-action">{{ action.action }}</div>
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
import { useAuthStore } from '@/stores/authStore';
import type { User, Role } from '@/types/api';
import { apiService } from '@/services/api';

const usersStore = useUsersStore();
const authStore = useAuthStore();
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
  role: 'SELLER' as Role,
});

const formErrors = reactive({
  email: '',
  username: '',
  fullName: '',
  password: '',
});

const roleOptions = [
  { label: 'Гость', value: 'GUEST' },
  { label: 'Продавец', value: 'SELLER' },
  { label: 'Менеджер', value: 'MANAGER' },
  { label: 'Администратор', value: 'ADMIN' },
];

const userHistory = ref<Array<{ time: string; action: string }>>([
  { time: new Date().toISOString(), action: 'Вход в систему' },
  { time: new Date(Date.now() - 3600000).toISOString(), action: 'Просмотр товаров' },
]);

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

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
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
  // Загрузить историю действий пользователя
  loadUserHistory(event.data.id);
};

const loadUserHistory = async (userId: number) => {
  // В реальном приложении здесь будет запрос к API
  userHistory.value = [
    { time: new Date().toISOString(), action: 'Вход в систему' },
    { time: new Date(Date.now() - 3600000).toISOString(), action: 'Просмотр товаров' },
  ];
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
  userForm.role = 'SELLER';
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
    // В реальном приложении здесь будет вызов API
    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: editingUser.value ? 'Пользователь обновлен' : 'Пользователь создан',
      life: 3000,
    });
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

onMounted(() => {
  usersStore.fetchUsers();
});
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
