<template>
  <div class="products">
    <div class="page-header">
      <h1 class="page-title">Товары</h1>
      <Button
        v-if="authStore.hasRole('MANAGER') || authStore.isAdmin"
        label="Добавить товар"
        icon="pi pi-plus"
        @click="openAddDialog"
      />
    </div>

    <!-- Фильтры и поиск -->
    <Card class="filters-card mb-4">
      <template #content>
        <div class="filters-grid">
          <div class="filter-item">
            <label for="search" class="filter-label">Поиск</label>
            <InputText
              id="search"
              v-model="searchQuery"
              placeholder="Поиск по названию, SKU, описанию..."
              class="w-full"
              @input="handleSearch"
            />
          </div>
          <div class="filter-item">
            <label for="category" class="filter-label">Категория</label>
            <Dropdown
              id="category"
              v-model="selectedCategory"
              :options="categoryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Все категории"
              class="w-full"
              @change="handleCategoryChange"
            />
          </div>
          <div class="filter-item">
            <label for="sort" class="filter-label">Сортировка</label>
            <Dropdown
              id="sort"
              v-model="sortField"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              @change="handleSortChange"
            />
          </div>
          <div class="filter-item">
            <Button
              label="Сбросить"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              @click="resetFilters"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Таблица товаров -->
    <Card>
      <template #content>
        <Message v-if="productsStore.error" severity="error" :closable="false" class="mb-3">
          {{ productsStore.error }}
        </Message>

        <DataTable
          :value="productsStore.products"
          :loading="productsStore.loading"
          :paginator="true"
          :rows="productsStore.pagination.limit"
          :totalRecords="productsStore.pagination.total"
          :first="(productsStore.pagination.page - 1) * productsStore.pagination.limit"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} - {last} из {totalRecords}"
          :emptyMessage="productsStore.loading ? 'Загрузка...' : 'Нет товаров'"
          class="p-datatable-sm"
          @page="onPageChange"
        >
          <Column field="id" header="ID" :sortable="true" style="width: 80px" />
          <Column header="Изображение" style="width: 100px">
            <template #body="{ data }">
              <img
                v-if="data.images && data.images.length > 0"
                :src="getImageUrl(data.images[0])"
                :alt="data.name"
                class="product-image"
              />
              <span v-else class="text-gray-500">Нет фото</span>
            </template>
          </Column>
          <Column field="name" header="Название" :sortable="true" />
          <Column field="sku" header="SKU" :sortable="true" />
          <Column field="salePrice" header="Цена продажи" :sortable="true">
            <template #body="{ data }">
              {{ formatPrice(data.salePrice) }}
            </template>
          </Column>
          <Column field="quantity" header="Количество" :sortable="true">
            <template #body="{ data }">
              <Tag
                :value="data.quantity"
                :severity="getQuantitySeverity(data.quantity, data.minStockLevel)"
              />
            </template>
          </Column>
          <Column field="category.name" header="Категория" />
          <Column header="Действия" style="width: 200px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-shopping-cart"
                  severity="success"
                  text
                  rounded
                  v-tooltip.top="'Продать'"
                  @click="openSaleDialog(data)"
                />
                <Button
                  v-if="authStore.hasRole('MANAGER') || authStore.isAdmin"
                  icon="pi pi-pencil"
                  severity="info"
                  text
                  rounded
                  v-tooltip.top="'Редактировать'"
                  @click="openEditDialog(data)"
                />
                <Button
                  v-if="authStore.isAdmin"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  v-tooltip.top="'Удалить'"
                  @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Диалог добавления/редактирования товара -->
    <Dialog
      v-model:visible="productDialogVisible"
      :header="editingProduct ? 'Редактировать товар' : 'Добавить товар'"
      :modal="true"
      :style="{ width: '600px' }"
      @hide="closeDialog"
    >
      <form @submit.prevent="saveProduct" class="product-form">
        <div class="field">
          <label for="name" class="label">Название *</label>
          <InputText id="name" v-model="productForm.name" class="w-full" required />
          <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
        </div>

        <div class="field">
          <label for="sku" class="label">SKU *</label>
          <InputText id="sku" v-model="productForm.sku" class="w-full" required />
          <small v-if="formErrors.sku" class="p-error">{{ formErrors.sku }}</small>
        </div>

        <div class="field">
          <label for="description" class="label">Описание</label>
          <Textarea id="description" v-model="productForm.description" rows="3" class="w-full" />
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="purchasePrice" class="label">Цена закупки *</label>
            <InputNumber
              id="purchasePrice"
              v-model="productForm.purchasePrice"
              mode="decimal"
              :min="0"
              :maxFractionDigits="2"
              class="w-full"
              required
            />
            <small v-if="formErrors.purchasePrice" class="p-error">{{ formErrors.purchasePrice }}</small>
          </div>

          <div class="field">
            <label for="salePrice" class="label">Цена продажи *</label>
            <InputNumber
              id="salePrice"
              v-model="productForm.salePrice"
              mode="decimal"
              :min="0"
              :maxFractionDigits="2"
              class="w-full"
              required
            />
            <small v-if="formErrors.salePrice" class="p-error">{{ formErrors.salePrice }}</small>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="quantity" class="label">Количество *</label>
            <InputNumber
              id="quantity"
              v-model="productForm.quantity"
              :min="0"
              class="w-full"
              required
            />
            <small v-if="formErrors.quantity" class="p-error">{{ formErrors.quantity }}</small>
          </div>

          <div class="field">
            <label for="minStockLevel" class="label">Мин. уровень запаса</label>
            <InputNumber
              id="minStockLevel"
              v-model="productForm.minStockLevel"
              :min="0"
              class="w-full"
            />
          </div>
        </div>

        <div class="field">
          <label for="categoryId" class="label">Категория</label>
          <Dropdown
            id="categoryId"
            v-model="productForm.categoryId"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Выберите категорию"
            class="w-full"
          />
        </div>

        <div class="field">
          <label class="label">Изображения</label>
          <FileUpload
            mode="basic"
            accept="image/*"
            :maxFileSize="5000000"
            :multiple="true"
            chooseLabel="Загрузить изображения"
            @select="handleImageSelect"
          />
          <div v-if="productForm.images && productForm.images.length > 0" class="images-preview">
            <div v-for="(image, index) in productForm.images" :key="index" class="image-item">
              <img :src="getImageUrl(image)" :alt="`Image ${index + 1}`" />
              <Button
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                @click="removeImage(index)"
              />
            </div>
          </div>
        </div>

        <Message v-if="productsStore.error" severity="error" :closable="false" class="mb-3">
          {{ productsStore.error }}
        </Message>

        <div class="dialog-footer">
          <Button label="Отмена" severity="secondary" outlined @click="closeDialog" />
          <Button
            type="submit"
            :label="editingProduct ? 'Сохранить' : 'Создать'"
            :loading="productsStore.loading"
          />
        </div>
      </form>
    </Dialog>

    <!-- Диалог продажи -->
    <Dialog
      v-model:visible="saleDialogVisible"
      header="Продать товар"
      :modal="true"
      :style="{ width: '400px' }"
      @hide="closeSaleDialog"
    >
      <form v-if="selectedProduct" @submit.prevent="handleSale" class="sale-form">
        <div class="field">
          <label class="label">Товар</label>
          <InputText :value="selectedProduct.name" disabled class="w-full" />
        </div>

        <div class="field">
          <label class="label">Доступно</label>
          <InputNumber :value="selectedProduct.quantity" disabled class="w-full" />
        </div>

        <div class="field">
          <label for="saleQuantity" class="label">Количество *</label>
          <InputNumber
            id="saleQuantity"
            v-model="saleForm.quantity"
            :min="1"
            :max="selectedProduct.quantity"
            class="w-full"
            required
          />
          <small v-if="saleFormErrors.quantity" class="p-error">{{ saleFormErrors.quantity }}</small>
        </div>

        <div class="field">
          <label for="salePrice" class="label">Цена продажи</label>
          <InputNumber
            id="salePrice"
            v-model="saleForm.salePrice"
            mode="decimal"
            :min="0"
            :maxFractionDigits="2"
            class="w-full"
          />
          <small class="text-gray-500">По умолчанию: {{ formatPrice(selectedProduct.salePrice) }}</small>
        </div>

        <Message v-if="salesStore.error" severity="error" :closable="false" class="mb-3">
          {{ salesStore.error }}
        </Message>

        <div class="dialog-footer">
          <Button label="Отмена" severity="secondary" outlined @click="closeSaleDialog" />
          <Button type="submit" label="Продать" :loading="salesStore.loading" />
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
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ConfirmDialog from 'primevue/confirmdialog';
import { useProductsStore } from '@/stores/productsStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useSalesStore } from '@/stores/salesStore';
import { useAuthStore } from '@/stores/authStore';
import type { Product, CreateProductDto, UpdateProductDto } from '@/types/api';
import { apiService } from '@/services/api';

const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();
const salesStore = useSalesStore();
const authStore = useAuthStore();
const confirm = useConfirm();
const toast = useToast();

const searchQuery = ref('');
const selectedCategory = ref<number | null>(null);
const sortField = ref('name');
const productDialogVisible = ref(false);
const saleDialogVisible = ref(false);
const editingProduct = ref<Product | null>(null);
const selectedProduct = ref<Product | null>(null);

const productForm = reactive<CreateProductDto & { images?: string[] }>({
  name: '',
  sku: '',
  description: '',
  purchasePrice: 0,
  salePrice: 0,
  quantity: 0,
  minStockLevel: 0,
  categoryId: undefined,
  images: [],
});

const saleForm = reactive({
  quantity: 1,
  salePrice: undefined as number | undefined,
});

const formErrors = reactive({
  name: '',
  sku: '',
  purchasePrice: '',
  salePrice: '',
  quantity: '',
});

const saleFormErrors = reactive({
  quantity: '',
});

const categoryOptions = computed(() => {
  const options = [{ label: 'Все категории', value: null }];
  categoriesStore.categories.forEach((cat) => {
    options.push({ label: cat.name, value: cat.id });
  });
  return options;
});

const sortOptions = [
  { label: 'По названию', value: 'name' },
  { label: 'По цене', value: 'salePrice' },
  { label: 'По количеству', value: 'quantity' },
  { label: 'По дате создания', value: 'createdAt' },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getImageUrl = (imagePath: string) => {
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(price);
};

const getQuantitySeverity = (quantity: number, minStockLevel: number) => {
  if (quantity === 0) return 'danger';
  if (quantity <= minStockLevel) return 'warning';
  return 'success';
};

const handleSearch = () => {
  productsStore.setFilters({ search: searchQuery.value });
  productsStore.setPage(1);
  productsStore.fetchProducts();
};

const handleCategoryChange = () => {
  productsStore.setFilters({ category: selectedCategory.value || undefined });
  productsStore.setPage(1);
  productsStore.fetchProducts();
};

const handleSortChange = () => {
  // В реальном приложении здесь была бы сортировка на сервере
  // Для примера просто перезагружаем данные
  productsStore.fetchProducts();
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = null;
  sortField.value = 'name';
  productsStore.setFilters({ search: '', category: undefined });
  productsStore.setPage(1);
  productsStore.fetchProducts();
};

const onPageChange = (event: any) => {
  productsStore.setPage(event.page + 1);
  productsStore.fetchProducts();
};

const openAddDialog = () => {
  editingProduct.value = null;
  resetProductForm();
  productDialogVisible.value = true;
};

const openEditDialog = (product: Product) => {
  editingProduct.value = product;
  productForm.name = product.name;
  productForm.sku = product.sku;
  productForm.description = product.description || '';
  productForm.purchasePrice = Number(product.purchasePrice);
  productForm.salePrice = Number(product.salePrice);
  productForm.quantity = product.quantity;
  productForm.minStockLevel = product.minStockLevel || 0;
  productForm.categoryId = product.categoryId || undefined;
  productForm.images = [...(product.images || [])];
  productDialogVisible.value = true;
};

const closeDialog = () => {
  productDialogVisible.value = false;
  resetProductForm();
};

const resetProductForm = () => {
  productForm.name = '';
  productForm.sku = '';
  productForm.description = '';
  productForm.purchasePrice = 0;
  productForm.salePrice = 0;
  productForm.quantity = 0;
  productForm.minStockLevel = 0;
  productForm.categoryId = undefined;
  productForm.images = [];
  Object.keys(formErrors).forEach((key) => {
    formErrors[key as keyof typeof formErrors] = '';
  });
};

const validateProductForm = () => {
  let valid = true;
  Object.keys(formErrors).forEach((key) => {
    formErrors[key as keyof typeof formErrors] = '';
  });

  if (!productForm.name.trim()) {
    formErrors.name = 'Название обязательно';
    valid = false;
  }

  if (!productForm.sku.trim()) {
    formErrors.sku = 'SKU обязателен';
    valid = false;
  }

  if (productForm.purchasePrice <= 0) {
    formErrors.purchasePrice = 'Цена закупки должна быть больше 0';
    valid = false;
  }

  if (productForm.salePrice <= 0) {
    formErrors.salePrice = 'Цена продажи должна быть больше 0';
    valid = false;
  }

  if (productForm.quantity < 0) {
    formErrors.quantity = 'Количество не может быть отрицательным';
    valid = false;
  }

  return valid;
};

const saveProduct = async () => {
  if (!validateProductForm()) return;

  try {
    if (editingProduct.value) {
      const updateDto: UpdateProductDto = {
        name: productForm.name,
        sku: productForm.sku,
        description: productForm.description,
        purchasePrice: productForm.purchasePrice,
        salePrice: productForm.salePrice,
        quantity: productForm.quantity,
        minStockLevel: productForm.minStockLevel,
        categoryId: productForm.categoryId,
        images: productForm.images,
      };
      await productsStore.updateProduct(editingProduct.value.id, updateDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Товар обновлен', life: 3000 });
    } else {
      const createDto: CreateProductDto = {
        name: productForm.name,
        sku: productForm.sku,
        description: productForm.description,
        purchasePrice: productForm.purchasePrice,
        salePrice: productForm.salePrice,
        quantity: productForm.quantity,
        minStockLevel: productForm.minStockLevel,
        categoryId: productForm.categoryId,
        images: productForm.images,
      };
      await productsStore.createProduct(createDto);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Товар создан', life: 3000 });
    }
    closeDialog();
  } catch (error) {
    // Ошибка уже обработана в store
  }
};

const handleImageSelect = async (event: any) => {
  const files = Array.from(event.files) as File[];
  for (const file of files) {
    try {
      if (editingProduct.value) {
        const product = await productsStore.uploadImage(editingProduct.value.id, file);
        if (product.images) {
          productForm.images = [...product.images];
        }
      } else {
        // Для нового товара сохраняем файлы для загрузки после создания
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            productForm.images = [...(productForm.images || []), e.target.result];
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось загрузить изображение',
        life: 3000,
      });
    }
  }
};

const removeImage = async (index: number) => {
  if (editingProduct.value && productForm.images?.[index]) {
    try {
      await productsStore.deleteImage(editingProduct.value.id, productForm.images[index]);
      productForm.images?.splice(index, 1);
    } catch (error) {
      // Ошибка уже обработана в store
    }
  } else {
    productForm.images?.splice(index, 1);
  }
};

const openSaleDialog = (product: Product) => {
  selectedProduct.value = product;
  saleForm.quantity = 1;
  saleForm.salePrice = Number(product.salePrice);
  saleDialogVisible.value = true;
};

const closeSaleDialog = () => {
  saleDialogVisible.value = false;
  selectedProduct.value = null;
  saleForm.quantity = 1;
  saleForm.salePrice = undefined;
  saleFormErrors.quantity = '';
};

const handleSale = async () => {
  if (!selectedProduct.value) return;

  saleFormErrors.quantity = '';

  if (saleForm.quantity < 1) {
    saleFormErrors.quantity = 'Количество должно быть больше 0';
    return;
  }

  if (saleForm.quantity > selectedProduct.value.quantity) {
    saleFormErrors.quantity = 'Недостаточно товара на складе';
    return;
  }

  try {
    await salesStore.createSale({
      productId: selectedProduct.value.id,
      quantity: saleForm.quantity,
      salePrice: saleForm.salePrice,
    });
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Продажа оформлена', life: 3000 });
    closeSaleDialog();
    await productsStore.fetchProducts();
  } catch (error) {
    // Ошибка уже обработана в store
  }
};

const confirmDelete = (product: Product) => {
  confirm.require({
    message: `Вы уверены, что хотите удалить товар "${product.name}"?`,
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await productsStore.deleteProduct(product.id);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Товар удален', life: 3000 });
      } catch (error) {
        // Ошибка уже обработана в store
      }
    },
  });
};

onMounted(async () => {
  await categoriesStore.fetchCategories();
  await productsStore.fetchProducts();
});
</script>

<style scoped>
.products {
  max-width: 1400px;
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

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.product-form,
.sale-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-weight: 500;
}

.images-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.image-item {
  position: relative;
  border: 1px solid var(--surface-border);
  border-radius: 4px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.image-item button {
  position: absolute;
  top: 4px;
  right: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
