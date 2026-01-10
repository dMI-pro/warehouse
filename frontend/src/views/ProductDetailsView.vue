<template>
  <div class="product-details-view container mx-auto p-4">
    <div class="mb-4">
      <Button 
        label="Назад к списку" 
        icon="pi pi-arrow-left" 
        text 
        @click="router.push({ name: 'products' })" 
      />
    </div>

    <div v-if="productsStore.loading && !product" class="flex justify-center p-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column: Images -->
      <div class="space-y-6">
        <Card>
          <template #title>
            <div class="flex justify-between items-center">
              <span>Фотографии</span>
              <div v-if="canEdit">
                <FileUpload
                  mode="basic"
                  name="image"
                  :auto="true"
                  chooseLabel="Добавить"
                  accept="image/*"
                  :maxFileSize="10000000"
                  customUpload
                  @uploader="onUploadImage"
                />
              </div>
            </div>
          </template>
          <template #content>
            <!-- Gallery -->
            <div v-if="product.images && product.images.length > 0" class="mb-6">
              <Galleria
                :value="product.images"
                :numVisible="5"
                containerStyle="max-width: 100%"
                :showThumbnails="true"
                :showIndicators="true"
                :circular="true"
                :autoPlay="false"
              >
                <template #item="slotProps">
                  <div class="w-full h-[400px] flex items-center justify-center bg-gray-100 rounded">
                    <img
                      :src="slotProps.item"
                      :alt="product.name"
                      class="max-w-full max-h-full object-contain"
                    />
                  </div>
                </template>
                <template #thumbnail="slotProps">
                  <div class="w-20 h-20 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                    <img
                      :src="slotProps.item"
                      :alt="product.name"
                      class="w-full h-full object-cover"
                    />
                  </div>
                </template>
              </Galleria>
            </div>
            <div v-else class="text-center p-8 text-gray-400 bg-gray-50 rounded">
              <i class="pi pi-image text-4xl mb-2"></i>
              <p>Нет изображений</p>
            </div>

            <!-- Image Management (Reorder/Delete) -->
            <div v-if="canEdit && product.images && product.images.length > 0" class="mt-6 border-t pt-4">
              <h3 class="text-lg font-medium mb-3">Управление изображениями</h3>
              <OrderList v-model="wrappedImages" listStyle="height:auto" dataKey="url">
                <template #header> Перетащите для изменения порядка </template>
                <template #item="slotProps">
                  <div class="flex flex-wrap p-2 items-center gap-3 w-full">
                    <img :src="slotProps.item.url" class="w-12 h-12 shadow-sm rounded object-cover" />
                    <div class="flex-1 flex flex-col gap-1">
                        <span class="text-sm text-gray-600 break-all">{{ getFileName(slotProps.item.url) }}</span>
                    </div>
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      @click="confirmDeleteImage(slotProps.item.url)"
                    />
                  </div>
                </template>
              </OrderList>
              <div class="flex justify-end mt-2">
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
          </template>
        </Card>
      </div>

      <!-- Right Column: Product Details -->
      <div>
        <Card>
          <template #title>
            <div class="flex justify-between items-start">
              <div class="flex flex-col">
                <span class="text-2xl font-bold">{{ product.name }}</span>
                <span class="text-sm text-gray-500">ID: {{ product.id }}</span>
              </div>
              <Tag :value="getCategoryName(product.categoryId)" severity="info" />
            </div>
          </template>
          <template #content>
            <form @submit.prevent="saveProduct" class="flex flex-col gap-4 mt-4">
              <!-- Public Fields -->
              <div class="field">
                <label for="name" class="font-bold block mb-1">Название</label>
                <InputText id="name" v-model="form.name" class="w-full" :disabled="!canEdit" />
              </div>

              <div class="field">
                <label for="sku" class="font-bold block mb-1">Артикул</label>
                <InputText id="sku" v-model="form.sku" class="w-full" :disabled="!canEdit" />
              </div>

              <div class="field">
                <label for="description" class="font-bold block mb-1">Описание</label>
                <Textarea
                  id="description"
                  v-model="form.description"
                  rows="5"
                  class="w-full"
                  :disabled="!canEdit"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="field">
                  <label for="salePrice" class="font-bold block mb-1">Цена продажи</label>
                  <InputNumber
                    id="salePrice"
                    v-model="form.salePrice"
                    mode="currency"
                    currency="RUB"
                    locale="ru-RU"
                    class="w-full"
                    :disabled="!canEdit"
                  />
                </div>
                <div class="field">
                  <label for="quantity" class="font-bold block mb-1">Количество</label>
                  <InputNumber
                    id="quantity"
                    v-model="form.quantity"
                    class="w-full"
                    :disabled="!canEdit"
                  />
                </div>
              </div>
              
              <div class="field">
                 <label for="category" class="font-bold block mb-1">Категория</label>
                 <Dropdown 
                   id="category"
                   v-model="form.categoryId" 
                   :options="categoriesStore.flatCategoriesLabels" 
                   optionLabel="label" 
                   optionValue="value" 
                   class="w-full" 
                   :disabled="!canEdit" 
                   placeholder="Выберите категорию"
                 />
              </div>

              <!-- Restricted Fields (Manager/Admin) -->
              <div v-if="isAdminOrManager" class="border-t pt-4 mt-2 bg-gray-50 p-4 rounded">
                <h3 class="text-lg font-semibold mb-3 text-gray-700">Служебная информация</h3>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="field">
                    <label for="purchasePrice" class="font-bold block mb-1">Цена закупки</label>
                    <InputNumber
                      id="purchasePrice"
                      v-model="form.purchasePrice"
                      mode="currency"
                      currency="RUB"
                      locale="ru-RU"
                      class="w-full"
                      :disabled="!canEdit"
                    />
                  </div>
                  <div class="field">
                    <label for="minStock" class="font-bold block mb-1">Мин. остаток</label>
                    <InputNumber
                      id="minStock"
                      v-model="form.minStockLevel"
                      class="w-full"
                      :disabled="!canEdit"
                    />
                  </div>
                </div>

                <div class="field mt-3">
                  <label for="warehouse" class="font-bold block mb-1">Склад</label>
                  <Dropdown
                    id="warehouse"
                    v-model="form.warehouseId"
                    :options="warehouseOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                    :disabled="!canEdit"
                    placeholder="Выберите склад"
                  />
                </div>

                <div class="field mt-3">
                  <label for="committee" class="font-bold block mb-1">Коммитет</label>
                  <Dropdown
                    id="committee"
                    v-model="form.committeeId"
                    :options="committeeOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                    :disabled="!canEdit"
                    placeholder="Выберите коммитет"
                  />
                </div>

                <div class="field mt-3">
                  <label for="transactionType" class="font-bold block mb-1">Тип транзакции</label>
                  <Dropdown
                    id="transactionType"
                    v-model="form.transactionTypeId"
                    :options="transactionTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                    :disabled="!canEdit"
                    placeholder="Выберите тип"
                  />
                </div>
              </div>

              <div v-if="canEdit" class="flex justify-end mt-4 sticky bottom-0 bg-white p-2 border-t z-10">
                <Button
                  type="submit"
                  label="Сохранить изменения"
                  icon="pi pi-save"
                  :loading="saving"
                />
              </div>
            </form>
          </template>
        </Card>
      </div>
    </div>
    
    <div v-else class="text-center p-8">
       <h3>Товар не найден</h3>
    </div>

    <ConfirmDialog />
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
import ConfirmDialog from 'primevue/confirmdialog';

import { useProductsStore } from '@/stores/productsStore';
import { useAuthStore } from '@/stores/authStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import { useCommitteesStore } from '@/stores/committeesStore';
import { useTransactionTypesStore } from '@/stores/transactionTypesStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { Role } from '@/types/api';
import type { UpdateProductDto, FileUploadEvent } from '@/types/api'; // Ensure FileUploadEvent is correct or use any

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
const isAdminOrManager = computed(() => authStore.hasRole(Role.MANAGER) || authStore.isAdmin);
const canEdit = computed(() => isAdminOrManager.value); // Currently only managers/admins can edit
const orderChanged = computed(() => {
    if (!product.value?.images) return false;
    const currentUrls = wrappedImages.value.map(i => i.url);
    if (currentUrls.length !== product.value.images.length) return true;
    return JSON.stringify(currentUrls) !== JSON.stringify(product.value.images);
});

const warehouseOptions = computed(() => warehousesStore.warehouses.map(w => ({ label: w.name, value: w.id })));
const committeeOptions = computed(() => committeesStore.committees.map(c => ({ label: c.name, value: c.id })));
const transactionTypeOptions = computed(() => transactionTypesStore.transactionTypes.map(t => ({ label: t.name, value: t.id })));

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
  }
});

watch(product, () => {
    if (product.value) {
        populateForm();
        syncImages();
    }
});

// Methods
const populateForm = () => {
  if (!product.value) return;
  form.name = product.value.name;
  form.sku = product.value.sku;
  form.description = product.value.description || '';
  form.salePrice = product.value.salePrice;
  form.purchasePrice = product.value.purchasePrice;
  form.quantity = product.value.quantity;
  form.minStockLevel = product.value.minStockLevel;
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
    return url.split('/').pop();
};

const getCategoryName = (id?: number) => {
    if (!id) return 'Без категории';
    const cat = categoriesStore.categories.find(c => c.id === id); // This might need flattening if nested
    // Try flat list if available in store
    const flat = categoriesStore.flatCategoriesLabels.find(c => c.value === id);
    return flat ? flat.label : (cat?.name || 'Неизвестно');
};

const saveProduct = async () => {
    if (!product.value) return;
    saving.value = true;
    try {
        const updateDto: UpdateProductDto = {
            ...form,
        };
        await productsStore.updateProduct(product.value.id, updateDto);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Товар обновлен', life: 3000 });
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Ошибка', detail: e.message || 'Не удалось обновить товар', life: 3000 });
    } finally {
        saving.value = false;
    }
};

const onUploadImage = async (event: any) => {
    if (!product.value) return;
    const file = event.files[0];
    if (!file) return;
    
    try {
        await productsStore.uploadImage(product.value.id, file);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Изображение загружено', life: 3000 });
        // Images will be updated via watcher on productStore.currentProduct
        // clear file upload
        event.options.clear();
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Ошибка', detail: e.message || 'Ошибка загрузки', life: 3000 });
    }
};

const confirmDeleteImage = (imageUrl: string) => {
    confirm.require({
        message: 'Вы уверены, что хотите удалить это изображение?',
        header: 'Подтверждение',
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteImage(imageUrl),
        reject: () => {}
    });
};

const deleteImage = async (imageUrl: string) => {
    if (!product.value) return;
    try {
        await productsStore.deleteImage(product.value.id, imageUrl);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Изображение удалено', life: 3000 });
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Ошибка', detail: e.message || 'Ошибка удаления', life: 3000 });
    }
};

const saveImageOrder = async () => {
    if (!product.value) return;
    savingOrder.value = true;
    try {
        const images = wrappedImages.value.map(i => i.url);
        await productsStore.reorderImages(product.value.id, images);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Порядок сохранен', life: 3000 });
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Ошибка', detail: e.message || 'Ошибка сохранения порядка', life: 3000 });
    } finally {
        savingOrder.value = false;
    }
};
</script>

<style scoped>
.field {
    margin-bottom: 1rem;
}
</style>
