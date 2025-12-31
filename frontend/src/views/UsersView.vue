<template>
  <div class="users">
    <div class="page-header">
      <h1 class="page-title">Пользователи</h1>
    </div>

    <Card>
      <template #content>
        <Message v-if="usersStore.error" severity="error" :closable="false" class="mb-3">
          {{ usersStore.error }}
        </Message>

        <DataTable
          :value="usersStore.users"
          :loading="usersStore.loading"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} - {last} из {totalRecords}"
          :emptyMessage="usersStore.loading ? 'Загрузка...' : 'Нет пользователей'"
          class="p-datatable-sm"
        >
          <Column field="id" header="ID" :sortable="true" style="width: 80px" />
          <Column field="username" header="Имя пользователя" :sortable="true" />
          <Column field="email" header="Email" :sortable="true" />
          <Column field="fullName" header="Полное имя" :sortable="true" />
          <Column field="role" header="Роль" :sortable="true">
            <template #body="{ data }">
              <Tag :value="getRoleName(data.role)" :severity="getRoleSeverity(data.role)" />
              <Tag
                v-if="data.isSuperAdmin"
                value="Super Admin"
                severity="danger"
                class="ml-2"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import { useUsersStore } from '@/stores/usersStore';
import type { Role } from '@/types/api';

const usersStore = useUsersStore();

const getRoleName = (role: Role): string => {
  const roleNames: Record<Role, string> = {
    GUEST: 'Гость',
    SELLER: 'Продавец',
    MANAGER: 'Менеджер',
    ADMIN: 'Администратор',
  };
  return roleNames[role] || role;
};

const getRoleSeverity = (role: Role): 'success' | 'info' | 'warning' | 'danger' => {
  const severityMap: Record<Role, 'success' | 'info' | 'warning' | 'danger'> = {
    GUEST: 'info',
    SELLER: 'success',
    MANAGER: 'warning',
    ADMIN: 'danger',
  };
  return severityMap[role] || 'info';
};

onMounted(() => {
  usersStore.fetchUsers();
});
</script>

<style scoped>
.users {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}
</style>



