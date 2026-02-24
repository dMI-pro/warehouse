<template>
  <div class="products">
    <div class="page-header">
      <h1 class="page-title">Товары</h1>
      <div v-if="authStore.isAdmin || authStore.isManager" class="header-actions">
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
          <div class="filter-item" v-if="isAdminOrManager">
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
              :label="inStockOnly ? 'В наличии: включено' : 'В наличии'"
              :icon="inStockOnly ? 'pi pi-check' : 'pi pi-box'"
              :severity="inStockOnly ? 'success' : 'secondary'"
              :outlined="!inStockOnly"
              @click="toggleInStock"
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
          :lazy="true"
          :paginator="true"
          v-model:rows="productsStore.pagination.limit"
          :totalRecords="productsStore.pagination.total"
          :first="(productsStore.pagination.page - 1) * productsStore.pagination.limit"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} - {last} из {totalRecords}"
          :emptyMessage="productsStore.loading ? 'Загрузка...' : 'Нет товаров'"
          class="products-table"
          dataKey="id"
          @page="onPageChange"
        >
          <!-- Колонка выбора -->
          <!-- <Column selectionMode="multiple" headerStyle="width: 3rem" /> -->
          
          <!-- Динамические колонки на основе конфигурации -->
          <Column
            v-for="column in tableColumns"
            :key="column.field || column.header"
            :field="column.field"
            :header="column.header"
            :sortable="column.sortable"
            :style="column.style"
            :headerStyle="column.headerStyle"
          >
            <template #body="{ data }">
              <!-- Обработка кастомных шаблонов -->
              <template v-if="column.template">
                <!-- Изображение -->
                <template v-if="column.template === 'image'">
                  <img
                    v-if="data.images && data.images.length > 0"
                    :src="getImageUrl(data.images[0])"
                    :alt="data.name"
                    class="product-image"
                  />
                  <span v-else class="no-image">Нет фото</span>
                </template>
                
                <!-- Название товара (кликабельное) -->
                <template v-else-if="column.template === 'productName'">
                  <span class="product-name" @click="openProductDetails(data.id)">{{ data.name }}</span>
                </template>
                
                <!-- Категория с тегом -->
                <template v-else-if="column.template === 'category'">
                  <Tag 
                    :value="getCategoryBreadcrumb(data.category)" 
                    severity="info" 
                  />
                </template>
                
                <!-- Цена с форматированием -->
                <template v-else-if="column.template === 'price'">
                  {{ column.field ? formatPrice((data as any)[column.field]) : '' }}
                </template>
                
                <!-- Количество с цветовой индикацией -->
                <template v-else-if="column.template === 'quantity'">
                  <span
                    :class="{
                      'low-stock': data.quantity < data.minStockLevel,
                      'out-of-stock': data.quantity === 0,
                    }"
                  >
                    {{ data.quantity }}
                  </span>
                </template>
                
                <!-- Склад -->
                <template v-else-if="column.template === 'warehouse'">
                  <Tag :value="data.warehouse?.name || 'Не указан'" severity="secondary" />
                  <!-- <span class="product-warehouse">{{ data.warehouse?.name }}</span> -->
                </template>
                
                <!-- Коммитет -->
                <template v-else-if="column.template === 'committee'">
                  <template v-if="data.committee">
                    <span
                      v-if="isAdmin"
                      class="product-committee" 
                      @click="openCommitteeDetails(data.committee?.id)"
                    >
                      {{ data.committee?.name }}
                    </span>
                    <span v-else>
                      {{ data.committee?.name }}
                    </span>
                  </template>
                  <span v-else>Не указан</span>
                </template>
                
                <!-- Тип транзакции -->
                <template v-else-if="column.template === 'transactionType'">
                  <Badge 
                    :value="data.transactionType?.name || 'Не указан'" 
                    :severity="getTransactionTypeSeverity(data.transactionType?.name)"
                  />
                </template>
                
                <!-- Действия -->
                <template v-else-if="column.template === 'actions'">
                  <div class="action-buttons">
                    <Button
                      v-if="isAdminOrManager"
                      icon="pi pi-pencil"
                      severity="info"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Редактировать'"
                      @click="openEditDialog(data)"
                    />
                    <Button
                      v-if="isAdminOrManager"
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Удалить'"
                      @click="confirmDelete(data)"
                    />
                    <Button
                      v-if="!isGuest"
                      icon="pi pi-shopping-cart"
                      severity="success"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Продать'"
                      @click="openSaleDialog(data)"
                    />
                    <Button
                      v-if="isAdminOrManager"
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
              </template>
              
              <!-- Простое отображение поля -->
              <template v-else>
                {{ column.field ? (data as any)[column.field] : '' }}
              </template>
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
      :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
      maximizable
      @hide="closeDialog"
    >
      <form @submit.prevent="saveProduct" class="product-form">
        <TabView>
          <!-- Вкладка 1: Основная информация -->
          <TabPanel header="Основная информация" value="main">
            <div class="tab-content">
              <div class="field">
                <label for="name" class="label">Название товара *</label>
                <InputText id="name" v-model="productForm.name" class="w-full" required />
                <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
              </div>

              <div class="field">
                <label for="sku" class="label">Артикул *</label>
                <div class="field__group">
                  <InputText id="sku" v-model="productForm.sku" class="w-full mb-2" required />
                  <Button icon="pi pi-sparkles" label='Автоартикул' @click="generateSku" v-tooltip.top="'Сгенерировать артикул автоматически'" severity="secondary" />
                </div>
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
          <TabPanel header="Цены и количество" value="pricing">
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
          <TabPanel header="Изображения" value="images">
            <div class="tab-content">
              <div class="field">
                <label class="label">Загрузка изображений</label>
                <div class="upload-zone" @drop.prevent="handleDrop" @dragover.prevent @dragenter.prevent>
                  <i class="pi pi-cloud-upload" style="font-size: 3rem; color: var(--primary-color)"></i>
                  <p>Перетащите изображения сюда или</p>
                  <FileUpload
                    mode="basic"
                    accept="image/*"
                    :maxFileSize="52428800"
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
          <TabPanel header="Дополнительные поля" value="extra">
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

        <QuantityInput
          v-model="saleForm.quantity"
          :available-quantity="selectedProduct?.quantity || 0"
          :label="'Количество к продаже'"
          :available-label="'Доступно'"
          :required="true"
          :min="1"
          :show-available-field="true"
          ref="saleQuantityInputRef"
        />

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
          <!-- <div v-if="selectedProduct?.transactionType?.name === 'Комиссия'" class="mt-2">
            <Button
              label="с 20% надбавкой"
              size="small"
              severity="info"
              v-tooltip.top="'Установить цену: продажи × 1.25'"
              @click="applyCommissionMarkup"
            />
          </div> -->
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

        <QuantityInput
          v-model="returnForm.quantity"
          :available-quantity="selectedProduct?.quantity || 0"
          :label="'Количество к возврату'"
          :available-label="'Доступно'"
          :required="true"
          :min="1"
          :show-available-field="true"
          ref="returnQuantityInputRef"
        />

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

        <div class="field" v-if="authStore.isAdmin">
          <label for="soldAt" class="label">Дата возврат</label>
          <Calendar
            id="soldAt"
            v-model="returnForm.returnedAt"
            dateFormat="yy-mm-dd"
            showIcon
            showTime
            hourFormat="24"
            class="w-full"
          />
          <small class="text-gray-500">По умолчанию: сейчас</small>
        </div>

        <div class="dialog-footer">
          <Button label="Отмена" severity="secondary" outlined @click="closeReturnDialog" />
          <Button type="submit" label="Оформить возврат" severity="warning" :loading="returnsStore.loading" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { storeToRefs } from 'pinia';
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
import Badge from 'primevue/badge';
import Message from 'primevue/message';
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
import { exportExcelTable, type ExcelColumn } from '@/utils/excelExport';
import { getDefaultTemplate } from '@/utils/exportTemplates';

import QuantityInput from '@/components/forms/QuantityInput.vue';

const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();
const salesStore = useSalesStore();
const returnsStore = useReturnsStore();
const authStore = useAuthStore();
const warehousesStore = useWarehousesStore();
const committeesStore = useCommitteesStore();
const transactionTypesStore = useTransactionTypesStore();
const confirm = useConfirm();
const toast = useToast();
const router = useRouter();

const searchQuery = ref('');
const selectedCategory = ref<number | null>(null);
const selectedWarehouse = ref<number | null>(null);
const selectedCommittee = ref<number | null>(null);
const inStockOnly = ref(false);
const sortField = ref('name');
const productDialogVisible = ref(false);
const saleDialogVisible = ref(false);
const returnDialogVisible = ref(false);
const editingProduct = ref<Product | null>(null);
const selectedProduct = ref<Product | null>(null);
const selectedProducts = ref<Product[]>([]);
const pendingFiles = ref<File[]>([]);

const generateSku = async () => {
  try {
    const response = await apiService.getLastSku();
    const lastSku = response.sku;
    
    if (!lastSku) {
      productForm.sku = '0001';
      return;
    }
    
    // Если артикул состоит только из цифр
    if (/^\d+$/.test(lastSku)) {
      const num = parseInt(lastSku, 10);
      const nextNum = num + 1;
      // Форматируем в 4 знака (0001, 0002 и т.д.)
      productForm.sku = nextNum.toString().padStart(4, '0');
      return;
    }
    
    // Если артикул смешанный (например ITEM-100), пробуем извлечь число из конца
    const match = lastSku.match(/(\d+)$/);
    if (match && match[1]) {
      const numberPart = match[1];
      const prefix = lastSku.slice(0, -numberPart.length);
      const newNumber = parseInt(numberPart, 10) + 1;
      // Сохраняем длину числовой части, но не менее длины предыдущего числа
      const newNumberStr = newNumber.toString().padStart(numberPart.length, '0');
      productForm.sku = `${prefix}${newNumberStr}`;
    } else {
      // Fallback
      productForm.sku = `${lastSku}-1`;
    }
  } catch (error) {
    console.error('Failed to generate SKU', error);
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось сгенерировать артикул', life: 3000 });
  }
};

// Ref для компонента Доступно и ввода количества QuantityInput.vue
const availableQuantity = ref<number>(0); // количество на СКЛАДЕ
const quantityInputRef = ref<InstanceType<typeof QuantityInput> | null>(null);

const requestQuantity = ref<number>(0); // количество в заявке продаже/возврате

// Интерфейс для конфигурации колонок
interface TableColumn {
  field?: string;
  header: string;
  sortable?: boolean;
  style?: string;
  headerStyle?: string;
  template?: 'image' | 'productName' | 'category' | 'price' | 'quantity' | 'warehouse' | 'committee' | 'transactionType' | 'actions';
  format?: 'price' | 'date';
}

type ProductForm = Omit<CreateProductDto, 'arrivalDate' | 'images'> & {
  arrivalDate?: Date;
  images: string[];
};

const productForm = reactive<ProductForm>({
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

const returnForm = reactive({
  quantity: 1,
  reason: '',
  returnedAt: new Date(),
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
  const options: { label: string; value: number | null }[] = [{ label: 'Все категории', value: null }];
  
  // Используем flatCategoriesLabels из стора для отображения иерархии (С — 84 проба)
  if (categoriesStore.flatCategoriesLabels) {
    options.push(...categoriesStore.flatCategoriesLabels);
  } else {
    // Fallback если flatCategoriesLabels недоступен
    categoriesStore.categories.forEach((cat) => {
      options.push({ label: cat.name, value: cat.id });
    });
  }
  
  return options;
});

const warehouseOptions = computed(() => {
  const options: { label: string; value: number | null }[] = [{ label: 'Все склады', value: null }];
  warehousesStore.warehouses.forEach((wh) => {
    options.push({ label: wh.name, value: wh.id });
  });
  return options;
});

const committeeOptions = computed(() => {
  const options: { label: string; value: number | null }[] = [{ label: 'Все коммитеты', value: null }];
  committeesStore.committees.forEach((com) => {
    options.push({ label: com.name, value: com.id });
  });
  return options;
});

const transactionTypeOptions = computed(() => {
  const options: { label: string; value: number | undefined }[] = [{ label: 'Без типа', value: undefined }];
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

// Используем геттеры из authStore для определения ролей
const { isAdmin, isAdminOrManager, isSeller, isGuest } = storeToRefs(authStore);

// Конфигурация колонок таблицы
const tableColumns = computed<TableColumn[]>(() => {
  const columns: TableColumn[] = [
    { 
      header: 'Изображение', 
      style: 'width: 100px',
      template: 'image'
    },
    { 
      field: 'name', 
      header: 'Название', 
      sortable: true,
      template: 'productName'
    },
    { 
      field: 'sku', 
      header: 'Артикул', 
      sortable: true 
    },
    { 
      header: 'Категория',
      template: 'category'
    },
    { 
      field: 'salePrice', 
      header: 'Цена продажи', 
      sortable: true,
      template: 'price'
    },
    { 
      field: 'quantity', 
      header: 'Кол-во', 
      sortable: true,
      template: 'quantity'
    },
    { 
      header: 'Склад',
      template: 'warehouse',
      // sortable: true, // проблема описана в заметках на айфоне
    },
    { 
      header: 'Коммитет',
      template: 'committee',
      // sortable: true, // проблема описана в заметках на айфоне
    },
    { 
      header: 'Тип транзакции',
      template: 'transactionType',
      // sortable: true, // проблема описана в заметках на айфоне
    },
    { 
      header: 'Действия', 
      style: 'width: 180px',
      template: 'actions'
    },
  ];

  return columns.filter(col => {
    // Скрываем колонки "Коммитет" и "Тип транзакции" для продавца и гостя
    if ((isSeller.value || isGuest.value) && (col.template === 'committee' || col.template === 'transactionType')) {
      return false;
    }
    // Скрываем колонку действий для гостя (так как все действия недоступны)
    if (isGuest.value && col.template === 'actions') {
      return false;
    }
    return true;
  });
});

// Вспомогательная функция для определения цвета типа транзакции
const getTransactionTypeSeverity = (transactionTypeName?: string) => {
  if (!transactionTypeName) return 'secondary';
  
  const type = transactionTypeName.toLowerCase();
  if (type.includes('комиссия')) return 'info';
  if (type.includes('выкуп')) return 'success';
  if (type.includes('продажа')) return 'contrast';
  
  return 'secondary';
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const openProductDetails = (id: number) => {
  router.push({ name: 'product-details', params: { id } });
};

const openCommitteeDetails = (id: number) => {
  router.push({ name: 'committee-details', params: { id } });
};

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return '';
  
  // Если это уже полный URL
  if (imagePath.startsWith('http')) {
    // Исправление для внутренней сети Docker: заменяем minio:9000 на текущий хост
    if (imagePath.includes('minio:9000')) {
      return imagePath.replace('minio:9000', `${window.location.hostname}:9000`);
    }
    return imagePath;
  }
  
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
  inStockOnly.value = false;
  sortField.value = 'name';
  productsStore.setFilters({ search: '', category: undefined, warehouse: undefined, committee: undefined, inStock: false });
  productsStore.setPage(1);
  productsStore.fetchProducts();
};

const getCategoryBreadcrumb = (category: any) => {
  if (!category) return 'Без категории';
  
  // Если у нас уже есть загруженные категории в store, используем их для построения полного пути
  if (categoriesStore.categories.length > 0) {
    const path: string[] = [];
    let currentId: number | null = category.id;
    
    // Ограничитель цикла на всякий случай
    let depth = 0; 
    while (currentId !== null && depth < 10) {
      // Используем categoriesMap для поиска по всему дереву (включая вложенные категории)
      const cat = categoriesStore.categoriesMap.get(Number(currentId));
      if (cat) {
        path.unshift(cat.name);
        currentId = cat.parentId ?? null;
      } else {
        // Если категорию не нашли в store, но это была исходная категория, добавим ее имя и выйдем
        if (path.length === 0) path.push(category.name);
        break;
      }
      depth++;
    }
    
    return path.join(' > ');
  }
  
  // Fallback: если store пуст, пытаемся использовать вложенность из самого объекта
  if (category.parent) {
      return `${category.parent.name} > ${category.name}`;
  }
  return category.name;
};

const onPageChange = (event: any) => {
  productsStore.setPage(event.page + 1);
  productsStore.pagination.limit = event.rows;
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
  pendingFiles.value = [];
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
        purchasePrice: Number(productForm.purchasePrice),
        salePrice: Number(productForm.salePrice),
        quantity: Number(productForm.quantity),
        minStockLevel: Number(productForm.minStockLevel),
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
        purchasePrice: Number(productForm.purchasePrice),
        salePrice: Number(productForm.salePrice),
        quantity: Number(productForm.quantity),
        minStockLevel: Number(productForm.minStockLevel),
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
        const compressed = await compressImageFile(file, { useWebWorker: false });
        const product = await productsStore.uploadImage(editingProduct.value.id, compressed);
        if (product.images) {
          productForm.images = [...product.images];
        }
      } else {
        // Для нового товара сохраняем файлы для загрузки после создания
        const compressed = await compressImageFile(file, { useWebWorker: false });
        pendingFiles.value.push(compressed);
        
        // Создаем превью
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            productForm.images = [...(productForm.images || []), e.target.result];
          }
        };
        reader.readAsDataURL(compressed);
      }
    } catch (error) {
      const backendMessage = (error as any)?.response?.data?.message;
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: backendMessage || 'Не удалось загрузить изображение',
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
    const image: string = productForm.images![index] as string;
    productForm.images.splice(index, 1);
    productForm.images!.unshift(image as string);
    
    // Если есть отложенные файлы (при создании), меняем их порядок тоже
    if (pendingFiles.value.length > index && pendingFiles.value.length === productForm.images.length) {
      const file = pendingFiles.value[index];
      if (file) {
        pendingFiles.value.splice(index, 1);
        pendingFiles.value.unshift(file);
      }
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

  // Проверяем валидность через компонент
  if (quantityInputRef.value) {
    const isValid = quantityInputRef.value.validate();
    if (!isValid) {
      toast.add({ 
        severity: 'error', 
        summary: 'Ошибка', 
        detail: 'Пожалуйста, проверьте количество', 
        life: 3000 
      });
      return;
    }
  }

  saleFormErrors.quantity = '';
  
  // две проверки ниже нужны, после проверить и удалить
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
  returnForm.returnedAt = new Date();
  returnDialogVisible.value = true;
};

const closeReturnDialog = () => {
  returnDialogVisible.value = false;
  selectedProduct.value = null;
  returnForm.quantity = 1;
  returnForm.reason = '';
  returnForm.returnedAt = new Date();
};

const handleReturn = async () => {
  if (!selectedProduct.value) return;

  // Проверяем валидность через компонент
  if (quantityInputRef.value) {
    const isValid = quantityInputRef.value.validate();
    if (!isValid) {
      toast.add({ 
        severity: 'error', 
        summary: 'Ошибка', 
        detail: 'Пожалуйста, проверьте количество', 
        life: 3000 
      });
      return;
    }
  }

  // две проверки ниже нужны, после проверить и удалить
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
      returnedAt: returnForm.returnedAt.toISOString(),
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
  const products = selectedProducts.value.length > 0 ? selectedProducts.value : productsStore.products;
  if (products.length === 0) {
    toast.add({ severity: 'warn', summary: 'Предупреждение', detail: 'Нет данных для экспорта', life: 3000 });
    return;
  }

  const template = getDefaultTemplate('products');

  const mappedRows = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    categoryName: p.category?.name || '',
    purchasePrice: Number(p.purchasePrice),
    salePrice: Number(p.salePrice),
    quantity: p.quantity,
    minStockLevel: p.minStockLevel || 0,
    warehouseName: p.warehouse?.name || '',
    committeeName: p.committee?.name || '',
    transactionTypeName: p.transactionType?.name || '',
    arrivalDate: p.arrivalDate || null,
    images: p.images || [],
  }));

  const allColumns: ExcelColumn[] = [
    { key: 'id', header: 'ID', type: 'number' },
    { key: 'name', header: 'Название', type: 'string' },
    { key: 'sku', header: 'Артикул', type: 'string' },
    { key: 'categoryName', header: 'Категория', type: 'string' },
    { key: 'purchasePrice', header: 'Цена закупки', type: 'number' },
    { key: 'salePrice', header: 'Цена продажи', type: 'number' },
    { key: 'quantity', header: 'Количество', type: 'number' },
    { key: 'minStockLevel', header: 'Мин. запас', type: 'number' },
    { key: 'warehouseName', header: 'Склад', type: 'string' },
    { key: 'committeeName', header: 'Комитет', type: 'string' },
    { key: 'transactionTypeName', header: 'Тип транзакции', type: 'string' },
    { key: 'arrivalDate', header: 'Дата поступления', type: 'date' },
    { key: 'images', header: 'Изображение', type: 'url' },
  ];

  const selectedColumns = template?.columns?.length
    ? allColumns.filter((c) => template.columns!.includes(c.key))
    : allColumns;

  exportExcelTable(selectedColumns, mappedRows, {
    totals: true,
    tableName: 'Products',
    imageFields: ['images'],
    fileName: `products_${new Date().toISOString().split('T')[0]}.xlsx`,
    linkResolver: (value, key) => {
      if (key === 'images') {
        if (!value) return null;
        if (typeof value === 'string') return value;
        if (Array.isArray(value) && value[0]) return value[0];
        return null;
      }
      if (typeof value === 'string') return value;
      return null;
    },
  }).then(() => {
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Данные экспортированы в Excel', life: 3000 });
  }).catch(() => {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось экспортировать в Excel', life: 3000 });
  });
};

onMounted(async () => {
  await categoriesStore.fetchCategories();
  await warehousesStore.fetchWarehouses();
  await committeesStore.fetchCommittees();
  await transactionTypesStore.fetchTransactionTypes();
  
  // Сначала загружаем товары (используя сохраненные в сторе фильтры)
  await productsStore.fetchProducts();

  // ВОССТАНОВЛЕНИЕ UI ИЗ STORE (Подзадача 1)
  // Синхронизируем локальные v-model с состоянием в store, чтобы фильтры не сбрасывались визуально
  if (productsStore.filters.search) searchQuery.value = productsStore.filters.search;
  if (productsStore.filters.category) selectedCategory.value = productsStore.filters.category;
  if (productsStore.filters.warehouse) selectedWarehouse.value = productsStore.filters.warehouse;
  if (productsStore.filters.committee) selectedCommittee.value = productsStore.filters.committee;
  if (productsStore.filters.inStock) inStockOnly.value = productsStore.filters.inStock;
});

const toggleInStock = async () => {
  inStockOnly.value = !inStockOnly.value;
  productsStore.setFilters({ inStock: inStockOnly.value });
  await productsStore.fetchProducts({ page: 1 });
};
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

.product-name,
.product-committee {
  color: var(--primary-color);
  font-weight: 500;
  /* text-decoration: underline; */
  cursor: pointer;
}

.low-stock {
  color: var(--warning-color);
  text-decoration: underline;
  font-weight: 600;
}

.out-of-stock {
  color: var(--error-color);
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
  gap: 1rem;
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
