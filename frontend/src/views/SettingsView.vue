<template>
  <div class="settings">
    <h1 class="page-title">Настройки</h1>

    <TabView>
      <TabPanel header="Категории">
        <Card>
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

            <DataTable
              :value="categoriesStore.categories"
              :loading="categoriesStore.loading"
              :emptyMessage="categoriesStore.loading ? 'Загрузка...' : 'Нет категорий'"
              class="p-datatable-sm"
            >
              <Column field="id" header="ID" :sortable="true" style="width: 80px" />
              <Column field="name" header="Название" :sortable="true" />
              <Column field="description" header="Описание" />
              <Column field="parent.name" header="Родительская категория" />
              <Column header="Действия" style="width: 150px">
                <template #body="{ data }">
                  <div class="action-buttons">
                    <Button
                      v-if="authStore.hasRole('MANAGER') || authStore.isAdmin"
                      icon="pi pi-pencil"
                      severity="info"
                      text
                      rounded
                      v-tooltip.top="'Редактировать'"
                      @click="openEditCategoryDialog(data)"
                    />
                    <Button
                      v-if="authStore.isAdmin"
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      v-tooltip.top="'Удалить'"
                      @click="confirmDeleteCategory(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </TabPanel>

      <TabPanel header="Дополнительные поля товаров">
        <Card>
          <template #title>Настройка полей товаров</template>
          <template #content>
            <div class="fields-info">
              <p>Здесь можно настроить дополнительные поля для товаров.</p>
              <p class="text-gray-500">
                В текущей версии доступны стандартные поля: название, SKU, описание, цены, количество, категория, изображения.
              </p>
            </div>
          </template>
        </Card>
      </TabPanel>
    </TabView>

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

    <!-- Диалог подтверждения удаления -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useAuthStore } from '@/stores/authStore';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/api';

const categoriesStore = useCategoriesStore();
const authStore = useAuthStore();
const confirm = useConfirm();
const toast = useToast();

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

const parentCategoryOptions = computed(() => {
  const options = [{ label: 'Нет родительской категории', value: undefined }];
  categoriesStore.categories.forEach((cat) => {
    if (!editingCategory.value || cat.id !== editingCategory.value.id) {
      options.push({ label: cat.name, value: cat.id });
    }
  });
  return options;
});

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

onMounted(async () => {
  await categoriesStore.fetchCategories();
});
</script>

<style scoped>
.settings {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.category-form {
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

.fields-info {
  padding: 1rem;
}

.text-gray-500 {
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>

