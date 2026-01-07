<template>
  <div class="products">
    <div class="page-header">
      <h1 class="page-title">Товары</h1>
      <div class="header-actions">
        <Button
          label="Экспорт CSV"
          icon="pi pi-file-export"
          severity="secondary"
          outlined
          @click="exportToCSV"
        />
        <Button
          label="Экспорт Excel"
          icon="pi pi-file-excel"
          severity="secondary"
          outlined
          disabled
          @click="exportToExcel"
        />
        <Button
          v-if="authStore.hasRole(Role.MANAGER) || authStore.isAdmin"
          label="Добавить товар"
          icon="pi pi-plus"
          @click="openAddDialog"
        />
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <Card class="filters-card mb-4">
      <template #content>
        <div class="filters-grid">
          <div class="filter-item search-item">
            <div class="p-input-icon-left w-full">
              <InputText
                v-model="searchQuery"
                placeholder="Поиск по названию, SKU, описанию..."
                fluid
                @input="handleSearch"
              />
            </div>
          </div>
          <div class="filter-item">
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
            <Dropdown
              id="warehouse"
              v-model="selectedWarehouse"
              :options="warehouseOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Все склады"
              class="w-full"
              @change="handleWarehouseChange"
            />
          </div>
          <div class="filter-item">
            <Dropdown
              id="committee"
              v-model="selectedCommittee"
              :options="committeeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Все коммитеты"
              class="w-full"
              @change="handleCommitteeChange"
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
          v-model:selection="selectedProducts"
          :loading="productsStore.loading"
          :paginator="true"
          :rows="productsStore.pagination.limit"
          :totalRecords="productsStore.pagination.total"
          :first="(productsStore.pagination.page - 1) * productsStore.pagination.limit"
          :rowsPerPageOptions="[20, 50, 100]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} - {last} из {totalRecords}"
          :emptyMessage="productsStore.loading ? 'Загрузка...' : 'Нет товаров'"
          class="products-table"
          dataKey="id"
          @page="onPageChange"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" />
          <Column header="Изображение" style="width: 100px">
            <template #body="{ data }">
              <img
                v-if="data.images && data.images.length > 0"
                :src="getImageUrl(data.images[0])"
                :alt="data.name"
                class="product-image"
              />
              <span v-else class="no-image">Нет фото</span>
            </template>
          </Column>
          <Column field="name" header="Название" :sortable="true">
            <template #body="{ data }">
              <span class="product-name">{{ data.name }}</span>
            </template>
          </Column>
          <Column field="sku" header="Артикул" :sortable="true" />
          <Column field="category.name" header="Категория">
            <template #body="{ data }">
              <Tag :value="data.category?.name || 'Без категории'" severity="info" />
            </template>
          </Column>
          <Column field="salePrice" header="Цена продажи" :sortable="true">
            <template #body="{ data }">
              {{ formatPrice(data.salePrice) }}
            </template>
          </Column>
          <Column field="quantity" header="Количество" :sortable="true">
            <template #body="{ data }">
              <span
                :class="{
                  'low-stock': data.quantity < data.minStockLevel,
                  'out-of-stock': data.quantity === 0,
                }"
              >
                {{ data.quantity }}
              </span>
            </template>
          </Column>
          <Column header="Действия" style="width: 180px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button
                  icon="pi pi-pencil"
                  severity="info"
                  size="small"
                  outlined
                  rounded
                  v-tooltip.top="'Редактировать'"
                  @click="openEditDialog(data)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  outlined
                  rounded
                  v-tooltip.top="'Удалить'"
                  @click="confirmDelete(data)"
                />
                <Button
                  icon="pi pi-shopping-cart"
                  severity="success"
                  size="small"
                  outlined
                  rounded
                  v-tooltip.top="'Продать'"
                  @click="openSaleDialog(data)"
                />
                <Button
                  icon="pi pi-replay"
                  severity="warning"
                  size="small"
                  outlined
                  rounded
                  v-tooltip.top="'Возврат'"
                  @click="openReturnDialog(data)"
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
      :style="{ width: '700px' }"
      @hide="closeDialog"
    >
      <form @submit.prevent="saveProduct" class="product-form">
        <TabView>
          <!-- Вкладка 1: Основная информация -->
          <TabPanel header="Основная информация">
            <div class="tab-content">
              <div class="field">
                <label for="name" class="label">Название товара *</label>
                <InputText id="name" v-model="productForm.name" class="w-full" required />
                <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
              </div>

              <div class="field">
                <label for="sku" class="label">Артикул *</label>
                <InputText id="sku" v-model="productForm.sku" class="w-full" required />
                <small v-if="formErrors.sku" class="p-error">{{ formErrors.sku }}</small>
              </div>

              <div class="field">
                <label for="description" class="label">Описание</label>
                <Textarea
                  id="description"
                  v-model="productForm.description"
                  rows="4"
                  class="w-full"
                  :maxlength="1000"
                />
                <small class="char-count">
                  {{ (productForm.description || '').length }}/1000 символов
                </small>
              </div>

              <div class="field">
                <label for="categoryId" class="label">Категория</label>
                <Dropdown
                  id="categoryId"
                  v-model="productForm.categoryId"
                  :options="categoriesStore.flatCategoriesLabels"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Выберите категорию"
                  class="w-full"
                />
                <!-- Дерево с вложенной структурой категорий -->
                <!-- <TreeSelect
                  id="categoryId"
                  v-model="productForm.categoryId"
                  :options="categoriesStore.categoriesTreePrimeVue"
                  placeholder="Выберите категорию"
                  class="w-full"
                  selectionMode="single"
                /> -->
              </div>

              <div class="field">
                <label for="warehouseId" class="label">Склад</label>
                <Dropdown
                  id="warehouseId"
                  v-model="productForm.warehouseId"
                  :options="warehouseOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Выберите склад"
                  class="w-full"
                />
              </div>

              <div class="field">
                <label for="committeeId" class="label">Коммитет</label>
                <Dropdown
                  id="committeeId"
                  v-model="productForm.committeeId"
                  :options="committeeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Выберите коммитет"
                  class="w-full"
                />
              </div>

              <div class="field">
                <label for="transactionTypeId" class="label">Тип транзакции</label>
                <Dropdown
                  id="transactionTypeId"
                  v-model="productForm.transactionTypeId"
                  :options="transactionTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Выберите тип"
                  class="w-full"
                />
              </div>
              <div class="field" v-if="authStore.isAdmin">
                <label for="arrivalDate" class="label">Дата поступления</label>
                <Calendar
                  id="arrivalDate"
                  v-model="productForm.arrivalDate"
                  dateFormat="yy-mm-dd"
                  showIcon
                  showTime
                  hourFormat="24"
                  class="w-full"
                />
                <small v-if="!editingProduct" class="text-gray-500">По умолчанию: сейчас</small>
              </div>
            </div>
          </TabPanel>

          <!-- Вкладка 2: Цены и количество -->
          <TabPanel header="Цены и количество">
            <div class="tab-content">
              <div class="field">
                <label for="purchasePrice" class="label">Цена закупа * (₽)</label>
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
                <label for="salePrice" class="label">Цена продажи * (₽)</label>
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

                <!-- Если transactionType === "Комиссия" (transactionTypeId=2) показываем кнопку -->
                <div v-if="productForm?.transactionTypeId === 2" class="mt-2">
                  <Button
                    label="с 20% надбавкой"
                    size="small"
                    severity="info"
                    v-tooltip.top="'Установить цену: продажи × 1.25'"
                    @click="applyCommissionMarkup"
                  />
                </div>
              </div>

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
                <label for="minStockLevel" class="label">Минимальный запас</label>
                <InputNumber
                  id="minStockLevel"
                  v-model="productForm.minStockLevel"
                  :min="0"
                  class="w-full"
                />
              </div>
            </div>
          </TabPanel>

          <!-- Вкладка 3: Изображения -->
          <TabPanel header="Изображения">
            <div class="tab-content">
              <div class="field">
                <label class="label">Загрузка изображений</label>
                <div class="upload-zone" @drop.prevent="handleDrop" @dragover.prevent @dragenter.prevent>
                  <i class="pi pi-cloud-upload" style="font-size: 3rem; color: var(--primary-color)"></i>
                  <p>Перетащите изображения сюда или</p>
                  <FileUpload
                    mode="basic"
                    accept="image/*"
                    :maxFileSize="5000000"
                    :multiple="true"
                    chooseLabel="Выбрать файлы"
                    @select="handleImageSelect"
                  />
                </div>
              </div>

              <div v-if="productForm.images && productForm.images.length > 0" class="images-preview">
                <div v-for="(image, index) in productForm.images" :key="index" class="image-item">
                  <img :src="getImageUrl(image)" :alt="`Image ${index + 1}`" />
                  <div class="image-actions">
                    <Button
                      v-if="index === 0"
                      icon="pi pi-star-fill"
                      severity="warning"
                      text
                      rounded
                      v-tooltip.top="'Главное изображение'"
                      disabled
                    />
                    <Button
                      v-else
                      icon="pi pi-star"
                      severity="secondary"
                      text
                      rounded
                      v-tooltip.top="'Сделать главным'"
                      @click="setMainImage(index)"
                    />
                    <Button
                      icon="pi pi-times"
                      severity="danger"
                      text
                      rounded
                      v-tooltip.top="'Удалить'"
                      @click="removeImage(index)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Вкладка 4: Дополнительные поля -->
          <TabPanel header="Дополнительные поля">
            <div class="tab-content">
              <div class="field">
                <label class="label">Дополнительные настройки</label>
                <p class="text-muted">Дополнительные поля будут доступны после настройки в разделе "Настройки"</p>
              </div>
            </div>
          </TabPanel>
        </TabView>

        <Message v-if="productsStore.error" severity="error" :closable="false" class="mb-3 mt-3">
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
          <InputNumber v-model="selectedProduct.quantity" disabled class="w-full" />
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
          <div v-if="selectedProduct?.transactionType?.name === 'Комиссия'" class="mt-2">
            <Button
              label="с 20% надбавкой"
              size="small"
              severity="info"
              v-tooltip.top="'Установить цену: продажи × 1.25'"
              @click="applyCommissionMarkup"
            />
          </div>
        </div>

        <div class="field" v-if="authStore.isAdmin">
          <label for="soldAt" class="label">Дата продажи</label>
          <Calendar
            id="soldAt"
            v-model="saleForm.soldAt"
            dateFormat="yy-mm-dd"
            showIcon
            showTime
            hourFormat="24"
            class="w-full"
          />
          <small class="text-gray-500">По умолчанию: сейчас</small>
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

    <!-- Диалог возврата -->
    <Dialog
      v-model:visible="returnDialogVisible"
      header="Возврат товара"
      :modal="true"
      :style="{ width: '400px' }"
      @hide="closeReturnDialog"
    >
      <form v-if="selectedProduct" @submit.prevent="handleReturn" class="return-form">
        <div class="field">
          <label class="label">Товар</label>
          <InputText :value="selectedProduct.name" disabled class="w-full" />
        </div>

        <div class="field">
          <label class="label">Доступно</label>
          <InputNumber :value="selectedProduct.quantity" disabled class="w-full" />
        </div>

        <div class="field">
          <label for="returnQuantity" class="label">Количество к возврату *</label>
          <InputNumber
            id="returnQuantity"
            v-model="returnForm.quantity"
            :min="1"
            :max="selectedProduct.quantity"
            class="w-full"
            required
          />
        </div>

        <div class="field">
          <label for="returnReason" class="label">Причина возврата</label>
          <Textarea
            id="returnReason"
            v-model="returnForm.reason"
            rows="3"
            class="w-full"
            placeholder="Почему товар возвращается?"
          />
        </div>

        <div class="dialog-footer">
          <Button label="Отмена" severity="secondary" outlined @click="closeReturnDialog" />
          <Button type="submit" label="Оформить возврат" severity="warning" :loading="returnsStore.loading" />
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
import { saveAs } from 'file-saver';
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
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Calendar from 'primevue/calendar';
import TreeSelect from 'primevue/treeselect';
import { useProductsStore } from '@/stores/productsStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useSalesStore } from '@/stores/salesStore';
import { useAuthStore } from '@/stores/authStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import { useCommitteesStore } from '@/stores/committeesStore';
import { useTransactionTypesStore } from '@/stores/transactionTypesStore';
import { useReturnsStore } from '@/stores/returnsStore';
import type { Product, CreateProductDto, UpdateProductDto } from '@/types/api';
import { Role } from '@/types/api';
import { apiService } from '@/services/api';
import { compressImageFile, createImagePreview } from '@/utils/imageCompression';
import { handleApiError, validateSKU } from '@/utils/errorHandler';

const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();
const salesStore = useSalesStore();
const authStore = useAuthStore();
const warehousesStore = useWarehousesStore();
const committeesStore = useCommitteesStore();
const transactionTypesStore = useTransactionTypesStore();
const returnsStore = useReturnsStore();
const confirm = useConfirm();
const toast = useToast();

const searchQuery = ref('');
const selectedCategory = ref<number | null>(null);
const selectedWarehouse = ref<number | null>(null);
const selectedCommittee = ref<number | null>(null);
const sortField = ref('name');
const productDialogVisible = ref(false);
const saleDialogVisible = ref(false);
const editingProduct = ref<Product | null>(null);
const selectedProduct = ref<Product | null>(null);
const selectedProducts = ref<Product[]>([]);
const pendingFiles = ref<File[]>([]);

const productForm = reactive<CreateProductDto & { images?: string[]; arrivalDate?: Date }>({
  name: '',
  sku: '',
  description: '',
  purchasePrice: 0,
  salePrice: 0,
  quantity: 0,
  minStockLevel: 0,
  categoryId: undefined,
  warehouseId: undefined,
  committeeId: undefined,
  transactionTypeId: undefined,
  arrivalDate: undefined,
  images: [],
});

const saleForm = reactive({
  quantity: 1,
  salePrice: undefined as number | undefined,
  soldAt: undefined as Date | undefined,
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

const warehouseOptions = computed(() => {
  const options = [{ label: 'Все склады', value: null }];
  warehousesStore.warehouses.forEach((wh) => {
    options.push({ label: wh.name, value: wh.id });
  });
  return options;
});

const committeeOptions = computed(() => {
  const options = [{ label: 'Все коммитеты', value: null }];
  committeesStore.committees.forEach((com) => {
    options.push({ label: com.name, value: com.id });
  });
  return options;
});

const transactionTypeOptions = computed(() => {
  const options = [{ label: 'Без типа', value: undefined }];
  transactionTypesStore.transactionTypes.forEach((tt) => {
    options.push({ label: tt.name, value: tt.id });
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
  // if (imagePath.startsWith('http')) return imagePath;
  // return `${API_BASE_URL}${imagePath}`;

  if (!imagePath) return '';
  
  // Если это уже полный URL
  if (imagePath.startsWith('http')) return imagePath;
  
  // Если это относительный путь
  if (imagePath.startsWith('/uploads/')) {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // Если это просто имя файла (для новых загрузок)
  return imagePath;
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
  productsStore.setFilters({
    category: selectedCategory.value || undefined,
    warehouse: selectedWarehouse.value || undefined,
    committee: selectedCommittee.value || undefined,
  });
  productsStore.setPage(1);
  productsStore.fetchProducts();
};

const handleWarehouseChange = () => {
  productsStore.setFilters({
    category: selectedCategory.value || undefined,
    warehouse: selectedWarehouse.value || undefined,
    committee: selectedCommittee.value || undefined,
  });
  productsStore.setPage(1);
  productsStore.fetchProducts();
};

const handleCommitteeChange = () => {
  productsStore.setFilters({
    category: selectedCategory.value || undefined,
    warehouse: selectedWarehouse.value || undefined,
    committee: selectedCommittee.value || undefined,
  });
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
  selectedWarehouse.value = null;
  selectedCommittee.value = null;
  sortField.value = 'name';
  productsStore.setFilters({ search: '', category: undefined, warehouse: undefined, committee: undefined });
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
  productForm.arrivalDate = new Date();
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
  productForm.warehouseId = product.warehouseId || undefined;
  productForm.committeeId = product.committeeId || undefined;
  productForm.transactionTypeId = product.transactionTypeId || undefined;
  productForm.arrivalDate = product.arrivalDate ? new Date(product.arrivalDate) : undefined;
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
  productForm.warehouseId = undefined;
  productForm.committeeId = undefined;
  productForm.transactionTypeId = undefined;
  productForm.arrivalDate = undefined;
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

  const skuValidation = validateSKU(productForm.sku);
  if (!skuValidation.valid) {
    formErrors.sku = skuValidation.message || 'SKU обязателен';
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
        warehouseId: productForm.warehouseId,
        committeeId: productForm.committeeId,
        transactionTypeId: productForm.transactionTypeId,
        arrivalDate: productForm.arrivalDate ? productForm.arrivalDate.toISOString() : undefined,
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
        warehouseId: productForm.warehouseId,
        committeeId: productForm.committeeId,
        transactionTypeId: productForm.transactionTypeId,
        arrivalDate: productForm.arrivalDate ? productForm.arrivalDate.toISOString() : undefined,
        images: [], // Images are uploaded separately
      };
      const createdProduct = await productsStore.createProduct(createDto);
      
      // Upload pending images
      if (pendingFiles.value.length > 0) {
        let uploadedCount = 0;
        for (const file of pendingFiles.value) {
          try {
            await productsStore.uploadImage(createdProduct.id, file);
            uploadedCount++;
          } catch (err) {
            console.error('Error uploading image:', err);
          }
        }
        if (uploadedCount < pendingFiles.value.length) {
          toast.add({ severity: 'warn', summary: 'Внимание', detail: `Загружено ${uploadedCount} из ${pendingFiles.value.length} изображений`, life: 3000 });
        }
      }

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
        pendingFiles.value.push(file);
        
        // Создаем превью
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
    if (pendingFiles.value.length > index) {
      pendingFiles.value.splice(index, 1);
    }
  }
};

const setMainImage = (index: number) => {
  if (productForm.images && productForm.images.length > index) {
    const image = productForm.images[index];
    productForm.images.splice(index, 1);
    productForm.images.unshift(image);
    
    // Если есть отложенные файлы (при создании), меняем их порядок тоже
    if (pendingFiles.value.length > index && pendingFiles.value.length === productForm.images.length) {
      const file = pendingFiles.value[index];
      pendingFiles.value.splice(index, 1);
      pendingFiles.value.unshift(file);
    }
  }
};

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const fileArray = Array.from(files);
    handleImageSelect({ files: fileArray });
  }
};

const openSaleDialog = (product: Product) => {
  selectedProduct.value = product;
  saleForm.quantity = 1;
  saleForm.salePrice = Number(product.salePrice);
  saleForm.soldAt = new Date();
  saleDialogVisible.value = true;
};

// рассчитываем поле "Цена продажи" с 25% надбавкой от цены закупа
const applyCommissionMarkup = () => {
  const startPrice = Number(productForm.purchasePrice) || 0;
  productForm.salePrice = Math.round(startPrice * 1.25 * 100) / 100;
};

const closeSaleDialog = () => {
  saleDialogVisible.value = false;
  selectedProduct.value = null;
  saleForm.quantity = 1;
  saleForm.salePrice = undefined;
  saleForm.soldAt = undefined;
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
      salePrice: saleForm.salePrice || selectedProduct.value.salePrice,
      soldAt: saleForm.soldAt ? saleForm.soldAt.toISOString() : undefined,
    });

    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Продажа успешно оформлена',
      life: 3000,
    });

    closeSaleDialog();
    await productsStore.fetchProducts();
  } catch (error) {
    // Ошибка обрабатывается в store
  }
};

const openReturnDialog = (product: Product) => {
  selectedProduct.value = product;
  returnForm.quantity = 1;
  returnForm.reason = '';
  returnDialogVisible.value = true;
};

const closeReturnDialog = () => {
  returnDialogVisible.value = false;
  selectedProduct.value = null;
  returnForm.quantity = 1;
  returnForm.reason = '';
};

const handleReturn = async () => {
  if (!selectedProduct.value) return;

  if (returnForm.quantity < 1) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Количество должно быть больше 0',
      life: 3000,
    });
    return;
  }

  if (returnForm.quantity > selectedProduct.value.quantity) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Нельзя вернуть больше, чем есть на остатке',
      life: 3000,
    });
    return;
  }

  try {
    await returnsStore.createReturn({
      productId: selectedProduct.value.id,
      quantity: returnForm.quantity,
      reason: returnForm.reason,
    });

    toast.add({
      severity: 'success',
      summary: 'Успешно',
      detail: 'Возврат успешно оформлен',
      life: 3000,
    });

    closeReturnDialog();
    await productsStore.fetchProducts();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось оформить возврат',
      life: 3000,
    });
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

const exportToCSV = () => {
  const products = selectedProducts.value.length > 0 ? selectedProducts.value : productsStore.products;
  
  if (products.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Предупреждение',
      detail: 'Нет данных для экспорта',
      life: 3000,
    });
    return;
  }

  const headers = ['Название', 'Артикул', 'Категория', 'Цена закупки', 'Цена продажи', 'Количество', 'Мин. запас', 'Описание'];
  const rows = products.map((product) => [
    product.name,
    product.sku,
    product.category?.name || '',
    product.purchasePrice.toString(),
    product.salePrice.toString(),
    product.quantity.toString(),
    product.minStockLevel.toString(),
    product.description || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `products_${new Date().toISOString().split('T')[0]}.csv`);

  toast.add({
    severity: 'success',
    summary: 'Успешно',
    detail: 'Данные экспортированы в CSV',
    life: 3000,
  });
};

const exportToExcel = () => {
  // Для полноценного Excel нужна библиотека xlsx, но для простоты используем CSV
  exportToCSV();
  toast.add({
    severity: 'info',
    summary: 'Информация',
    detail: 'Excel экспорт использует CSV формат',
    life: 3000,
  });
};

onMounted(async () => {
  await categoriesStore.fetchCategories();
  await warehousesStore.fetchWarehouses();
  await committeesStore.fetchCommittees();
  await transactionTypesStore.fetchTransactionTypes();
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
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.search-item {
  grid-column: span 1;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-image {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.product-name {
  font-weight: 500;
  color: var(--text-color);
}

.low-stock {
  color: var(--orange-500);
  font-weight: 600;
}

.out-of-stock {
  color: var(--red-500);
  font-weight: 600;
}

.products-table :deep(.p-datatable-tbody > tr) {
  transition: background-color 0.2s ease;
}

.products-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--surface-hover);
}

.products-table :deep(.p-datatable-tbody > tr:nth-child(even)) {
  background-color: var(--surface-50);
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

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
  min-height: 300px;
}

.char-count {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.upload-zone {
  border: 2px dashed var(--surface-border);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: var(--surface-50);
  transition: all 0.2s ease;
  cursor: pointer;
}

.upload-zone:hover {
  border-color: var(--primary-color);
  background: var(--surface-100);
}

.upload-zone p {
  margin: 1rem 0;
  color: var(--text-color-secondary);
}

.images-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.image-item {
  position: relative;
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-card);
  transition: transform 0.2s ease;
}

.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--surface-ground);
}

.text-muted {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
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
