<template>
  <div class="product-details-view p-4">
    <!-- Кнопка назад -->
    <div class="mb-4">
      <Button 
        label="Назад к списку" 
        icon="pi pi-arrow-left"
        severity="contrast"
        class="p-button-text p-button-sm"
        @click="router.push({ name: 'products' })" 
      />
    </div>

    <!-- Состояние загрузки -->
    <div v-if="productsStore.loading && !product" class="flex justify-content-center align-items-center" style="min-height: 400px;">
      <ProgressSpinner />
    </div>

    <!-- Товар не найден -->
    <div v-else-if="!product && !productsStore.loading" class="text-center py-6">
      <div class="inline-flex align-items-center justify-content-center border-circle bg-gray-100 mb-3" style="width: 64px; height: 64px;">
        <i class="pi pi-box text-2xl text-gray-400"></i>
      </div>
      <h3 class="text-xl font-semibold text-gray-600 mb-2">Товар не найден</h3>
      <p class="text-gray-500 mb-4">Запрашиваемый товар не существует или был удален</p>
      <Button 
        label="Вернуться к списку товаров" 
        icon="pi pi-arrow-left" 
        @click="router.push({ name: 'products' })"
      />
    </div>

    <!-- Контент товара -->
    <div v-else-if="product">
      <!-- Шапка товара -->
      <div class="surface-card p-4 shadow-2 mb-4 border-round">
        <div class="flex flex-column md:flex-row md:align-items-center justify-content-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-900">{{ product.name }}</h1>
            <div class="flex align-items-center gap-3 mt-2">
              <span v-if="authStore.isAdmin" class="text-sm text-600">ID: {{ product.id }}</span>
              <span v-if="authStore.isAdmin" class="text-sm text-600">•</span>
              <span class="text-sm text-600">Артикул: {{ product.sku }}</span>
              <Tag 
                v-if="categoryPath"
                :value="categoryPath"
                severity="info"
                class="ml-2"
              />
            </div>
          </div>
          <div class="flex align-items-center gap-4">
            <div class="text-right">
              <div class="text-sm text-600">На складе</div>
              <div class="text-xl font-bold" :class="{
                'text-green-500': product.quantity > (product.minStockLevel || 0),
                'text-yellow-500': product.quantity > 0 && product.quantity <= (product.minStockLevel || 0),
                'text-red-500': product.quantity === 0
              }">
                {{ product.quantity }} шт.
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-600">Цена продажи</div>
              <div class="text-xl font-bold text-900">{{ formatPrice(product.salePrice) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Основная сетка контента -->
      <div class="grid mt-4">
        <!-- Секция изображений -->
        <div class="col-12 lg:col-6">
          <Card class="h-full">
            <template #title>
              <div class="flex justify-content-between align-items-center">
                <span class="font-semibold">Фотографии товара</span>
                <div v-if="canEdit" class="flex align-items-center gap-2">
                  <span v-if="productsStore.isUploading(productId)" class="text-sm text-primary flex align-items-center gap-2">
                    <i class="pi pi-spin pi-spinner"></i>
                    Загрузка...
                  </span>
                  <FileUpload
                    mode="basic"
                    name="image"
                    :auto="false"
                    chooseLabel="Добавить фото"
                    accept="image/*"
                    :maxFileSize="10485760"
                    :multiple="true"
                    customUpload
                    @select="onUploadImage"
                    class="p-button-sm custom-upload-button"
                    :disabled="productsStore.isUploading(productId)"
                  />
                </div>
              </div>
            </template>
            <template #content>
              <Message v-if="productsStore.isUploading(productId)" severity="info" :closable="false" class="mb-3">
                Изображения загружаются. Пожалуйста, подождите.
              </Message>
              <!-- Галерея -->
              <div v-if="product.images && product.images.length > 0">
                <!-- Основная галерея -->
                <div class="mb-4">
                  <Galleria
                    :value="product.images"
                    :numVisible="5"
                    containerStyle="max-width: 100%"
                    :showThumbnails="true"
                    :showIndicators="true"
                    :circular="true"
                    :autoPlay="false"
                    :showItemNavigators="product.images.length > 1"
                  >
                    <template #item="slotProps">
                      <div class="gallery-main-image">
                        <img
                          :src="getFullImageUrl(slotProps.item)"
                          :alt="product.name"
                          class="gallery-image"
                          @error="handleImageError"
                        />
                      </div>
                    </template>
                    <template #thumbnail="slotProps">
                      <div class="gallery-thumbnail">
                        <img
                          :src="getFullImageUrl(slotProps.item)"
                          :alt="product.name"
                          class="thumbnail-image"
                          @error="handleImageError"
                        />
                        <div v-if="slotProps.item === product.images[0]" class="main-image-indicator">
                          <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
                        </div>
                      </div>
                    </template>
                  </Galleria>
                </div>

                <!-- Управление изображениями -->
                <div v-if="canEdit" class="image-management">
                  <h3 class="text-lg font-medium mb-2 text-700">Управление изображениями</h3>
                  <p class="text-sm text-600 mb-4">Перетащите для изменения порядка, первое изображение будет главным</p>
                  
                  <OrderList 
                    v-model="wrappedImages" 
                    listStyle="height:auto; max-height: 300px;" 
                    dataKey="url"
                    dragdrop
                  >
                    <template #item="slotProps">
                      <div class="image-list-item">
                        <div class="image-preview">
                          <img 
                            :src="getFullImageUrl(slotProps.item.url)" 
                            class="image-preview-img"
                            @error="handleImageError"
                          />
                          <div v-if="slotProps.item.url === wrappedImages[0]?.url" class="main-image-badge">
                            <i class="pi pi-star-fill text-yellow-500 text-xs"></i>
                          </div>
                        </div>
                        <div class="image-info">
                          <p class="image-filename">{{ getFileName(slotProps.item.url) }}</p>
                          <p class="image-position">Позиция {{ getImageIndex(slotProps.item.url) }}</p>
                        </div>
                        <div class="image-actions">
                          <Button
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            rounded
                            size="small"
                            @click="confirmDeleteImage(slotProps.item.url)"
                          />
                        </div>
                      </div>
                    </template>
                  </OrderList>

                  <div class="flex justify-content-end gap-2 mt-3 pt-3 border-top-1 surface-border">
                    <Button 
                      label="Отменить" 
                      severity="secondary" 
                      size="small"
                      @click="syncImages"
                      :disabled="!orderChanged"
                    />
                    <Button 
                      label="Сохранить порядок" 
                      icon="pi pi-check" 
                      size="small" 
                      @click="saveImageOrder" 
                      :loading="savingOrder"
                      :disabled="!orderChanged"
                    />
                  </div>
                </div>
              </div>

              <!-- Состояние без изображений -->
              <div v-else class="empty-images">
                <div class="empty-images-icon">
                  <i class="pi pi-image text-3xl text-gray-400"></i>
                </div>
                <h4 class="empty-images-title">Нет изображений</h4>
                <p class="empty-images-description">Добавьте фотографии товара для лучшего представления</p>
                <FileUpload
                  v-if="canEdit"
                  mode="basic"
                  name="image"
                  :auto="false"
                  chooseLabel="Добавить первое фото"
                  accept="image/*"
                    :maxFileSize="52428800"
                  customUpload
                  @select="onUploadImage"
                  class="p-button-outlined mt-4 custom-upload-button"
                  :disabled="productsStore.isUploading(productId)"
                />
              </div>
            </template>
          </Card>
        </div>

        <!-- Секция деталей товара -->
        <div class="col-12 lg:col-6">
          <Card>
            <template #title>
              <span class="font-semibold">Информация о товаре</span>
            </template>
            <template #content>
              <form @submit.prevent="saveProduct" class="product-form">
                <!-- Основная информация -->
                <div class="mb-4">
                  <h4 class="text-lg font-semibold mb-3 text-900">Основная информация</h4>
                  <div class="grid formgrid">
                    <div class="field col-12 md:col-6">
                      <label for="name" class="block mb-2 font-medium">
                        Название товара <span class="text-red-500">*</span>
                      </label>
                      <InputText 
                        id="name" 
                        v-model="form.name" 
                        class="w-full" 
                        :disabled="!canEdit"
                        placeholder="Введите название"
                      />
                    </div>

                    <div class="field col-12 md:col-6">
                      <label for="sku" class="block mb-2 font-medium">
                        Артикул <span class="text-red-500">*</span>
                      </label>
                      <InputText 
                        id="sku" 
                        v-model="form.sku" 
                        class="w-full" 
                        :disabled="!canEdit"
                        placeholder="Введите артикул"
                      />
                    </div>

                    <div class="field col-12">
                      <label for="description" class="block mb-2 font-medium">
                        Описание
                      </label>
                      <Textarea
                        id="description"
                        v-model="form.description"
                        rows="4"
                        class="w-full"
                        :disabled="!canEdit"
                        placeholder="Опишите товар..."
                        :maxlength="1000"
                      />
                      <div class="flex justify-content-between mt-2">
                        <span class="text-sm text-600">Максимум 1000 символов</span>
                        <span class="text-sm text-600">{{ (form.description || '').length }}/1000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Цены и остатки -->
                <div class="surface-ground p-4 border-round-lg mb-4">
                  <h4 class="text-lg font-semibold mb-3 text-900">Цены и остатки</h4>
                  <div class="grid formgrid">
                    <div class="field col-12 md:col-6">
                      <label for="salePrice" class="block mb-2 font-medium">Цена продажи</label>
                      <InputNumber
                        id="salePrice"
                        v-model="form.salePrice"
                        mode="currency"
                        currency="RUB"
                        locale="ru-RU"
                        class="w-full"
                        :disabled="!canEdit"
                        :min="0"
                      />
                    </div>

                    <div class="field col-12 md:col-6">
                      <label for="quantity" class="block mb-2 font-medium">Количество на складе</label>
                      <InputNumber
                        id="quantity"
                        v-model="form.quantity"
                        class="w-full"
                        :disabled="!canEdit"
                        :min="0"
                      />
                    </div>

                    <div class="field col-12 md:col-6" v-if="isAdminOrManager">
                      <label for="purchasePrice" class="block mb-2 font-medium">Цена закупки</label>
                      <InputNumber
                        id="purchasePrice"
                        v-model="form.purchasePrice"
                        mode="currency"
                        currency="RUB"
                        locale="ru-RU"
                        class="w-full"
                        :disabled="!canEdit"
                        :min="0"
                      />
                    </div>

                    <div class="field col-12 md:col-6" v-if="isAdminOrManager">
                      <label for="minStockLevel" class="block mb-2 font-medium">Минимальный остаток</label>
                      <InputNumber
                        id="minStockLevel"
                        v-model="form.minStockLevel"
                        class="w-full"
                        :disabled="!canEdit"
                        :min="0"
                      />
                    </div>
                  </div>
                </div>

                <!-- Категоризация -->
                <div class="surface-ground p-4 border-round-lg mb-4">
                  <h4 class="text-lg font-semibold mb-3 text-900">Категоризация</h4>
                  <div class="grid formgrid">
                    <div class="field col-12">
                      <label for="categoryId" class="block mb-2 font-medium">Категория</label>
                      <Dropdown 
                        id="categoryId"
                        v-model="form.categoryId" 
                        :options="categoryOptions"
                        optionLabel="label" 
                        optionValue="value" 
                        class="w-full" 
                        :disabled="!canEdit"
                        placeholder="Выберите категорию"
                        :filter="true"
                      />
                    </div>

                    <div class="field col-12 md:col-6">
                      <label for="warehouseId" class="block mb-2 font-medium">Склад</label>
                      <Dropdown
                        id="warehouseId"
                        v-model="form.warehouseId"
                        :options="warehouseOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        :disabled="!canEdit"
                        placeholder="Выберите склад"
                      />
                    </div>

                    <div class="field col-12 md:col-6" v-if="isAdminOrManager">
                      <label for="committeeId" class="block mb-2 font-medium">Комитет</label>
                      <Dropdown
                        id="committeeId"
                        v-model="form.committeeId"
                        :options="committeeOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        :disabled="!canEdit"
                        placeholder="Выберите комитет"
                      />
                    </div>

                    <div class="field col-12" v-if="isAdminOrManager">
                      <label for="transactionTypeId" class="block mb-2 font-medium">Тип транзакции</label>
                      <Dropdown
                        id="transactionTypeId"
                        v-model="form.transactionTypeId"
                        :options="transactionTypeOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        :disabled="!canEdit"
                        placeholder="Выберите тип транзакции"
                      />
                    </div>
                  </div>
                </div>

                <!-- Кнопка сохранения -->
                <div v-if="canEdit" class="flex justify-content-end gap-3 pt-4 border-top-1 surface-border">
                  <Button
                    type="button"
                    label="Отменить"
                    severity="secondary"
                    @click="populateForm"
                    :disabled="!isFormChanged"
                  />
                  <Button
                    type="submit"
                    label="Сохранить изменения"
                    icon="pi pi-save"
                    :loading="saving"
                    :disabled="!isFormChanged"
                  />
                </div>
              </form>
            </template>
          </Card>
        </div>
      </div>
      <div class="mt-4" v-if="isAdminOrManager">
        <Card>
          <template #title>
            <span class="font-semibold">История действий</span>
          </template>
          <template #content>
            <div v-if="logsLoading" class="flex justify-content-center align-items-center" style="min-height: 150px;">
              <ProgressSpinner />
            </div>
            <div v-else-if="productLogs.length === 0" class="text-center py-4 text-600">
              Нет записей истории для этого товара
            </div>
            <div v-else>
              <DataTable
                :value="productLogs"
                :paginator="false"
                class="audit-table"
                :rows="10"
                :scrollable="true"
                scrollHeight="300px"
              >
                <Column header="Время" style="width: 160px">
                  <template #body="{ data }">
                    {{ formatDateTime((data as any).createdAt) }}
                  </template>
                </Column>
                <Column header="Пользователь" style="width: 220px">
                  <template #body="{ data }">
                    <span
                      v-if="data.user"
                      :class="['history-actor', { 'self-actor': isCurrentUserActor(data.user) }]"
                    >
                      {{ getActorDisplayName(data.user) }}
                    </span>
                    <span v-else>Система</span>
                  </template>
                </Column>
                <Column header="Действие">
                  <template #body="{ data }">
                    {{ getActionLabel(data.action) }}
                  </template>
                </Column>
                <Column header="Подробности" style="width: 140px">
                  <template #body="{ data }">
                    <Button
                      v-if="data.oldValues || data.newValues"
                      label="Показать"
                      icon="pi pi-eye"
                      severity="info"
                      text
                      size="small"
                      @click="showDetails(data)"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
          </template>
        </Card>
      </div>
      <Dialog
        v-model:visible="detailsDialogVisible"
        header="Подробности действия"
        :modal="true"
        :style="{ width: '600px' }"
      >
        <div v-if="selectedLog" class="details-content">
          <div class="detail-section">
            <h4>Действие</h4>
            <p>{{ getActionLabel(selectedLog.action) }}</p>
          </div>
          <div class="detail-section">
            <h4>Время</h4>
            <p>{{ formatDateTime((selectedLog as any).createdAt) }}</p>
          </div>
          <div v-if="selectedLog.ipAddress || selectedLog.userAgent" class="detail-section">
            <h4>Информация о подключении</h4>
            <p v-if="selectedLog.ipAddress"><strong>IP адрес:</strong> {{ selectedLog.ipAddress }}</p>
            <p v-if="selectedLog.userAgent"><strong>User Agent:</strong> {{ selectedLog.userAgent }}</p>
          </div>
          <div v-if="selectedLogChanges.length" class="detail-section">
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
                  <tr v-for="change in selectedLogChanges" :key="change.key">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import Galleria from 'primevue/galleria';
import OrderList from 'primevue/orderlist';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

import { useProductsStore } from '@/stores/productsStore';
import { useAuthStore } from '@/stores/authStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import { useCommitteesStore } from '@/stores/committeesStore';
import { useTransactionTypesStore } from '@/stores/transactionTypesStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { storeToRefs } from 'pinia';
import { type AuditLog, type PaginatedResponse } from '@/types/api';
import { apiService } from '@/services/api';
import { compressImageFile } from '@/utils/imageCompression';
import type { UpdateProductDto } from '@/types/api';
import { isCurrentUserActor, getActorDisplayName } from '@/utils/user-utils';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const productsStore = useProductsStore();
const authStore = useAuthStore();
const warehousesStore = useWarehousesStore();
const committeesStore = useCommitteesStore();
const transactionTypesStore = useTransactionTypesStore();
const categoriesStore = useCategoriesStore();

const productId = Number(route.params.id);
const saving = ref(false);
const savingOrder = ref(false);
const wrappedImages = ref<{ url: string }[]>([]);
const productLogs = ref<AuditLog[]>([]);
const logsLoading = ref(false);
const detailsDialogVisible = ref(false);
const selectedLog = ref<AuditLog | null>(null);
const selectedLogChanges = ref<Array<{ key: string; old: string; new: string }>>([]);

// Form State
const form = reactive({
  name: '',
  sku: '',
  description: '',
  salePrice: 0,
  purchasePrice: 0,
  quantity: 0,
  minStockLevel: 0,
  categoryId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  committeeId: undefined as number | undefined,
  transactionTypeId: undefined as number | undefined,
});

// Computed
const product = computed(() => productsStore.currentProduct);
const { isAdminOrManager } = storeToRefs(authStore);
const canEdit = computed(() => isAdminOrManager.value);

const categoryPath = computed(() => {
  const p = product.value;
  if (!p) return null;
  
  let currentId: number | undefined = p.categoryId || p.category?.id;
  if (!currentId) return null;

  const cats = categoriesStore.categories;
  // If categories are not loaded yet, fallback to single category name
  if (!cats || !cats.length) return p.category?.name;

  const path: string[] = [];
  let depth = 0;
  
  while (currentId && depth < 20) {
    const cat = cats.find(c => c.id === currentId);
    if (!cat) {
      // Fallback for leaf node if not found in store
      if (path.length === 0 && p.category && p.category.id === currentId) {
        path.unshift(p.category.name);
      }
      break;
    }
    path.unshift(cat.name);
    currentId = cat.parentId;
    depth++;
  }
  
  return path.length ? path.join(' > ') : p.category?.name;
});
const orderChanged = computed(() => {
  if (!product.value?.images) return false;
  const currentUrls = wrappedImages.value.map(i => i.url);
  return JSON.stringify(currentUrls) !== JSON.stringify(product.value.images);
});

const isFormChanged = computed(() => {
  if (!product.value) return false;
  
  return form.name !== product.value.name ||
    form.sku !== product.value.sku ||
    form.description !== (product.value.description || '') ||
    Number(form.salePrice) !== Number(product.value.salePrice) ||
    Number(form.purchasePrice) !== Number(product.value.purchasePrice) ||
    form.quantity !== product.value.quantity ||
    form.minStockLevel !== (product.value.minStockLevel || 0) ||
    form.categoryId !== product.value.categoryId ||
    form.warehouseId !== product.value.warehouseId ||
    form.committeeId !== product.value.committeeId ||
    form.transactionTypeId !== product.value.transactionTypeId;
});

 

// Options for dropdowns
const categoryOptions = computed(() => [
  { label: 'Без категории', value: undefined },
  ...categoriesStore.flatCategoriesLabels
]);

const warehouseOptions = computed(() => [
  { label: 'Не выбран', value: undefined },
  ...warehousesStore.warehouses.map(w => ({ label: w.name, value: w.id }))
]);

const committeeOptions = computed(() => [
  { label: 'Не выбран', value: undefined },
  ...committeesStore.committees.map(c => ({ label: c.name, value: c.id }))
]);

const transactionTypeOptions = computed(() => [
  { label: 'Не выбран', value: undefined },
  ...transactionTypesStore.transactionTypes.map(t => ({ label: t.name, value: t.id }))
]);

// Lifecycle
onMounted(async () => {
  await Promise.all([
    productsStore.fetchProduct(productId),
    warehousesStore.fetchWarehouses(),
    committeesStore.fetchCommittees(),
    transactionTypesStore.fetchTransactionTypes(),
    categoriesStore.fetchCategories()
  ]);
  
  if (product.value) {
    populateForm();
    syncImages();
    await fetchProductLogs();
  }
});

watch(product, () => {
  if (product.value) {
    populateForm();
    syncImages();
    fetchProductLogs();
  }
}, { deep: true });

// Methods
const populateForm = () => {
  if (!product.value) return;
  form.name = product.value.name;
  form.sku = product.value.sku;
  form.description = product.value.description || '';
  form.salePrice = product.value.salePrice;
  form.purchasePrice = product.value.purchasePrice;
  form.quantity = product.value.quantity;
  form.minStockLevel = product.value.minStockLevel || 0;
  form.categoryId = product.value.categoryId;
  form.warehouseId = product.value.warehouseId;
  form.committeeId = product.value.committeeId;
  form.transactionTypeId = product.value.transactionTypeId;
};

const syncImages = () => {
  if (product.value?.images) {
    wrappedImages.value = product.value.images.map(url => ({ url }));
  } else {
    wrappedImages.value = [];
  }
};

const getFileName = (url: string) => {
  const parts = url.split('/');
  return decodeURIComponent(parts[parts.length - 1] || '');
};

const getFullImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) {
     // Исправление для внутренней сети Docker: заменяем minio:9000 на текущий хост
     if (url.includes('minio:9000')) {
       return url.replace('minio:9000', `${window.location.hostname}:9000`);
     }
    return url;
  }
  // Исключение для MinIO proxy путей
  if (url.startsWith('/minio/')) {
    return url;
  }
  if (url.startsWith('/')) return `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`;
  return url;
};

const getImageIndex = (url: string): number => {
  return wrappedImages.value.findIndex(i => i.url === url) + 1;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNNjAgODBDNzcuNjczMSA4MCA5MiA2NS42NzMxIDkyIDQ4QzkyIDMwLjMyNjkgNzcuNjczMSAxNiA2MCAxNkM0Mi4zMjY5IDE2IDI4IDMwLjMyNjkgMjggNDhDMjggNjUuNjczMSA0Mi4zMjY5IDgwIDYwIDgwWiIgZmlsbD0iI0RDREZFRCIvPjxwYXRoIGQ9Ik0xMiAxNTRWMTQ0TDM4LjU0IDExMS40OEM0Mi4wNCAxMDcuMDggNDcuOTYgMTA3LjA4IDUxLjQ2IDExMS40OEw3Ni4zIDE0MUwxMDEuNTQgMTA1LjQ4QzEwNS4wNCAxMDEuMDggMTEwLjk2IDEwMS4wOCAxMTQuNDYgMTA1LjQ4TDE1MiAxNTJIMTJaIiBmaWxsPSIjRENEQ0VFIi8+PC9zdmc+';
  img.onerror = null;
};

const saveProduct = async () => {
  if (!product.value) return;
  saving.value = true;
  try {
    const updateDto: UpdateProductDto = {
      name: form.name,
      sku: form.sku,
      description: form.description,
      salePrice: form.salePrice,
      purchasePrice: form.purchasePrice,
      quantity: form.quantity,
      minStockLevel: form.minStockLevel,
      categoryId: form.categoryId,
      warehouseId: form.warehouseId,
      committeeId: form.committeeId,
      transactionTypeId: form.transactionTypeId,
    };
    await productsStore.updateProduct(product.value.id, updateDto);
    toast.add({ 
      severity: 'success', 
      summary: 'Успешно', 
      detail: 'Товар обновлен', 
      life: 3000 
    });
  } catch (e: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка', 
      detail: e.message || 'Не удалось обновить товар', 
      life: 3000 
    });
  } finally {
    saving.value = false;
  }
};

const onUploadImage = async (event: any) => {
  if (!product.value) return;
  const files = Array.from(event.files) as File[];
  
  if (files.length === 0) return;
  
  const id = product.value.id;
  const filesToUpload = [...files];

  // Don't await the whole process to keep UI responsive
  (async () => {
    let uploadedCount = 0;
    for (const file of filesToUpload) {
      try {
        const compressed = await compressImageFile(file, { useWebWorker: false });
        await productsStore.uploadImage(id, compressed);
        uploadedCount++;
      } catch (e: any) {
        console.error('Error uploading image:', e);
      }
    }
    
    if (uploadedCount > 0) {
      toast.add({ 
        severity: 'success', 
        summary: 'Успешно', 
        detail: `Загружено ${uploadedCount} из ${filesToUpload.length} изображений`, 
        life: 3000 
      });
      await productsStore.fetchProduct(id);
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Ошибка', 
        detail: 'Не удалось загрузить ни одного изображения', 
        life: 3000 
      });
    }
  })();

  if (event?.options?.clear) {
    event.options.clear();
  }
};

const confirmDeleteImage = (imageUrl: string) => {
  confirm.require({
    message: 'Вы уверены, что хотите удалить это изображение? Это действие нельзя отменить.',
    header: 'Удаление изображения',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteImage(imageUrl),
  });
};

const deleteImage = async (imageUrl: string) => {
  if (!product.value) return;
  try {
    await productsStore.deleteImage(product.value.id, imageUrl);
    toast.add({ 
      severity: 'success', 
      summary: 'Успешно', 
      detail: 'Изображение удалено', 
      life: 3000 
    });
  } catch (e: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка', 
      detail: e.message || 'Ошибка удаления', 
      life: 3000 
    });
  }
};

const saveImageOrder = async () => {
  if (!product.value) return;
  savingOrder.value = true;
  try {
    const images = wrappedImages.value.map(i => i.url);
    await productsStore.reorderImages(product.value.id, images);
    toast.add({ 
      severity: 'success', 
      summary: 'Успешно', 
      detail: 'Порядок изображений сохранен', 
      life: 3000 
    });
  } catch (e: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка', 
      detail: e.message || 'Ошибка сохранения порядка', 
      life: 3000 
    });
  } finally {
    savingOrder.value = false;
  }
};

const fetchProductLogs = async () => {
  if (!isAdminOrManager.value) return;
  logsLoading.value = true;
  try {
    const response = await apiService.getProductHistory(productId, 1, 100);
    productLogs.value = response.data;
  } catch (e: any) {
    console.error('Ошибка загрузки истории:', e);
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка', 
      detail: `Не удалось загрузить историю: ${e.message}`, 
      life: 3000 
    });
  } finally {
    logsLoading.value = false;
  }
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

const getActionLabel = (action: string): string => {
  const map: Record<string, string> = {
    'product.create': 'Создание товара',
    'product.update': 'Обновление товара',
    'product.delete': 'Удаление товара',
    'product.price_change': 'Изменение цены',
    'product.quantity_change': 'Изменение количества',
    'product.image_add': 'Добавление изображения',
    'product.image_delete': 'Удаление изображения',
    'product.image_reorder': 'Изменение порядка изображений',
    'sale.create': 'Продажа',
    'sale.delete': 'Удаление продажи',
    'return.create': 'Возврат',
    'return.delete': 'Удаление возврата',
  };
  return map[action] || action;
};

const buildChanges = (log: AuditLog | null) => {
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

const showDetails = (log: AuditLog) => {
  selectedLog.value = log;
  selectedLogChanges.value = buildChanges(log);
  detailsDialogVisible.value = true;
};
</script>

<style scoped>
.custom-upload-button :deep(.p-fileupload-filename),
.custom-upload-button :deep(.p-fileupload-file-name),
.custom-upload-button :deep(.p-fileupload-files) {
  display: none !important;
}

.custom-upload-button :deep(.p-button-label) {
  margin-left: 0.5rem;
}

.product-details-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.product-header {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

/* Gallery Styles */
.gallery-main-image {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.gallery-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  padding: 1rem;
}

.gallery-thumbnail {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.gallery-thumbnail:hover {
  border-color: #3b82f6;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-image-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
}

/* Image Management */
.image-management {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 1rem;
}

.image-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  transition: background-color 0.2s;
  border-radius: 0.375rem;
}

.image-list-item:hover {
  background-color: #f9fafb;
}

.image-preview {
  position: relative;
  flex-shrink: 0;
}

.image-preview-img {
  width: 48px;
  height: 48px;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
  object-fit: cover;
}

.main-image-badge {
  position: absolute;
  top: -4px;
  left: -4px;
}

.image-info {
  flex: 1;
  min-width: 0;
}

.image-filename {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-position {
  font-size: 0.75rem;
  color: #6b7280;
}

.image-actions {
  flex-shrink: 0;
}

.image-order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

/* Empty Images State */
.empty-images {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-images-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background-color: #f3f4f6;
  margin-bottom: 1rem;
}

.empty-images-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-images-description {
  color: #6b7280;
  max-width: 24rem;
  margin: 0 auto;
}

/* Form Styles */
.form-section {
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-grid .col-span-2 {
  grid-column: span 2;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-label .required {
  color: #ef4444;
}

.history-actor.self-actor {
  font-weight: 600;
  color: var(--primary-color);
}

.character-counter {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .product-details-view {
    padding: 0.5rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-grid .col-span-2 {
    grid-column: span 1;
  }
  
  .product-header {
    padding: 1rem;
  }
  
  .gallery-main-image {
    height: 300px;
  }
  
  .gallery-thumbnail {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 1024px) {
  .grid-cols-1 {
    gap: 1rem;
  }
}
</style>
