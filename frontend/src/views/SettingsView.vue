<template>
  <div class="settings">
    <h1 class="page-title">Настройки</h1>

    <div class="settings-layout">
      <!-- Левая навигация -->
      <Card class="sidebar-card">
        <template #content>
          <div class="sidebar-nav">
            <Button
              v-for="tab in tabs"
              :key="tab.key"
              :label="tab.label"
              :icon="tab.icon"
              :class="{ active: activeTab === tab.key }"
              class="nav-button"
              @click="changeTab(tab.key)"
            />
          </div>
        </template>
      </Card>

      <!-- Основная область -->
      <div class="main-content">
        <!-- Вкладка: Категории -->
        <Card v-if="activeTab === 'categories'" class="content-card">
          <template #title>
            <div class="card-header">
              <span>Управление категориями</span>
              <Button
                v-if="authStore.hasRole(Role.MANAGER) || authStore.isAdmin"
                label="Добавить категорию"
                icon="pi pi-plus"
                @click="openAddCategoryDialog"
              />
              <Button
                label="Экспорт Excel"
                icon="pi pi-file-excel"
                severity="secondary"
                outlined
                @click="exportCategoriesExcel"
              />
            </div>
          </template>
          <template #content>
            <Message v-if="categoriesStore.error" severity="error" :closable="false" class="mb-3">
              {{ categoriesStore.error }}
            </Message>
            <Tree
              :value="categoriesStore.categoriesTreePrimeVue"
              :expandedKeys="expandedKeys"
              @node-expand="onNodeExpand"
              @node-collapse="onNodeCollapse"
              class="category-tree"
            >
              <template #default="{ node }">
                <div class="tree-node">
                  <span>{{ node.label }}</span>
                  <div class="tree-actions">
                    <Button
                      v-if="authStore.hasRole(Role.MANAGER) || authStore.isAdmin"
                      icon="pi pi-pencil"
                      severity="info"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Редактировать'"
                      @click.stop="openEditCategoryDialog(node.data)"
                    />
                    <Button
                      v-if="authStore.isAdmin"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Удалить'"
                      @click.stop="confirmDeleteCategory(node.data)"
                    />
                  </div>
                </div>
              </template>
            </Tree>
          </template>
        </Card>

        <!-- Вкладка: Статусы пользователей -->
        <Card v-if="activeTab === 'userStatuses'" class="content-card">
          <template #title>
            <div class="card-header">
              <span>Управление статусами пользователей</span>
              <Button
                v-if="authStore.isAdmin"
                label="Добавить статус"
                icon="pi pi-plus"
                @click="openAddUserStatusDialog"
              />
            </div>
          </template>
          <template #content>
            <Message v-if="userStatusesStore.error" severity="error" :closable="false" class="mb-3">
              {{ userStatusesStore.error }}
            </Message>

            <DataTable
              :value="userStatusesStore.userStatuses"
              :loading="userStatusesStore.loading"
              :emptyMessage="userStatusesStore.loading ? 'Загрузка...' : 'Нет статусов'"
              class="user-statuses-table"
            >
              <Column field="code" header="Код" :sortable="true" />
              <Column field="name" header="Название" :sortable="true" />
              <Column header="Действия" style="width: 150px">
                <template #body="{ data }">
                  <div class="action-buttons">
                    <Button
                      v-if="authStore.isAdmin"
                      icon="pi pi-pencil"
                      severity="info"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Редактировать'"
                      @click="openEditUserStatusDialog(data)"
                    />
                    <Button
                      v-if="authStore.isAdmin"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Удалить'"
                      @click="confirmDeleteUserStatus(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>

            <Dialog
              v-model:visible="userStatusDialogVisible"
              :header="editingUserStatus ? 'Редактировать статус' : 'Добавить статус'"
              :modal="true"
              :style="{ width: '500px' }"
              @hide="closeUserStatusDialog"
            >
              <form @submit.prevent="saveUserStatus" class="user-status-form">
                <div class="field">
                  <label class="label">Код *</label>
                  <InputText v-model="userStatusForm.code" class="w-full" :disabled="!!editingUserStatus" required />
                  <small v-if="userStatusFormErrors.code" class="p-error">{{ userStatusFormErrors.code }}</small>
                </div>
                <div class="field">
                  <label class="label">Название *</label>
                  <InputText v-model="userStatusForm.name" class="w-full" required />
                  <small v-if="userStatusFormErrors.name" class="p-error">{{ userStatusFormErrors.name }}</small>
                </div>
                <div class="field">
                  <label class="label">Описание</label>
                  <Textarea v-model="userStatusForm.description" class="w-full" rows="3" />
                </div>
                <div class="field">
                  <label class="label">Цвет (hex)</label>
                  <InputText v-model="userStatusForm.color" class="w-full" placeholder="#52c41a" />
                </div>
                <div class="dialog-footer">
                  <Button label="Отмена" severity="secondary" outlined @click="closeUserStatusDialog" />
                  <Button type="submit" :label="editingUserStatus ? 'Сохранить' : 'Создать'" :loading="userStatusesStore.loading" />
                </div>
              </form>
            </Dialog>
          </template>
        </Card>

        <!-- Вкладка: Склады -->
        <Card v-if="activeTab === 'warehouses'" class="content-card">
          <template #title>
            <div class="card-header">
              <span>Управление складами</span>
              <Button
                v-if="authStore.hasRole(Role.MANAGER) || authStore.isAdmin"
                label="Добавить склад"
                icon="pi pi-plus"
                @click="openAddWarehouseDialog"
              />
              <Button
                label="Экспорт Excel"
                icon="pi pi-file-excel"
                severity="secondary"
                outlined
                @click="exportWarehousesExcel"
              />
            </div>
          </template>
          <template #content>
            <Message v-if="warehousesStore.error" severity="error" :closable="false" class="mb-3">
              {{ warehousesStore.error }}
            </Message>

            <DataTable
              :value="warehousesStore.warehouses"
              :loading="warehousesStore.loading"
              :emptyMessage="warehousesStore.loading ? 'Загрузка...' : 'Нет складов'"
              class="warehouses-table"
            >
              <Column field="name" header="Название" :sortable="true" />
              <Column field="description" header="Описание" />
              <Column field="address" header="Адрес" />
              <Column header="Действия" style="width: 150px">
                <template #body="{ data }">
                  <div class="action-buttons">
                    <Button
                      v-if="authStore.hasRole(Role.MANAGER) || authStore.isAdmin"
                      icon="pi pi-pencil"
                      severity="info"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Редактировать'"
                      @click="openEditWarehouseDialog(data)"
                    />
                    <Button
                      v-if="authStore.isAdmin"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Удалить'"
                      @click="confirmDeleteWarehouse(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- Вкладка: Коммитеты -->
        <Card v-if="activeTab === 'committees'" class="content-card">
          <template #title>
            <div class="card-header">
              <span>Управление коммитетами</span>
              <Button
                v-if="authStore.hasRole(Role.MANAGER) || authStore.isAdmin"
                label="Добавить коммитет"
                icon="pi pi-plus"
                @click="openAddCommitteeDialog"
              />
              <Button
                label="Экспорт Excel"
                icon="pi pi-file-excel"
                severity="secondary"
                outlined
                @click="exportCommitteesExcel"
              />
            </div>
          </template>
          <template #content>
            <Message v-if="committeesStore.error" severity="error" :closable="false" class="mb-3">
              {{ committeesStore.error }}
            </Message>

            <DataTable
              :value="committeesStore.committees"
              :loading="committeesStore.loading"
              :emptyMessage="committeesStore.loading ? 'Загрузка...' : 'Нет коммитетов'"
              class="committees-table"
            >
              <Column field="name" header="Название" :sortable="true">
                <template #body="{ data }">
                  <!-- <Tag :value="data?.name || 'Без категории'" severity="info" @click="openCommitteeDetails(data.id)" /> -->
                   <!-- <Chip :label="data?.name || 'Без категории'" severity="info" @click="openCommitteeDetails(data.id)" /> -->
                  <span class="committee-name" @click="openCommitteeDetails(data.id)">{{data.name}}</span>
                </template>
              </Column>
              <Column field="description" header="Описание" />
              <Column field="contactInfo" header="Контактная информация" />
              <Column header="Действия" style="width: 150px">
                <template #body="{ data }">
                  <div class="action-buttons">
                    <Button
                      v-if="authStore.hasRole(Role.MANAGER) || authStore.isAdmin"
                      icon="pi pi-pencil"
                      severity="info"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Редактировать'"
                      @click="openEditCommitteeDialog(data)"
                    />
                    <Button
                      v-if="authStore.isAdmin"
                      class="p-button-xs"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Удалить'"
                      @click="confirmDeleteCommittee(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- Вкладка: Дополнительные поля -->
        <Card v-if="activeTab === 'fields'" class="content-card">
          <template #title>Дополнительные поля товаров</template>
          <template #content>
            <div class="fields-section">
              <div class="fields-list">
                <h3>Существующие поля</h3>
                <DataTable
                  :value="customFields"
                  :emptyMessage="'Нет дополнительных полей'"
                  class="fields-table"
                >
                  <Column field="name" header="Название" />
                  <Column field="type" header="Тип" />
                  <Column field="required" header="Обязательное">
                    <template #body="{ data }">
                      <Tag :value="data.required ? 'Да' : 'Нет'" :severity="data.required ? 'success' : 'info'" />
                    </template>
                  </Column>
                  <Column header="Действия" style="width: 100px">
                    <template #body="{ data }">
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        outlined
                        rounded
                        @click="deleteField(data.id)"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>

              <Divider />

              <div class="field-form">
                <h3>Создать новое поле</h3>
                <form @submit.prevent="createField" class="form">
                  <div class="field">
                    <label for="fieldName" class="label">Название поля *</label>
                    <InputText id="fieldName" v-model="fieldForm.name" class="w-full" required />
                  </div>

                  <div class="field">
                    <label for="fieldType" class="label">Тип *</label>
                    <Dropdown
                      id="fieldType"
                      v-model="fieldForm.type"
                      :options="fieldTypes"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                      required
                    />
                  </div>

                  <div class="field">
                    <label class="label">
                      <Checkbox v-model="fieldForm.required" :binary="true" />
                      Обязательное поле
                    </label>
                  </div>

                  <div class="field">
                    <label for="fieldValidation" class="label">Валидационные правила</label>
                    <Textarea
                      id="fieldValidation"
                      v-model="fieldForm.validation"
                      rows="3"
                      placeholder="Например: min:0, max:100"
                      class="w-full"
                    />
                  </div>

                  <Button type="submit" label="Создать поле" icon="pi pi-plus" />
                </form>
              </div>
            </div>
          </template>
        </Card>

        <!-- Вкладка: Шаблоны экспорта -->
        <Card v-if="activeTab === 'templates'" class="content-card">
          <template #title>
            <div class="card-header">
              <span>Шаблоны экспорта</span>
              <Button label="Добавить шаблон" icon="pi pi-plus" @click="openAddTemplateDialog" />
            </div>
          </template>
          <template #content>
            <div class="templates-section">
              <DataTable :value="exportTemplates" :emptyMessage="'Нет шаблонов'" class="templates-table">
                <Column field="name" header="Название" />
                <Column field="tableKey" header="Таблица">
                  <template #body="{ data }">
                    {{ tableKeyLabels[data.tableKey] || data.tableKey }}
                  </template>
                </Column>
                <Column field="format" header="Формат" />
                <Column field="isDefault" header="По умолчанию">
                  <template #body="{ data }">
                    <Tag :value="data.isDefault ? 'Да' : 'Нет'" :severity="data.isDefault ? 'success' : 'secondary'" />
                  </template>
                </Column>
                <Column header="Действия" style="width: 100px">
                  <template #body="{ data }">
                    <Button
                      icon="pi pi-pencil"
                      severity="info"
                      size="small"
                      outlined
                      rounded
                      @click="openEditTemplateDialog(data)" />
                    <Button
                      icon="pi pi-trash"
                      severity="danger" 
                      size="small"
                      outlined
                      rounded
                      @click="deleteTemplate(data.id)" />
                  </template>
                </Column>
              </DataTable>

              <Dialog
                v-model:visible="templateDialogVisible"
                :header="editingTemplate ? 'Редактировать шаблон' : 'Добавить шаблон'"
                :modal="true"
                :style="{ width: '600px' }"
              >
                <form @submit.prevent="saveTemplate" class="form">
                  <div class="field">
                    <label class="label">Название *</label>
                    <InputText v-model="templateForm.name" class="w-full" required />
                  </div>

                  <div class="field">
                    <label class="label">Таблица *</label>
                    <Dropdown
                      v-model="templateForm.tableKey"
                      :options="tableKeyOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                      required
                      @change="onTemplateTableChange"
                    />
                  </div>

                  <div class="field">
                    <label class="label">Формат *</label>
                    <Dropdown
                      v-model="templateForm.format"
                      :options="formatOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                      required
                    />
                  </div>

                  <div class="field">
                    <label class="label">Колонки *</label>
                    <MultiSelect
                      v-model="templateForm.columns"
                      :options="availableColumnOptions"
                      optionLabel="label"
                      optionValue="value"
                      display="chip"
                      class="w-full"
                      :filter="true"
                      placeholder="Выберите колонки"
                      required
                    />
                  </div>

                  <div class="field">
                    <label class="label">
                      <Checkbox v-model="templateForm.isDefault" :binary="true" />
                      Сделать шаблоном по умолчанию для выбранной таблицы
                    </label>
                  </div>

                  <div class="dialog-footer">
                    <Button label="Отмена" severity="secondary" outlined @click="closeTemplateDialog" />
                    <Button type="submit" :label="editingTemplate ? 'Сохранить' : 'Создать'" />
                  </div>
                </form>
              </Dialog>
            </div>
          </template>
        </Card>

        <!-- Вкладка: Системные настройки -->
        <Card v-if="activeTab === 'system'" class="content-card">
          <template #title>Системные настройки</template>
          <template #content>
            <div class="system-settings">
              <div class="setting-item">
                <label class="setting-label">Название системы</label>
                <InputText v-model="systemSettings.systemName" class="w-full" />
              </div>
              <div class="setting-item">
                <label class="setting-label">Валюта</label>
                <Dropdown
                  v-model="systemSettings.currency"
                  :options="currencies"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>
              <div class="setting-item">
                <label class="setting-label">
                  <Checkbox v-model="systemSettings.emailNotifications" :binary="true" />
                  Уведомления по email
                </label>
              </div>
              <Button label="Сохранить настройки" icon="pi pi-save" @click="saveSystemSettings" />
            </div>
          </template>
        </Card>

        <!-- Вкладка: Типы транзакций -->
        <Card v-if="activeTab === 'transactionTypes'" class="content-card">
          <template #title>
            <div class="card-header">
              <span>Типы транзакций</span>
              <Button
                v-if="authStore.hasRole(Role.MANAGER) || authStore.isAdmin"
                label="Добавить тип"
                icon="pi pi-plus"
                @click="openAddTransactionTypeDialog"
              />
            </div>
          </template>
          <template #content>
            <Message v-if="transactionTypesStore.error" severity="error" :closable="false" class="mb-3">
              {{ transactionTypesStore.error }}
            </Message>

            <DataTable
              :value="transactionTypesStore.transactionTypes"
              :loading="transactionTypesStore.loading"
              :emptyMessage="transactionTypesStore.loading ? 'Загрузка...' : 'Нет типов транзакций'"
              class="transaction-types-table"
            >
              <Column field="name" header="Название" :sortable="true" />
              <Column header="Действия" style="width: 150px">
                <template #body="{ data }">
                  <div class="action-buttons">
                    <Button
                      v-if="authStore.hasRole(Role.MANAGER) || authStore.isAdmin"
                      icon="pi pi-pencil"
                      severity="info"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Редактировать'"
                      @click="openEditTransactionTypeDialog(data)"
                    />
                    <Button
                      v-if="authStore.isAdmin"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Удалить'"
                      @click="confirmDeleteTransactionType(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

      </div>
    </div>

    <!-- Диалог добавления/редактирования склада -->
    <Dialog
      v-model:visible="warehouseDialogVisible"
      :header="editingWarehouse ? 'Редактировать склад' : 'Добавить склад'"
      :modal="true"
      :style="{ width: '500px' }"
      @hide="closeWarehouseDialog"
    >
      <form @submit.prevent="saveWarehouse" class="warehouse-form">
        <div class="field">
          <label for="warehouseName" class="label">Название *</label>
          <InputText id="warehouseName" v-model="warehouseForm.name" class="w-full" required />
          <small v-if="warehouseFormErrors.name" class="p-error">{{ warehouseFormErrors.name }}</small>
        </div>

        <div class="field">
          <label for="warehouseDescription" class="label">Описание</label>
          <Textarea
            id="warehouseDescription"
            v-model="warehouseForm.description"
            rows="3"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="warehouseAddress" class="label">Адрес</label>
          <InputText id="warehouseAddress" v-model="warehouseForm.address" class="w-full" />
        </div>

        <Message v-if="warehousesStore.error" severity="error" :closable="false" class="mb-3">
          {{ warehousesStore.error }}
        </Message>

        <div class="dialog-footer">
          <Button label="Отмена" severity="secondary" outlined @click="closeWarehouseDialog" />
          <Button
            type="submit"
            :label="editingWarehouse ? 'Сохранить' : 'Создать'"
            :loading="warehousesStore.loading"
          />
        </div>
      </form>
    </Dialog>

    <!-- Диалог добавления/редактирования коммитета -->
    <Dialog
      v-model:visible="committeeDialogVisible"
      :header="editingCommittee ? 'Редактировать коммитет' : 'Добавить коммитет'"
      :modal="true"
      :style="{ width: '500px' }"
      @hide="closeCommitteeDialog"
    >
      <form @submit.prevent="saveCommittee" class="committee-form">
        <div class="field">
          <label for="committeeName" class="label">Название *</label>
          <InputText id="committeeName" v-model="committeeForm.name" class="w-full" required />
          <small v-if="committeeFormErrors.name" class="p-error">{{ committeeFormErrors.name }}</small>
        </div>

        <div class="field">
          <label for="committeeDescription" class="label">Описание</label>
          <Textarea
            id="committeeDescription"
            v-model="committeeForm.description"
            rows="3"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="committeeContactInfo" class="label">Контактная информация</label>
          <InputText id="committeeContactInfo" v-model="committeeForm.contactInfo" class="w-full" />
        </div>

        <Message v-if="committeesStore.error" severity="error" :closable="false" class="mb-3">
          {{ committeesStore.error }}
        </Message>

        <div class="dialog-footer">
          <Button label="Отмена" severity="secondary" outlined @click="closeCommitteeDialog" />
          <Button
            type="submit"
            :label="editingCommittee ? 'Сохранить' : 'Создать'"
            :loading="committeesStore.loading"
          />
        </div>
      </form>
    </Dialog>

    <!-- Диалог добавления/редактирования категории -->
    <Dialog
      v-model:visible="categoryDialogVisible"
      :header="editingCategory ? 'Редактировать категорию' : 'Добавить категорию'"
      :modal="true"
      :style="{ width: '500px' }"
      @hide="closeCategoryDialog"
    >
      <form @submit.prevent="saveCategory" class="category-form">
        <div class="field">
          <label for="categoryName" class="label">Название *</label>
          <InputText id="categoryName" v-model="categoryForm.name" class="w-full" required />
          <small v-if="categoryFormErrors.name" class="p-error">{{ categoryFormErrors.name }}</small>
        </div>

        <div class="field">
          <label for="categoryDescription" class="label">Описание</label>
          <Textarea
            id="categoryDescription"
            v-model="categoryForm.description"
            rows="3"
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="categoryParent" class="label">Родительская категория</label>
          <Dropdown
            id="categoryParent"
            v-model="categoryForm.parentId"
            :options="parentCategoryOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Нет родительской категории"
            class="w-full"
          />
        </div>

        <Message v-if="categoriesStore.error" severity="error" :closable="false" class="mb-3">
          {{ categoriesStore.error }}
        </Message>

        <div class="dialog-footer">
          <Button label="Отмена" severity="secondary" outlined @click="closeCategoryDialog" />
          <Button
            type="submit"
            :label="editingCategory ? 'Сохранить' : 'Создать'"
            :loading="categoriesStore.loading"
          />
        </div>
      </form>
    </Dialog>

    <!-- Диалог добавления/редактирования типа транзакции -->
    <Dialog
      v-model:visible="transactionTypeDialogVisible"
      :header="editingTransactionType ? 'Редактировать тип транзакции' : 'Добавить тип транзакции'"
      :modal="true"
      :style="{ width: '500px' }"
      @hide="closeTransactionTypeDialog"
    >
      <form @submit.prevent="saveTransactionType" class="transaction-type-form">
        <div class="field">
          <label for="transactionTypeName" class="label">Название *</label>
          <InputText id="transactionTypeName" v-model="transactionTypeForm.name" class="w-full" required />
          <small v-if="transactionTypeFormErrors.name" class="p-error">{{ transactionTypeFormErrors.name }}</small>
        </div>

        <Message v-if="transactionTypesStore.error" severity="error" :closable="false" class="mb-3">
          {{ transactionTypesStore.error }}
        </Message>

        <div class="dialog-footer">
          <Button label="Отмена" severity="secondary" outlined @click="closeTransactionTypeDialog" />
          <Button
            type="submit"
            :label="editingTransactionType ? 'Сохранить' : 'Создать'"
            :loading="transactionTypesStore.loading"
          />
        </div>
      </form>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tree from 'primevue/tree';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import MultiSelect from 'primevue/multiselect';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Chip from 'primevue/chip';
import Message from 'primevue/message';
import Divider from 'primevue/divider';
import ConfirmDialog from 'primevue/confirmdialog';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import { useCommitteesStore } from '@/stores/committeesStore';
import { useAuthStore } from '@/stores/authStore';
import { useTransactionTypesStore } from '@/stores/transactionTypesStore';
import { useUserStatusesStore } from '@/stores/userStatusesStore';
import type { Category, CreateCategoryDto, UpdateCategoryDto, Warehouse, CreateWarehouseDto, UpdateWarehouseDto, Committee, CreateCommitteeDto, UpdateCommitteeDto, TransactionType, CreateTransactionTypeDto, UpdateTransactionTypeDto, UserStatus, CreateUserStatusDto, UpdateUserStatusDto } from '@/types/api';
import { Role } from '@/types/api';
import { exportExcelTable, type ExcelColumn } from '@/utils/excelExport';
import { loadTemplates, upsertTemplate, deleteTemplate as deleteTemplateStorage } from '@/utils/exportTemplates';
import type { ExportTemplate, TemplateFormat } from '@/utils/exportTemplates';

const categoriesStore = useCategoriesStore();
const warehousesStore = useWarehousesStore();
const committeesStore = useCommitteesStore();
const transactionTypesStore = useTransactionTypesStore();
const userStatusesStore = useUserStatusesStore();
const authStore = useAuthStore();
const confirm = useConfirm();
const toast = useToast();
const router = useRouter();
const route = useRoute();

const activeTab = ref<'categories' | 'warehouses' | 'committees' | 'transactionTypes' | 'userStatuses' | 'fields' | 'templates' | 'system'>('categories');
const expandedKeys = ref<Record<string, boolean>>({});

const tabs: Array<{ key: typeof activeTab.value; label: string; icon: string }> = [
  { key: 'categories', label: 'Категории', icon: 'pi pi-sitemap' },
  { key: 'warehouses', label: 'Склады', icon: 'pi pi-building' },
  { key: 'committees', label: 'Коммитеты', icon: 'pi pi-users' },
  { key: 'transactionTypes', label: 'Типы транзакций', icon: 'pi pi-tags' },
  { key: 'userStatuses', label: 'Статусы пользователей', icon: 'pi pi-id-card' },
  { key: 'fields', label: 'Дополнительные поля', icon: 'pi pi-list' },
  { key: 'templates', label: 'Шаблоны экспорта', icon: 'pi pi-file-export' },
  { key: 'system', label: 'Системные настройки', icon: 'pi pi-cog' },
];

const categoryDialogVisible = ref(false);
const editingCategory = ref<Category | null>(null);
const warehouseDialogVisible = ref(false);
const editingWarehouse = ref<Warehouse | null>(null);
const committeeDialogVisible = ref(false);
const editingCommittee = ref<Committee | null>(null);
const transactionTypeDialogVisible = ref(false);
const editingTransactionType = ref<TransactionType | null>(null);
const userStatusDialogVisible = ref(false);
const editingUserStatus = ref<UserStatus | null>(null);
const userStatusForm = reactive<CreateUserStatusDto>({
  name: '',
  code: '',
  description: '',
  color: '',
});
const userStatusFormErrors = reactive({
  name: '',
  code: '',
});

const categoryForm = reactive<CreateCategoryDto>({
  name: '',
  description: '',
  parentId: undefined,
});

const categoryFormErrors = reactive({
  name: '',
});

const warehouseForm = reactive<CreateWarehouseDto>({
  name: '',
  description: '',
  address: '',
});

const warehouseFormErrors = reactive({
  name: '',
});

const committeeForm = reactive<CreateCommitteeDto>({
  name: '',
  description: '',
  contactInfo: '',
});

const committeeFormErrors = reactive({
  name: '',
});

const transactionTypeForm = reactive<CreateTransactionTypeDto>({
  name: '',
});

const transactionTypeFormErrors = reactive({
  name: '',
});

const fieldForm = reactive({
  name: '',
  type: 'text',
  required: false,
  validation: '',
});

const fieldTypes = [
  { label: 'Текст', value: 'text' },
  { label: 'Число', value: 'number' },
  { label: 'Дата', value: 'date' },
  { label: 'Выпадающий список', value: 'select' },
];

const customFields = ref([
  { id: 1, name: 'Производитель', type: 'text', required: false },
  { id: 2, name: 'Гарантия (месяцы)', type: 'number', required: false },
]);

const exportTemplates = ref(loadTemplates());

const systemSettings = reactive({
  systemName: 'Складской учет',
  currency: 'RUB',
  emailNotifications: true,
});

const currencies = [
  { label: 'Российский рубль (₽)', value: 'RUB' },
  { label: 'Доллар США ($)', value: 'USD' },
  { label: 'Евро (€)', value: 'EUR' },
];

const templateDialogVisible = ref(false);
const editingTemplate = ref<ExportTemplate | null>(null);
const templateForm = reactive({
  name: '',
  tableKey: '' as unknown as ExportTemplate['tableKey'],
  format: 'excel' as TemplateFormat,
  columns: [] as string[],
  isDefault: false,
});

const tableKeyOptions = [
  { label: 'Товары', value: 'products' },
  { label: 'Продажи', value: 'sales' },
  { label: 'Остатки', value: 'stock' },
  { label: 'Возвраты', value: 'returns' },
  { label: 'Журнал действий', value: 'audit' },
  { label: 'Категории', value: 'categories' },
  { label: 'Коммитеты', value: 'committees' },
];

const tableKeyLabels: Record<string, string> = {
  products: 'Товары',
  sales: 'Продажи',
  stock: 'Остатки',
  returns: 'Возвраты',
  audit: 'Журнал действий',
  categories: 'Категории',
  committees: 'Коммитеты',
};

const formatOptions = [
  { label: 'Excel', value: 'excel' },
  { label: 'CSV', value: 'csv' },
];

const availableColumnOptions = ref<Array<{ label: string; value: string }>>([]);

const columnOptionsMap: Record<string, Array<{ label: string; value: string }>> = {
  products: [
    { label: 'ID', value: 'id' },
    { label: 'Название', value: 'name' },
    { label: 'Артикул', value: 'sku' },
    { label: 'Категория', value: 'categoryName' },
    { label: 'Цена закупки', value: 'purchasePrice' },
    { label: 'Цена продажи', value: 'salePrice' },
    { label: 'Количество', value: 'quantity' },
    { label: 'Мин. запас', value: 'minStockLevel' },
    { label: 'Склад', value: 'warehouseName' },
    { label: 'Комитет', value: 'committeeName' },
    { label: 'Тип транзакции', value: 'transactionTypeName' },
    { label: 'Дата поступления', value: 'arrivalDate' },
    { label: 'Изображение', value: 'images' },
  ],
  sales: [
    { label: 'ID чека', value: 'id' },
    { label: 'Товар', value: 'productName' },
    { label: 'Кол-во', value: 'quantity' },
    { label: 'Сумма', value: 'totalAmount' },
    { label: 'Прибыль', value: 'totalProfit' },
    { label: 'Продавец', value: 'seller' },
    { label: 'Дата', value: 'date' },
  ],
  stock: [
    { label: 'ID', value: 'id' },
    { label: 'Название', value: 'name' },
    { label: 'Артикул', value: 'sku' },
    { label: 'Кол-во', value: 'quantity' },
    { label: 'Мин. запас', value: 'minStockLevel' },
    { label: 'Цена', value: 'salePrice' },
  ],
  returns: [
    { label: 'ID возврата', value: 'id' },
    { label: 'Товар', value: 'productName' },
    { label: 'Кол-во', value: 'quantity' },
    { label: 'Причина', value: 'reason' },
    { label: 'Кто вернул', value: 'returnedBy' },
    { label: 'Дата', value: 'date' },
  ],
  audit: [
    { label: 'Время', value: 'createdAt' },
    { label: 'Пользователь', value: 'user' },
    { label: 'Действие', value: 'action' },
    { label: 'Сущность', value: 'entity' },
    { label: 'Статус', value: 'success' },
    { label: 'IP адрес', value: 'ipAddress' },
    { label: 'User Agent', value: 'userAgent' },
  ],
  categories: [
    { label: 'ID', value: 'id' },
    { label: 'Название', value: 'name' },
    { label: 'Описание', value: 'description' },
    { label: 'Родитель', value: 'parentId' },
  ],
  committees: [
    { label: 'ID', value: 'id' },
    { label: 'Название', value: 'name' },
    { label: 'Описание', value: 'description' },
    { label: 'Контакты', value: 'contactInfo' },
  ],
};

const setAvailableColumnsForTable = (key: string) => {
  availableColumnOptions.value = columnOptionsMap[key] || [];
};

const onTemplateTableChange = () => {
  setAvailableColumnsForTable(templateForm.tableKey as string);
  templateForm.columns = [];
};

const openAddTemplateDialog = () => {
  editingTemplate.value = null;
  templateForm.name = '';
  templateForm.tableKey = '' as any;
  templateForm.format = 'excel';
  templateForm.columns = [];
  templateForm.isDefault = false;
  availableColumnOptions.value = [];
  templateDialogVisible.value = true;
};

const openEditTemplateDialog = (template: ExportTemplate) => {
  editingTemplate.value = template;
  templateForm.name = template.name;
  templateForm.tableKey = template.tableKey;
  templateForm.format = template.format || 'excel';
  templateForm.columns = [...(template.columns || [])];
  templateForm.isDefault = !!template.isDefault;
  setAvailableColumnsForTable(template.tableKey);
  templateDialogVisible.value = true;
};

const closeTemplateDialog = () => {
  templateDialogVisible.value = false;
  editingTemplate.value = null;
};

const saveTemplate = () => {
  if (!templateForm.name || !templateForm.tableKey || templateForm.columns.length === 0 || !templateForm.format) {
    toast.add({ severity: 'warn', summary: 'Предупреждение', detail: 'Заполните все обязательные поля', life: 3000 });
    return;
  }
  const nextId = editingTemplate.value
    ? editingTemplate.value.id
    : (exportTemplates.value.reduce((max, t) => Math.max(max, t.id), 0) + 1) || 1;

  if (templateForm.isDefault) {
    exportTemplates.value = exportTemplates.value.map((t) =>
      t.tableKey === templateForm.tableKey ? { ...t, isDefault: false } : t
    );
  }

  const newTemplate: ExportTemplate = {
    id: nextId,
    name: templateForm.name,
    tableKey: templateForm.tableKey,
    format: templateForm.format,
    columns: [...templateForm.columns],
    isDefault: templateForm.isDefault,
  };

  upsertTemplate(newTemplate);
  exportTemplates.value = loadTemplates();
  templateDialogVisible.value = false;
  editingTemplate.value = null;
  toast.add({ severity: 'success', summary: 'Успешно', detail: 'Шаблон сохранен', life: 3000 });
};

const parentCategoryOptions = computed(() => {
  const options: { label: string; value: number | undefined }[] = [{ label: 'Нет родительской категории', value: undefined }];
  categoriesStore.categories.forEach((cat) => {
    if (!editingCategory.value || cat.id !== editingCategory.value.id) {
      options.push({ label: cat.name, value: cat.id });
    }
  });
  return options;
});

// Функция для смены вкладки
const changeTab = (tabKey: typeof activeTab.value) => {
  activeTab.value = tabKey;
};

// Watch для синхронизации activeTab с URL
watch(activeTab, (newTab) => {
  router.push({
    name: 'settings',
    query: { tab: newTab }
  });
});

// Watch для синхронизации URL с activeTab
watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    const allowedTabs = [
      'categories',
      'warehouses', 
      'committees',
      'transactionTypes',
      'userStatuses',
      'fields',
      'templates',
      'system'
    ];
    
    if (allowedTabs.includes(newTab as string) && newTab !== activeTab.value) {
      activeTab.value = newTab as typeof activeTab.value;
    }
  }
});

const onNodeExpand = (event: any) => {
  expandedKeys.value[event.node.key] = true;
};

const onNodeCollapse = (event: any) => {
  delete expandedKeys.value[event.node.key];
};

const openAddCategoryDialog = () => {
  editingCategory.value = null;
  resetCategoryForm();
  categoryDialogVisible.value = true;
};

const openEditCategoryDialog = (category: Category) => {
  editingCategory.value = category;
  categoryForm.name = category.name;
  categoryForm.description = category.description || '';
  categoryForm.parentId = category.parentId || undefined;
  categoryDialogVisible.value = true;
};

const closeCategoryDialog = () => {
  categoryDialogVisible.value = false;
  resetCategoryForm();
};

const resetCategoryForm = () => {
  categoryForm.name = '';
  categoryForm.description = '';
  categoryForm.parentId = undefined;
  categoryFormErrors.name = '';
};

const validateCategoryForm = () => {
  categoryFormErrors.name = '';
  if (!categoryForm.name.trim()) {
    categoryFormErrors.name = 'Название обязательно';
    return false;
  }
  return true;
};

const saveCategory = async () => {
  if (!validateCategoryForm()) return;

  try {
    if (editingCategory.value) {
      const updateDto: UpdateCategoryDto = {
        name: categoryForm.name,
        description: categoryForm.description,
        parentId: categoryForm.parentId,
      };
      await categoriesStore.updateCategory(editingCategory.value.id, updateDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Категория обновлена', life: 3000 });
    } else {
      const createDto: CreateCategoryDto = {
        name: categoryForm.name,
        description: categoryForm.description,
        parentId: categoryForm.parentId,
      };
      await categoriesStore.createCategory(createDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Категория создана', life: 3000 });
    }
    closeCategoryDialog();
  } catch (error) {
    // Ошибка уже обработана в store
  }
};

const confirmDeleteCategory = (category: Category) => {
  confirm.require({
    message: `Вы уверены, что хотите удалить категорию "${category.name}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await categoriesStore.deleteCategory(category.id);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Категория удалена', life: 3000 });
      } catch (error) {
        // Ошибка уже обработана в store
      }
    },
  });
};

const exportCategoriesExcel = async () => {
  const rows = categoriesStore.categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    parentId: c.parentId ?? '',
  }));
  const columns: ExcelColumn[] = [
    { key: 'id', header: 'ID', type: 'number' },
    { key: 'name', header: 'Название', type: 'string' },
    { key: 'description', header: 'Описание', type: 'string' },
    { key: 'parentId', header: 'Родитель', type: 'string' },
  ];
  await exportExcelTable(columns, rows, {
    totals: false,
    tableName: 'Categories',
    fileName: `categories_${new Date().toISOString().split('T')[0]}.xlsx`,
  });
};

const createField = () => {
  if (!fieldForm.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Предупреждение', detail: 'Введите название поля', life: 3000 });
    return;
  }

  customFields.value.push({
    id: customFields.value.length + 1,
    name: fieldForm.name,
    type: fieldForm.type,
    required: fieldForm.required,
  });

  fieldForm.name = '';
  fieldForm.type = 'text';
  fieldForm.required = false;
  fieldForm.validation = '';

  toast.add({ severity: 'success', summary: 'Успешно', detail: 'Поле создано', life: 3000 });
};

const deleteField = (id: number) => {
  customFields.value = customFields.value.filter((f) => f.id !== id);
  toast.add({ severity: 'success', summary: 'Успешно', detail: 'Поле удалено', life: 3000 });
};

const editTemplate = (template: any) => {
  upsertTemplate(template);
  toast.add({ severity: 'success', summary: 'Успешно', detail: 'Шаблон сохранен', life: 3000 });
};

const deleteTemplate = (id: number) => {
  deleteTemplateStorage(id);
  exportTemplates.value = exportTemplates.value.filter((t) => t.id !== id);
  toast.add({ severity: 'success', summary: 'Успешно', detail: 'Шаблон удален', life: 3000 });
};

const saveSystemSettings = () => {
  toast.add({ severity: 'success', summary: 'Успешно', detail: 'Настройки сохранены', life: 3000 });
};

// Warehouse methods
const openAddWarehouseDialog = () => {
  editingWarehouse.value = null;
  resetWarehouseForm();
  warehouseDialogVisible.value = true;
};

const openEditWarehouseDialog = (warehouse: Warehouse) => {
  editingWarehouse.value = warehouse;
  warehouseForm.name = warehouse.name;
  warehouseForm.description = warehouse.description || '';
  warehouseForm.address = warehouse.address || '';
  warehouseDialogVisible.value = true;
};

const closeWarehouseDialog = () => {
  warehouseDialogVisible.value = false;
  resetWarehouseForm();
};

const resetWarehouseForm = () => {
  warehouseForm.name = '';
  warehouseForm.description = '';
  warehouseForm.address = '';
  warehouseFormErrors.name = '';
};

const validateWarehouseForm = () => {
  warehouseFormErrors.name = '';
  if (!warehouseForm.name.trim()) {
    warehouseFormErrors.name = 'Название обязательно';
    return false;
  }
  return true;
};

const saveWarehouse = async () => {
  if (!validateWarehouseForm()) return;

  try {
    if (editingWarehouse.value) {
      const updateDto: UpdateWarehouseDto = {
        name: warehouseForm.name,
        description: warehouseForm.description,
        address: warehouseForm.address,
      };
      await warehousesStore.updateWarehouse(editingWarehouse.value.id, updateDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Склад обновлен', life: 3000 });
    } else {
      const createDto: CreateWarehouseDto = {
        name: warehouseForm.name,
        description: warehouseForm.description,
        address: warehouseForm.address,
      };
      await warehousesStore.createWarehouse(createDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Склад создан', life: 3000 });
    }
    closeWarehouseDialog();
  } catch (error) {
    // Ошибка уже обработана в store
  }
};

const confirmDeleteWarehouse = (warehouse: Warehouse) => {
  confirm.require({
    message: `Вы уверены, что хотите удалить склад "${warehouse.name}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await warehousesStore.deleteWarehouse(warehouse.id);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Склад удален', life: 3000 });
      } catch (error) {
        // Ошибка уже обработана в store
      }
    },
  });
};

const exportWarehousesExcel = async () => {
  const rows = warehousesStore.warehouses.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description || '',
    address: w.address || '',
  }));
  const columns: ExcelColumn[] = [
    { key: 'id', header: 'ID', type: 'number' },
    { key: 'name', header: 'Название', type: 'string' },
    { key: 'description', header: 'Описание', type: 'string' },
    { key: 'address', header: 'Адрес', type: 'string' },
  ];
  await exportExcelTable(columns, rows, {
    totals: false,
    tableName: 'Warehouses',
    fileName: `warehouses_${new Date().toISOString().split('T')[0]}.xlsx`,
  });
};

// Committee methods
const openAddCommitteeDialog = () => {
  editingCommittee.value = null;
  resetCommitteeForm();
  committeeDialogVisible.value = true;
};

const openEditCommitteeDialog = (committee: Committee) => {
  editingCommittee.value = committee;
  committeeForm.name = committee.name;
  committeeForm.description = committee.description || '';
  committeeForm.contactInfo = committee.contactInfo || '';
  committeeDialogVisible.value = true;
};

const closeCommitteeDialog = () => {
  committeeDialogVisible.value = false;
  resetCommitteeForm();
};

const resetCommitteeForm = () => {
  committeeForm.name = '';
  committeeForm.description = '';
  committeeForm.contactInfo = '';
  committeeFormErrors.name = '';
};

const validateCommitteeForm = () => {
  committeeFormErrors.name = '';
  if (!committeeForm.name.trim()) {
    committeeFormErrors.name = 'Название обязательно';
    return false;
  }
  return true;
};

const saveCommittee = async () => {
  if (!validateCommitteeForm()) return;

  try {
    if (editingCommittee.value) {
      const updateDto: UpdateCommitteeDto = {
        name: committeeForm.name,
        description: committeeForm.description,
        contactInfo: committeeForm.contactInfo,
      };
      await committeesStore.updateCommittee(editingCommittee.value.id, updateDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Коммитет обновлен', life: 3000 });
    } else {
      const createDto: CreateCommitteeDto = {
        name: committeeForm.name,
        description: committeeForm.description,
        contactInfo: committeeForm.contactInfo,
      };
      await committeesStore.createCommittee(createDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Коммитет создан', life: 3000 });
    }
    closeCommitteeDialog();
  } catch (error) {
    // Ошибка уже обработана в store
  }
};

const confirmDeleteCommittee = (committee: Committee) => {
  confirm.require({
    message: `Вы уверены, что хотите удалить коммитет "${committee.name}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await committeesStore.deleteCommittee(committee.id);
        toast.add({
          severity: 'success',
          summary: 'Успешно',
          detail: 'Коммитет удален',
          life: 3000,
        });
      } catch (error: any) {
        // Ошибка уже обработана в store
      }
    },
  });
};

const openCommitteeDetails = (id: number) => {
  router.push({ name: 'committee-details', params: { id } });
};

const exportCommitteesExcel = async () => {
  const rows = committeesStore.committees.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    contactInfo: c.contactInfo || '',
  }));
  const columns: ExcelColumn[] = [
    { key: 'id', header: 'ID', type: 'number' },
    { key: 'name', header: 'Название', type: 'string' },
    { key: 'description', header: 'Описание', type: 'string' },
    { key: 'contactInfo', header: 'Контакты', type: 'string' },
  ];
  await exportExcelTable(columns, rows, {
    totals: false,
    tableName: 'Committees',
    fileName: `committees_${new Date().toISOString().split('T')[0]}.xlsx`,
  });
};

// --- Transaction Types Management ---
const openAddTransactionTypeDialog = () => {
  editingTransactionType.value = null;
  resetTransactionTypeForm();
  transactionTypeDialogVisible.value = true;
};

const openEditTransactionTypeDialog = (type: TransactionType) => {
  editingTransactionType.value = type;
  transactionTypeForm.name = type.name;
  transactionTypeDialogVisible.value = true;
};

const closeTransactionTypeDialog = () => {
  transactionTypeDialogVisible.value = false;
  resetTransactionTypeForm();
};

const resetTransactionTypeForm = () => {
  transactionTypeForm.name = '';
  transactionTypeFormErrors.name = '';
};

const validateTransactionTypeForm = () => {
  transactionTypeFormErrors.name = '';
  if (!transactionTypeForm.name.trim()) {
    transactionTypeFormErrors.name = 'Название обязательно';
    return false;
  }
  return true;
};

const saveTransactionType = async () => {
  if (!validateTransactionTypeForm()) return;
  try {
    if (editingTransactionType.value) {
      const updateDto: UpdateTransactionTypeDto = {
        name: transactionTypeForm.name,
      };
      await transactionTypesStore.updateTransactionType(editingTransactionType.value.id, updateDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Тип транзакции обновлен', life: 3000 });
    } else {
      const createDto: CreateTransactionTypeDto = {
        name: transactionTypeForm.name,
      };
      await transactionTypesStore.createTransactionType(createDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Тип транзакции создан', life: 3000 });
    }
    closeTransactionTypeDialog();
  } catch (error) {
    // Ошибка уже обработана в store
  }
};

const confirmDeleteTransactionType = (type: TransactionType) => {
  confirm.require({
    message: `Вы уверены, что хотите удалить тип "${type.name}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await transactionTypesStore.deleteTransactionType(type.id);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Тип транзакции удален', life: 3000 });
      } catch (error) {
        // Ошибка уже обработана в store
      }
    },
  });
};

// User Status methods
const openAddUserStatusDialog = () => {
  editingUserStatus.value = null;
  resetUserStatusForm();
  userStatusDialogVisible.value = true;
};

const openEditUserStatusDialog = (status: UserStatus) => {
  editingUserStatus.value = status;
  userStatusForm.name = status.name;
  userStatusForm.code = status.code;
  userStatusForm.description = status.description || '';
  userStatusForm.color = status.color || '';
  userStatusDialogVisible.value = true;
};

const closeUserStatusDialog = () => {
  userStatusDialogVisible.value = false;
  editingUserStatus.value = null;
  resetUserStatusForm();
};

const resetUserStatusForm = () => {
  userStatusForm.name = '';
  userStatusForm.code = '';
  userStatusForm.description = '';
  userStatusForm.color = '';
  userStatusFormErrors.name = '';
  userStatusFormErrors.code = '';
};

const validateUserStatusForm = () => {
  let isValid = true;
  userStatusFormErrors.name = '';
  userStatusFormErrors.code = '';

  if (!userStatusForm.name.trim()) {
    userStatusFormErrors.name = 'Название обязательно';
    isValid = false;
  }
  if (!userStatusForm.code.trim()) {
    userStatusFormErrors.code = 'Код обязателен';
    isValid = false;
  }

  return isValid;
};

const saveUserStatus = async () => {
  if (!validateUserStatusForm()) return;

  try {
    if (editingUserStatus.value) {
      const updateDto: UpdateUserStatusDto = {
        name: userStatusForm.name,
        description: userStatusForm.description || undefined,
        color: userStatusForm.color || undefined,
      };
      await userStatusesStore.updateUserStatus(editingUserStatus.value.id, updateDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Статус обновлен', life: 3000 });
    } else {
      const createDto: CreateUserStatusDto = {
        name: userStatusForm.name,
        code: userStatusForm.code,
        description: userStatusForm.description || undefined,
        color: userStatusForm.color || undefined,
      };
      await userStatusesStore.createUserStatus(createDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Статус создан', life: 3000 });
    }
    closeUserStatusDialog();
  } catch (error) {
    // Ошибка уже обработана в store
  }
};

const confirmDeleteUserStatus = (status: UserStatus) => {
  confirm.require({
    message: `Вы уверены, что хотите удалить статус "${status.name}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await userStatusesStore.deleteUserStatus(status.id);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Статус удален', life: 3000 });
      } catch (error) {
        // Ошибка уже обработана в store
      }
    },
  });
};

onMounted(async () => {
  await categoriesStore.fetchCategories();
  await warehousesStore.fetchWarehouses();
  await committeesStore.fetchCommittees();
  await transactionTypesStore.fetchTransactionTypes();
  await userStatusesStore.fetchUserStatuses();
  
  // Инициализация вкладки из URL
  const tabFromUrl = route.query?.tab as string;
  
  const allowedTabs = [
    'categories',
    'warehouses', 
    'committees',
    'transactionTypes',
    'userStatuses',
    'fields',
    'templates',
    'system'
  ];
  
  if (tabFromUrl && allowedTabs.includes(tabFromUrl)) {
    activeTab.value = tabFromUrl as typeof activeTab.value;
  }
});
</script>

<style scoped>
.settings {
  max-width: 1600px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.settings-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
}

.sidebar-card {
  position: sticky;
  top: 1rem;
  height: fit-content;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-button {
  width: 100%;
  justify-content: flex-start;
}

.nav-button.active {
  background: var(--primary-color);
  color: white;
}

.content-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.category-tree {
  border: 1px solid var(--surface-border);
  border-radius: 4px;
}

:deep(.p-tree-node-content) {
  display: flex;
  width: 100%;
}
:deep(.p-tree-node-label) {
  flex-grow: 1;
}
.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.tree-actions {
  display: flex;
  gap: 0.25rem;
}

.fields-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.fields-list h3,
.field-form h3 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.form {
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

.category-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.system-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-label {
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.warehouse-form,
.committee-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.committee-name {
  color: var(--primary-color);
  font-weight: 500;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-card {
    position: static;
  }
}
</style>
