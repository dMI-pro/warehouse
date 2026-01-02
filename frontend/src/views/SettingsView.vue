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
              @click="activeTab = tab.key"
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
                v-if="authStore.hasRole('MANAGER') || authStore.isAdmin"
                label="Добавить категорию"
                icon="pi pi-plus"
                @click="openAddCategoryDialog"
              />
            </div>
          </template>
          <template #content>
            <Message v-if="categoriesStore.error" severity="error" :closable="false" class="mb-3">
              {{ categoriesStore.error }}
            </Message>

            <Tree
              :value="categoryTree"
              :expandedKeys="expandedKeys"
              @node-expand="onNodeExpand"
              @node-collapse="onNodeCollapse"
              class="category-tree"
            >
              <template #default="node">
                <div class="tree-node">
                  <span>{{ node.label }}</span>
                  <div class="tree-actions">
                    <Button
                      v-if="authStore.hasRole('MANAGER') || authStore.isAdmin"
                      icon="pi pi-pencil"
                      severity="info"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'Редактировать'"
                      @click.stop="openEditCategoryDialog(node.data)"
                    />
                    <Button
                      v-if="authStore.isAdmin"
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'Удалить'"
                      @click.stop="confirmDeleteCategory(node.data)"
                    />
                  </div>
                </div>
              </template>
            </Tree>
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
                        text
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
          <template #title>Шаблоны экспорта</template>
          <template #content>
            <div class="templates-section">
              <p>Настройка шаблонов экспорта данных</p>
              <DataTable :value="exportTemplates" :emptyMessage="'Нет шаблонов'" class="templates-table">
                <Column field="name" header="Название" />
                <Column field="format" header="Формат" />
                <Column header="Действия" style="width: 100px">
                  <template #body="{ data }">
                    <Button icon="pi pi-pencil" severity="info" text rounded @click="editTemplate(data)" />
                    <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteTemplate(data.id)" />
                  </template>
                </Column>
              </DataTable>
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
      </div>
    </div>

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

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
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
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Divider from 'primevue/divider';
import ConfirmDialog from 'primevue/confirmdialog';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useAuthStore } from '@/stores/authStore';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/api';

const categoriesStore = useCategoriesStore();
const authStore = useAuthStore();
const confirm = useConfirm();
const toast = useToast();

const activeTab = ref<'categories' | 'fields' | 'templates' | 'system'>('categories');
const expandedKeys = ref<Record<string, boolean>>({});

const tabs = [
  { key: 'categories', label: 'Категории', icon: 'pi pi-sitemap' },
  { key: 'fields', label: 'Дополнительные поля', icon: 'pi pi-list' },
  { key: 'templates', label: 'Шаблоны экспорта', icon: 'pi pi-file-export' },
  { key: 'system', label: 'Системные настройки', icon: 'pi pi-cog' },
];

const categoryDialogVisible = ref(false);
const editingCategory = ref<Category | null>(null);

const categoryForm = reactive<CreateCategoryDto>({
  name: '',
  description: '',
  parentId: undefined,
});

const categoryFormErrors = reactive({
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

const exportTemplates = ref([
  { id: 1, name: 'Полный отчет', format: 'Excel' },
  { id: 2, name: 'Продажи', format: 'CSV' },
]);

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

const categoryTree = computed(() => {
  const buildTree = (categories: Category[], parentId?: number): any[] => {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .map((cat) => ({
        key: cat.id.toString(),
        label: cat.name,
        data: cat,
        children: buildTree(categories, cat.id),
      }));
  };

  return buildTree(categoriesStore.categories);
});

const parentCategoryOptions = computed(() => {
  const options = [{ label: 'Нет родительской категории', value: undefined }];
  categoriesStore.categories.forEach((cat) => {
    if (!editingCategory.value || cat.id !== editingCategory.value.id) {
      options.push({ label: cat.name, value: cat.id });
    }
  });
  return options;
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
  toast.add({ severity: 'info', summary: 'Информация', detail: 'Редактирование шаблона', life: 3000 });
};

const deleteTemplate = (id: number) => {
  exportTemplates.value = exportTemplates.value.filter((t) => t.id !== id);
  toast.add({ severity: 'success', summary: 'Успешно', detail: 'Шаблон удален', life: 3000 });
};

const saveSystemSettings = () => {
  toast.add({ severity: 'success', summary: 'Успешно', detail: 'Настройки сохранены', life: 3000 });
};

onMounted(async () => {
  await categoriesStore.fetchCategories();
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

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
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

@media (max-width: 1024px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .sidebar-card {
    position: static;
  }
}
</style>
