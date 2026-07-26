<template>
  <div class="reports">
    <!-- Шапка страницы -->
    <div class="grid mb-4">
      <div class="col-12">
        <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
          <div class="flex align-items-center gap-3">
            <div class="p-3 surface-100 border-round-lg">
              <i class="pi pi-chart-line text-primary text-2xl"></i>
            </div>
            <div>
              <h1 class="text-2xl font-bold m-0">Отчеты</h1>
              <span class="text-color-secondary">Аналитика продаж, остатков и возвратов</span>
            </div>
          </div>
          
          <div class="flex align-items-center gap-3">
            <div class="flex align-items-center gap-2 p-3 surface-100 border-round-lg">
              <i class="pi pi-download text-primary"></i>
              <span class="font-medium">Экспорт:</span>
              <Dropdown
                v-model="exportFormat"
                :options="exportFormats"
                optionLabel="label"
                optionValue="value"
                class="w-10rem"
              />
            </div>
            <Button
              label="Экспортировать"
              icon="pi pi-file-export"
              :disabled="!normalizedReportData.length"
              @click="handleExport"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="grid">
      <div class="col-12">
        <!-- Вкладки отчётов -->
        <Card class="mb-4">
          <template #content>
            <div class="tabs-container">
              <div class="flex flex-wrap gap-2">
                <Button
                  v-for="(tab, index) in tabs"
                  :key="tab.type"
                  :label="tab.label"
                  :icon="tab.icon"
                  :severity="activeTabIndex === index ? undefined : 'secondary'"
                  :class="[
                    'p-button-lg',
                    activeTabIndex === index ? 'tab-button-active' : 'tab-button'
                  ]"
                  @click="setReportType(tab.type)"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Статистика -->
        <Card v-if="reportType === 'sales'" class="mb-4 section-card">
          <template #title>
            <div class="section-header">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-chart-bar text-primary"></i>
                <span>Статистика</span>
              </div>
              <Button
                :label="statsCollapsed ? 'Развернуть' : 'Свернуть'"
                :icon="statsCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
                severity="secondary"
                outlined
                size="small"
                @click="toggleStatsSection"
              />
            </div>
          </template>
          <template #content>
            <div v-if="!statsCollapsed">
              <div v-if="normalizedReportData.length" class="grid">
                <div class="col-6 md:col-3">
                  <Card class="h-full">
                    <template #content>
                      <div class="flex flex-column">
                        <div class="flex align-items-center gap-2 mb-2">
                          <div class="p-2 bg-blue-100 border-round">
                            <i class="pi pi-wallet text-blue-600"></i>
                          </div>
                          <div class="flex-1">
                            <div class="text-sm text-color-secondary">Выручка</div>
                            <div class="text-xl font-bold">{{ formatPrice(calculatedStats.totalRevenue) }}</div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </Card>
                </div>
                <div class="col-6 md:col-3">
                  <Card class="h-full">
                    <template #content>
                      <div class="flex flex-column">
                        <div class="flex align-items-center gap-2 mb-2">
                          <div class="p-2 bg-green-100 border-round">
                            <i class="pi pi-chart-line text-green-600"></i>
                          </div>
                          <div class="flex-1">
                            <div class="text-sm text-color-secondary">Прибыль</div>
                            <div class="text-xl font-bold text-green-600">{{ formatPrice(calculatedStats.totalProfit) }}</div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </Card>
                </div>
                <div class="col-6 md:col-3">
                  <Card class="h-full">
                    <template #content>
                      <div class="flex flex-column">
                        <div class="flex align-items-center gap-2 mb-2">
                          <div class="p-2 bg-purple-100 border-round">
                            <i class="pi pi-receipt text-purple-600"></i>
                          </div>
                          <div class="flex-1">
                            <div class="text-sm text-color-secondary">Чеков</div>
                            <div class="text-xl font-bold">{{ calculatedStats.totalInvoices }}</div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </Card>
                </div>
                <div class="col-6 md:col-3">
                  <Card class="h-full">
                    <template #content>
                      <div class="flex flex-column">
                        <div class="flex align-items-center gap-2 mb-2">
                          <div class="p-2 bg-orange-100 border-round">
                            <i class="pi pi-shopping-bag text-orange-600"></i>
                          </div>
                          <div class="flex-1">
                            <div class="text-sm text-color-secondary">Товаров</div>
                            <div class="text-xl font-bold">{{ calculatedStats.totalItemsSold }}</div>
                          </div>
                        </div>
                      </div>
                    </template>
                  </Card>
                </div>
              </div>
              <div v-else class="text-color-secondary text-sm">
                После загрузки данных здесь появятся показатели по продажам.
              </div>
            </div>
          </template>
        </Card>

        <!-- Фильтры -->
        <Card class="mb-4 section-card">
          <template #title>
            <div class="section-header">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-filter text-primary"></i>
                <span>Фильтры</span>
              </div>
              <Button
                :label="filtersCollapsed ? 'Развернуть' : 'Свернуть'"
                :icon="filtersCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
                severity="secondary"
                outlined
                size="small"
                @click="toggleFiltersSection"
              />
            </div>
          </template>
          <template #content>
            <div v-if="!filtersCollapsed" class="filters-section">
              <div class="grid formgrid filters-grid">
                <div class="col-12 md:col-6 xl:col-3">
                  <label for="startDate" class="block mb-2 font-medium">
                    <i class="pi pi-calendar mr-1"></i>
                    Дата начала
                  </label>
                  <Calendar
                    id="startDate"
                    v-model="filters.startDate"
                    dateFormat="dd.mm.yy"
                    showIcon
                    :showButtonBar="true"
                    class="w-full"
                    :class="{ 'p-invalid': dateRangeError }"
                  />
                </div>

                <div class="col-12 md:col-6 xl:col-3">
                  <label for="endDate" class="block mb-2 font-medium">
                    <i class="pi pi-calendar mr-1"></i>
                    Дата окончания
                  </label>
                  <Calendar
                    id="endDate"
                    v-model="filters.endDate"
                    dateFormat="dd.mm.yy"
                    showIcon
                    :showButtonBar="true"
                    class="w-full"
                    :class="{ 'p-invalid': dateRangeError }"
                  />
                </div>

                <div class="col-12 xl:col-3 flex align-items-end">
                  <Button
                    label="Применить"
                    icon="pi pi-check"
                    class="w-full"
                    :loading="isLoading"
                    severity="success"
                    @click="generateReport"
                  />
                </div>

                <div class="col-12 xl:col-3 flex align-items-end">
                  <Button
                    label="Сбросить"
                    icon="pi pi-refresh"
                    severity="secondary"
                    outlined
                    class="w-full"
                    @click="resetFilters"
                  />
                </div>

                <div v-if="dateRangeError" class="col-12">
                  <small class="p-error block">
                    <i class="pi pi-exclamation-circle mr-1"></i>
                    {{ dateRangeError }}
                  </small>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Таблица данных -->
        <Card class="mb-4">
          <template #title>
            <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-2">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-table text-primary"></i>
                <span class="font-bold">{{ getTableTitle() }}</span>
                <Tag v-if="normalizedReportData.length" :value="normalizedReportData.length" severity="info" rounded />
              </div>
              <span class="text-color-secondary text-sm">
                {{ getTableSubtitle() }}
              </span>
            </div>
          </template>
          <template #content>
            <DataTable
              :value="normalizedReportData"
              :loading="isLoading"
              :paginator="true"
              v-model:rows="rows"
              :rowsPerPageOptions="[10, 15, 30, 50]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
              currentPageReportTemplate="{first} - {last} из {totalRecords}"
              :emptyMessage="isLoading ? 'Загрузка...' : 'Нет данных'"
              class="report-table p-datatable-sm"
              stripedRows
              showGridlines
            >
              <Column
                v-for="column in tableColumns"
                :key="column.field"
                :field="column.field"
                :header="column.header"
                :sortable="column.sortable"
                :style="{ 'min-width': column.minWidth }"
              >
                <template #body="{ data }">
                  <template v-if="column.format === 'price'">
                    <Tag :value="formatPrice(data[column.field])" severity="success" class="font-semibold" />
                  </template>
                  <template v-else-if="column.format === 'date'">
                    <span>{{ formatDate(data[column.field]) }}</span>
                  </template>
                  <template v-else-if="column.field === 'quantity'">
                    <Badge :value="data[column.field]" severity="info" />
                  </template>
                  <template v-else-if="column.field === 'reason'">
                    <div class="max-w-20rem truncate-text" :title="data[column.field]">
                      {{ data[column.field] }}
                    </div>
                  </template>
                  <template v-else>
                    {{ data[column.field] }}
                  </template>
                </template>
              </Column>

              <Column header="Действия" :exportable="false" style="min-width: 120px">
                <template #body="{ data }">
                  <div class="flex gap-1">
                    <Button
                      v-if="canEditItem(data)"
                      icon="pi pi-pencil"
                      severity="info"
                      size="small"
                      rounded
                      outlined
                      v-tooltip.top="'Редактировать'"
                      @click="editItem(data)"
                    />

                    <Button
                      v-if="canDeleteItem(data)"
                      icon="pi pi-trash"
                      size="small"
                      rounded
                      outlined
                      severity="danger"
                      v-tooltip.top="'Удалить'"
                      @click="deleteItem(data)"
                    />

                    <Button
                      v-if="!canEditItem(data) && !canDeleteItem(data)"
                      icon="pi pi-eye"
                      size="small"
                      rounded
                      outlined
                      severity="secondary"
                      v-tooltip.top="'Просмотреть'"
                      @click="viewItem(data)"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>

        <!-- График -->
        <div v-if="(reportType === 'sales' || reportType === 'returns') && normalizedReportData.length" class="grid mb-4">
          <div class="col-12">
            <Card>
              <template #title>
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-chart-bar" :class="reportType === 'sales' ? 'text-primary' : 'text-orange-500'"></i>
                  <span>{{ reportType === 'sales' ? 'Динамика продаж' : 'Динамика возвратов' }}</span>
                </div>
              </template>
              <template #content>
                <div ref="mainChartRef" class="chart-container"></div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог редактирования -->
    <Dialog
      v-model:visible="editDialogVisible"
      :header="getEditDialogHeader()"
      :modal="true"
      class="p-fluid"
      :style="{ width: '500px' }"
      :closable="true"
    >
      <div v-if="editingItem" class="field mb-3">
        <label for="product" class="block mb-2 font-semibold">
          <i class="pi pi-box mr-1"></i>
          Товар
        </label>
        <InputText 
          id="product" 
          :modelValue="getItemName(editingItem)" 
          disabled 
          class="w-full" 
        />
      </div>

      <QuantityInput
        ref="quantityInputRef"
        v-model="editForm.quantity"
        class="mb-3"
        :available-quantity="availableQuantity"
        :originalQuantity="requestQuantity"
        :include-original-in-available="true"
        :label="'Количество'"
        :required="true"
        :min="1"
        :hint="`На складе: ${availableQuantity} + Уже в заявке: ${requestQuantity}`"
        :show-available-field="true"
        @error="handleQuantityError"
      />
      
      <div v-if="reportType === 'sales'" class="field mb-3">
        <label for="price" class="block mb-2 font-semibold">
          <i class="pi pi-money-bill mr-1"></i>
          Цена продажи
        </label>
        <InputNumber 
          id="price" 
          v-model="editForm.salePrice" 
          mode="currency" 
          currency="RUB" 
          locale="ru-RU" 
          class="w-full" 
          :min="0"
        />
      </div>
      
      <div v-if="reportType === 'returns'" class="field mb-3">
        <label for="reason" class="block mb-2 font-semibold">
          <i class="pi pi-info-circle mr-1"></i>
          Причина возврата
        </label>
        <Textarea 
          id="reason" 
          v-model="editForm.reason" 
          rows="3" 
          class="w-full" 
          :autoResize="true"
        />
      </div>
      
      <div 
        v-if="authStore.hasRole(Role.ADMIN) && (reportType === 'sales' || reportType === 'returns')" 
        class="field mb-3"
      >
        <label :for="reportType === 'sales' ? 'saleDate' : 'returnDate'" class="block mb-2 font-semibold">
          <i class="pi pi-calendar mr-1"></i>
          {{ reportType === 'sales' ? 'Дата продажи' : 'Дата возврата' }}
        </label>
        <Calendar
          :id="reportType === 'sales' ? 'saleDate' : 'returnDate'"
          v-model="editForm.date"
          dateFormat="dd.mm.yy"
          showIcon
          :showTime="true"
          hourFormat="24"
          class="w-full"
        />
      </div>
      
      <template #footer>
        <Button label="Отмена" icon="pi pi-times" severity="secondary" outlined @click="editDialogVisible = false" />
        <Button label="Сохранить" icon="pi pi-check" :loading="saving" @click="saveEdit" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick, onBeforeMount, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { saveAs } from 'file-saver';
import { exportExcelTable, type ExcelColumn } from '@/utils/excelExport';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import { useSalesStore } from '@/stores/salesStore';
import { useProductsStore } from '@/stores/productsStore';
import { useReturnsStore } from '@/stores/returnsStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'primevue/usetoast';
import type { Sale, Product, Return as ApiReturn, Return } from '@/types/api';
import { Role } from '@/types/api';

import QuantityInput from '@/components/forms/QuantityInput.vue';
import { getDefaultTemplate } from '@/utils/exportTemplates';

const route = useRoute();
const router = useRouter();
const toast = useToast();

// Типы данных
interface NormalizedSale {
  id: number;
  productName: string;
  committee: string;
  quantity: number;
  salePrice: number;
  purchasePrice: number;
  totalAmount: number;
  totalProfit: number;
  seller: string;
  date: string;
  originalData?: Sale;
}

interface NormalizedProduct {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  minStockLevel: number;
  salePrice: number;
  originalData?: Product;
}

interface NormalizedReturn {
  id: number;
  productName: string;
  committee: string;
  quantity: number;
  reason: string;
  returnedBy: string;
  date: string;
  originalData?: ApiReturn;
}

type NormalizedItem = NormalizedSale | NormalizedProduct | NormalizedReturn;

interface ReportColumn {
  field: string;
  header: string;
  sortable: boolean;
  format?: 'price' | 'date';
  minWidth?: string;
}

interface CalculatedStats {
  totalRevenue: number;
  totalProfit: number;
  totalInvoices: number;
  totalItemsSold: number;
}

interface EditForm {
  quantity: number;
  salePrice: number;
  reason: string;
  date: Date | null;
}

// Stores
const salesStore = useSalesStore();
const productsStore = useProductsStore();
const returnsStore = useReturnsStore();
const authStore = useAuthStore();

// Состояние
const activeTabIndex = ref(0);
const mainChartRef = ref<HTMLDivElement | null>(null);
let mainChart: echarts.ECharts | null = null;
const isLoading = ref(false);
const rows = ref(15);
const saving = ref(false);
const dateRangeError = ref<string>('');
const resizeObserver = ref<ResizeObserver | null>(null);

// Вкладки
const tabs = ref<Array<{ label: string; icon: string; type: 'sales' | 'stock' | 'movement' | 'returns' }>>([
  { label: 'Продажи', icon: 'pi pi-shopping-cart', type: 'sales' },
  { label: 'Остатки', icon: 'pi pi-box', type: 'stock' },
  { label: 'Движение товаров', icon: 'pi pi-arrows-h', type: 'movement' },
  { label: 'Возвраты товара', icon: 'pi pi-undo', type: 'returns' }
]);

// Вычисляемые свойства
const reportType = computed(() => {
  const types = ['sales', 'stock', 'movement', 'returns'];
  return types[activeTabIndex.value] as 'sales' | 'stock' | 'movement' | 'returns';
});

// Функции вкладок
const setReportType = (type: 'sales' | 'stock' | 'movement' | 'returns') => {
  const index = tabs.value.findIndex(tab => tab.type === type);
  if (index !== -1) {
    activeTabIndex.value = index;
    saveTabToUrl();
    generateReport();
  }
};

const saveTabToUrl = () => {
  const query = { ...route.query, tab: reportType.value };
  router.replace({ query });
};

const restoreTabFromUrl = () => {
  const tabFromUrl = route.query.tab as string;
  if (tabFromUrl) {
    const tabIndex = tabs.value.findIndex(tab => tab.type === tabFromUrl);
    if (tabIndex !== -1) {
      activeTabIndex.value = tabIndex;
    }
  }
};

// Фильтры
const filters = reactive({
  startDate: null as Date | null,
  endDate: null as Date | null,
});

// Экспорт
const exportFormat = ref<'excel' | 'csv'>('csv');
const exportFormats = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'excel' },
];

// Редактирование
const editDialogVisible = ref(false);
const editingItem = ref<NormalizedItem | null>(null);
const editForm = reactive<EditForm>({
  quantity: 0,
  salePrice: 0,
  reason: '',
  date: null,
});

const statsCollapsed = ref(true);
const filtersCollapsed = ref(true);
const availableQuantity = ref<number>(0);
const quantityInputRef = ref<InstanceType<typeof QuantityInput> | null>(null);
const requestQuantity = ref<number>(0);

const resizeChartAfterLayoutChange = async () => {
  await nextTick();
  if (mainChart) {
    mainChart.resize();
  }
};

const toggleStatsSection = async () => {
  statsCollapsed.value = !statsCollapsed.value;
  await resizeChartAfterLayoutChange();
};

const toggleFiltersSection = async () => {
  filtersCollapsed.value = !filtersCollapsed.value;
  await resizeChartAfterLayoutChange();
};

// Заголовки таблиц
const getTableTitle = () => {
  switch (reportType.value) {
    case 'sales': return 'Детализация продаж';
    case 'stock': return 'Текущие остатки товаров';
    case 'movement': return 'Движение товаров';
    case 'returns': return 'Возвраты товаров';
    default: return 'Детализация отчета';
  }
};

const getTableSubtitle = () => {
  if (reportType.value === 'sales') {
    return 'Список всех продаж за выбранный период';
  } else if (reportType.value === 'stock') {
    return 'Актуальные остатки на складе';
  } else if (reportType.value === 'movement') {
    return 'История движения товаров';
  } else if (reportType.value === 'returns') {
    return 'Список возвращенных товаров';
  }
  return '';
};

// Нормализация данных (без изменений)
const normalizedReportData = computed(() => {
  if (reportType.value === 'sales') {
    return salesStore.sales.map((sale): NormalizedSale => {
      const salePrice = Number(sale.salePrice) || 0;
      const purchasePrice = Number(sale.product?.purchasePrice) || 0;
      const quantity = sale.quantity;
      const totalAmount = salePrice * quantity;
      const profitPerItem = salePrice - purchasePrice;
      const totalProfit = profitPerItem * quantity;
      
      return {
        id: sale.id,
        productName: sale.product?.name || 'Неизвестный товар',
        committee: sale.product?.committee?.name || '-',
        quantity: quantity,
        salePrice: salePrice,
        purchasePrice: purchasePrice,
        totalAmount: totalAmount,
        totalProfit: totalProfit,
        seller: sale.user?.fullName || 'Неизвестный продавец',
        date: sale.soldAt || sale.createdAt || new Date().toISOString(),
        originalData: sale
      };
    });
  } else if (reportType.value === 'stock') {
    return productsStore.products.map((product): NormalizedProduct => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      quantity: product.quantity,
      minStockLevel: product.minStockLevel,
      salePrice: Number(product.salePrice) || 0,
      originalData: product
    }));
  } else if (reportType.value === 'returns') {
    return returnsStore.returns.map((ret): NormalizedReturn => ({
      id: ret.id,
      productName: ret.product?.name || 'Неизвестный товар',
      committee: ret.product?.committee?.name || '-',
      quantity: ret.quantity,
      reason: ret.reason || '-',
      returnedBy: ret.user?.fullName || 'Неизвестно',
      date: ret.returnedAt,
      originalData: ret
    }));
  } else {
    return salesStore.sales.map((sale): NormalizedSale => {
      const salePrice = Number(sale.salePrice) || 0;
      const quantity = sale.quantity;
      const totalAmount = salePrice * quantity;
      
      return {
        id: sale.id,
        productName: sale.product?.name || 'Неизвестный товар',
        committee: sale.product?.committee?.name || '-',
        quantity: quantity,
        salePrice: salePrice,
        purchasePrice: 0,
        totalAmount: totalAmount,
        totalProfit: 0,
        seller: sale.user?.fullName || 'Неизвестный продавец',
        date: sale.soldAt || sale.createdAt || new Date().toISOString(),
        originalData: sale
      };
    });
  }
});

// Статистика (без изменений)
const calculatedStats = computed<CalculatedStats>(() => {
  if (reportType.value !== 'sales' || !normalizedReportData.value.length) {
    return {
      totalRevenue: 0,
      totalProfit: 0,
      totalInvoices: 0,
      totalItemsSold: 0
    };
  }

  const stats = normalizedReportData.value.reduce((acc, item) => {
    const saleItem = item as NormalizedSale;
    acc.totalRevenue += saleItem.totalAmount;
    acc.totalProfit += saleItem.totalProfit;
    acc.totalItemsSold += saleItem.quantity;
    return acc;
  }, {
    totalRevenue: 0,
    totalProfit: 0,
    totalInvoices: normalizedReportData.value.length,
    totalItemsSold: 0
  });

  return stats;
});

// Колонки таблицы
const tableColumns = computed<ReportColumn[]>(() => {
  if (reportType.value === 'sales') {
    return [
      { field: 'id', header: 'ID чека', sortable: true, minWidth: '80px' },
      { field: 'productName', header: 'Товар', sortable: true, minWidth: '200px' },
      { field: 'quantity', header: 'Кол-во', sortable: true, minWidth: '100px' },
      { field: 'totalAmount', header: 'Сумма', sortable: true, format: 'price', minWidth: '120px' },
      { field: 'totalProfit', header: 'Прибыль', sortable: true, format: 'price', minWidth: '120px' },
      { field: 'seller', header: 'Кто оформил', sortable: true, minWidth: '150px' },
      { field: 'committee', header: 'Комитет', sortable: true, minWidth: '160px' },
      { field: 'date', header: 'Дата продажи', sortable: true, format: 'date', minWidth: '180px' },
    ];
  } else if (reportType.value === 'stock') {
    return [
      { field: 'id', header: 'ID', sortable: true, minWidth: '80px' },
      { field: 'name', header: 'Название', sortable: true, minWidth: '250px' },
      { field: 'sku', header: 'Артикул', sortable: true, minWidth: '120px' },
      { field: 'quantity', header: 'Кол-во', sortable: true, minWidth: '100px' },
      { field: 'minStockLevel', header: 'Мин. запас', sortable: true, minWidth: '120px' },
      { field: 'salePrice', header: 'Цена', sortable: true, format: 'price', minWidth: '120px' },
    ];
  } else if (reportType.value === 'returns') {
    return [
      { field: 'id', header: 'ID возврата', sortable: true, minWidth: '80px' },
      { field: 'productName', header: 'Товар', sortable: true, minWidth: '200px' },
      { field: 'quantity', header: 'Кол-во', sortable: true, minWidth: '100px' },
      { field: 'reason', header: 'Причина', sortable: true, minWidth: '250px' },
      { field: 'returnedBy', header: 'Кто оформил', sortable: true, minWidth: '150px' },
      { field: 'committee', header: 'Комитет', sortable: true, minWidth: '160px' },
      { field: 'date', header: 'Дата возврата', sortable: true, format: 'date', minWidth: '180px' },
    ];
  } else {
    return [
      { field: 'id', header: 'ID', sortable: true, minWidth: '80px' },
      { field: 'productName', header: 'Товар', sortable: true, minWidth: '200px' },
      { field: 'committee', header: 'Комитет', sortable: true, minWidth: '160px' },
      { field: 'quantity', header: 'Кол-во', sortable: true, minWidth: '100px' },
      { field: 'totalAmount', header: 'Сумма', sortable: true, format: 'price', minWidth: '120px' },
      { field: 'seller', header: 'Продавец', sortable: true, minWidth: '150px' },
      { field: 'date', header: 'Дата продажи', sortable: true, format: 'date', minWidth: '180px' },
    ];
  }
});

// Проверка прав (без изменений)
const canEditItem = (item: NormalizedItem): boolean => {
  if (!authStore.hasRole(Role.ADMIN)) return false;
  return reportType.value === 'sales' || reportType.value === 'returns';
};

const canDeleteItem = (item: NormalizedItem): boolean => {
  if (!authStore.hasRole(Role.ADMIN) && !authStore.hasRole(Role.MANAGER)) return false;
  return reportType.value === 'sales' || reportType.value === 'returns';
};

// Форматирование (без изменений)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Неверная дата';
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Ошибка даты';
  }
};

// Функции диалога редактирования (без изменений)
const getEditDialogHeader = (): string => {
  switch (reportType.value) {
    case 'sales': return 'Редактировать продажу';
    case 'returns': return 'Редактировать возврат';
    default: return 'Редактировать запись';
  }
};

const handleQuantityError = (error: string | null) => {
  console.log('Quantity error:', error);
};

const editItem = (item: NormalizedItem) => {
  if (!canEditItem(item)) return;
  
  editingItem.value = item;
  editForm.quantity = item.quantity;
  editForm.date = null;
  
  if (reportType.value === 'sales') {
    const saleItem = item as NormalizedSale;
    editForm.salePrice = saleItem.salePrice;
    editForm.date = saleItem.date ? new Date(saleItem.date) : null;
    availableQuantity.value = saleItem.originalData?.product?.quantity || 0;
    requestQuantity.value = saleItem.quantity || 0;
  } else if (reportType.value === 'returns') {
    const returnItem = item as NormalizedReturn;
    editForm.reason = returnItem.reason;
    editForm.date = returnItem.date ? new Date(returnItem.date) : null;
    availableQuantity.value = returnItem.originalData?.product?.quantity || 0;
    requestQuantity.value = returnItem.quantity || 0;
  }
  
  editDialogVisible.value = true;
};

const saveEdit = async () => {
  if (!editingItem.value) return;
  
  if (quantityInputRef.value) {
    const isValid = quantityInputRef.value.validate();
    if (!isValid) {
      toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Пожалуйста, проверьте количество', life: 3000 });
      return;
    }
  }
  
  saving.value = true;
  try {
    if (reportType.value === 'sales') {
      const saleItem = editingItem.value as NormalizedSale;
      const originalData = saleItem.originalData as Sale;
      const productId = originalData.productId || originalData.product?.id;
      
      if (!productId) throw new Error('Не удалось определить ID товара');
      
      const updateData: any = {
        productId: productId,
        quantity: editForm.quantity,
        salePrice: editForm.salePrice,
      };
      
      if (authStore.hasRole(Role.ADMIN) && editForm.date) {
        updateData.soldAt = editForm.date.toISOString();
      }
      
      await salesStore.updateSale(saleItem.id, updateData);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Продажа обновлена', life: 3000 });
    } else if (reportType.value === 'returns') {
      const returnItem = editingItem.value as NormalizedReturn;
      const originalData = returnItem.originalData as Return;
      const productId = originalData.productId || originalData.product?.id;
      
      if (!productId) throw new Error('Не удалось определить ID товара');
      
      const updateData: any = {
        productId: productId,
        quantity: editForm.quantity,
        reason: editForm.reason,
      };
      
      if (authStore.hasRole(Role.ADMIN) && editForm.date) {
        updateData.returnedAt = editForm.date.toISOString();
      }
      
      await returnsStore.updateReturn(returnItem.id, updateData);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Возврат обновлен', life: 3000 });
    }
    
    editDialogVisible.value = false;
    await generateReport();
  } catch (e: any) {
    const action = reportType.value === 'sales' ? 'продажу' : 'возврат';
    toast.add({ severity: 'error', summary: 'Ошибка', detail: `Не удалось обновить ${action}: ${e.message}`, life: 3000 });
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (item: NormalizedItem) => {
  if (!canDeleteItem(item)) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'У вас нет прав для удаления', life: 3000 });
    return;
  }
  
  const itemName = getItemName(item);
  if (!confirm(`Вы уверены, что хотите удалить запись "${itemName}"?`)) return;
  
  try {
    if (reportType.value === 'sales') {
      const saleItem = item as NormalizedSale;
      await salesStore.deleteSale(saleItem.id);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Продажа удалена', life: 3000 });
    } else if (reportType.value === 'returns') {
      const returnItem = item as NormalizedReturn;
      await returnsStore.deleteReturn(returnItem.id);
      toast.add({ severity: 'success', summary: 'Успешно', detail: 'Возврат удален', life: 3000 });
    }
    
    await generateReport();
  } catch (e: any) {
    const action = reportType.value === 'sales' ? 'продажу' : 'возврат';
    toast.add({ severity: 'error', summary: 'Ошибка', detail: `Не удалось удалить ${action}: ${e.message}`, life: 3000 });
  }
};

const viewItem = (item: NormalizedItem) => {
  toast.add({ severity: 'info', summary: 'Информация', detail: 'Просмотр деталей записи', life: 3000 });
};

const getItemName = (item: NormalizedItem): string => {
  const anyItem = item as any;
  return anyItem.productName ?? anyItem.name ?? `ID: ${anyItem.id}`;
};
// Валидация дат (без изменений)
const validateDateRange = () => {
  dateRangeError.value = '';
  
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    
    if (start > end) {
      dateRangeError.value = 'Дата начала не может быть позже даты окончания';
      return false;
    }
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      dateRangeError.value = 'Диапазон не должен превышать 1 год';
      return false;
    }
  }
  
  return true;
};

// Генерация отчета (без изменений)
const generateReport = async () => {
  if (!validateDateRange()) return;
  
  isLoading.value = true;
  
  try {
    const params: any = {};
    if (filters.startDate) params.startDate = filters.startDate.toISOString().split('T')[0];
    if (filters.endDate) params.endDate = filters.endDate.toISOString().split('T')[0];

    if (reportType.value === 'sales') {
      await salesStore.fetchSales(params);
    } else if (reportType.value === 'stock') {
      await productsStore.fetchProducts({ limit: 1000 });
    } else if (reportType.value === 'returns') {
      await returnsStore.fetchReturns(params);
    } else {
      await salesStore.fetchSales(params);
    }
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: `Не удалось загрузить отчет: ${error.message}`, life: 3000 });
  } finally {
    isLoading.value = false;
  }
};

// Сброс фильтров (без изменений)
const resetFilters = () => {
  filters.startDate = null;
  filters.endDate = null;
  dateRangeError.value = '';
  generateReport();
};

// График - ИСПРАВЛЕННАЯ ВЕРСИЯ
const initChart = () => {
  if (!mainChartRef.value) return;
  
  // Уничтожаем старый график если есть
  if (mainChart) {
    mainChart.dispose();
    mainChart = null;
  }
  
  // Инициализируем новый график
  mainChart = echarts.init(mainChartRef.value);
  
  // Удаляем старый ResizeObserver если есть
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
  }
  
  // Создаем новый ResizeObserver
  resizeObserver.value = new ResizeObserver(() => {
    if (mainChart) {
      mainChart.resize();
    }
  });
  
  resizeObserver.value.observe(mainChartRef.value);
};

const updateChart = async () => {
  // Ждем следующего тика для обновления DOM
  await nextTick();
  
  // Если график не должен отображаться, выходим
  if (!(reportType.value === 'sales' || reportType.value === 'returns')) {
    if (mainChart) {
      mainChart.clear();
    }
    return;
  }

  // Инициализируем график, если он еще не инициализирован
  if (!mainChart) {
    initChart();
  }

  // Если после инициализации график все еще null, выходим
  if (!mainChart) return;

  // Очищаем предыдущий график
  mainChart.clear();

  // Если нет данных, показываем сообщение
  if (normalizedReportData.value.length === 0) {
    mainChart.setOption({
      graphic: {
        elements: [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'Нет данных для отображения',
            fontSize: 16,
            fill: '#999'
          }
        }]
      }
    });
    return;
  }

  if (reportType.value === 'sales') {
    // Группируем продажи по дате
    const salesByDate: Record<string, { revenue: number; profit: number }> = {};
    
    normalizedReportData.value.forEach(sale => {
      const saleItem = sale as NormalizedSale;
      try {
        const date = new Date(saleItem.date);
        if (isNaN(date.getTime())) return;
        
        const dateKey = (date.toISOString().split('T')[0] || '');
        if (!dateKey) return;
        
        if (!salesByDate[dateKey]) {
          salesByDate[dateKey] = { revenue: 0, profit: 0 };
        }
        
        salesByDate[dateKey]!.revenue += saleItem.totalAmount;
        salesByDate[dateKey]!.profit += saleItem.totalProfit;
      } catch (e) {
        console.error('Error processing sale date:', e);
      }
    });

    const sortedDates = Object.keys(salesByDate).sort();
    
    if (sortedDates.length === 0) {
      mainChart.setOption({
        graphic: {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: 'Нет данных за выбранный период',
              fontSize: 16,
              fill: '#999'
            }
          }]
        }
      });
      return;
    }

    const dates = sortedDates.map(dateStr => {
      try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: 'short'
        }).format(date);
      } catch {
        return dateStr;
      }
    });
    
    const revenues = sortedDates.map(date => salesByDate[date]!.revenue);
    const profits = sortedDates.map(date => salesByDate[date]!.profit);

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach((param: any) => {
            const value = param.value;
            const formattedValue = formatPrice(value).replace('₽', 'руб.');
            result += `${param.seriesName}: ${formattedValue}<br/>`;
          });
          return result;
        },
      },
      legend: { 
        data: ['Выручка', 'Прибыль'], 
        top: 10,
        textStyle: {
          fontSize: 12
        }
      },
      grid: { 
        left: '3%', 
        right: '4%', 
        bottom: '12%', 
        top: '20%', 
        containLabel: true 
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: { 
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value.toString();
          },
          fontSize: 11
        },
      },
      series: [
        {
          name: 'Выручка',
          type: 'line',
          smooth: true,
          data: revenues,
          itemStyle: { 
            color: '#3B82F6',
            borderWidth: 2
          },
          lineStyle: { 
            width: 3 
          },
          symbol: 'circle',
          symbolSize: 6,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
        },
        {
          name: 'Прибыль',
          type: 'line',
          smooth: true,
          data: profits,
          itemStyle: { 
            color: '#10B981',
            borderWidth: 2
          },
          lineStyle: { 
            width: 3, 
            type: 'dashed' 
          },
          symbol: 'circle',
          symbolSize: 6,
        },
      ],
    };

    mainChart.setOption(option);
  } else if (reportType.value === 'returns') {
    // Группируем возвраты по дате
    const returnsByDate: Record<string, number> = {};
    
    normalizedReportData.value.forEach(ret => {
      const returnItem = ret as NormalizedReturn;
      try {
        const date = new Date(returnItem.date);
        if (isNaN(date.getTime())) return;
        
        const dateKey = date.toISOString().split('T')[0] as string;
        returnsByDate[dateKey] = (returnsByDate[dateKey] || 0) + returnItem.quantity;
      } catch (e) {
        console.error('Error processing return date:', e);
      }
    });

    const sortedDates = Object.keys(returnsByDate).sort();
    
    if (sortedDates.length === 0) {
      mainChart.setOption({
        graphic: {
          elements: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: 'Нет данных за выбранный период',
              fontSize: 16,
              fill: '#999'
            }
          }]
        }
      });
      return;
    }

    const dates = sortedDates.map(dateStr => {
      try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: 'short'
        }).format(date);
      } catch {
        return dateStr;
      }
    });
    
    const quantities = sortedDates.map(date => returnsByDate[date]);

    const option = {
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' }
      },
      legend: { 
        data: ['Количество возвратов'], 
        top: 10,
        textStyle: {
          fontSize: 12
        }
      },
      grid: { 
        left: '3%', 
        right: '4%', 
        bottom: '12%', 
        top: '20%', 
        containLabel: true 
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { 
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: { 
        type: 'value',
        axisLabel: {
          fontSize: 11
        }
      },
      series: [{
        name: 'Количество возвратов',
        type: 'bar',
        data: quantities,
        itemStyle: { 
          color: '#F59E0B',
        },
        barMaxWidth: 40,
        label: { 
          show: true, 
          position: 'top', 
          formatter: '{c}',
          fontSize: 11
        }
      }]
    };

    mainChart.setOption(option);
  }
  
  // Принудительно перерисовываем график
  if (mainChart) {
    mainChart.resize();
  }
};

const handleExport = () => {
  if (!normalizedReportData.value.length) {
    toast.add({ severity: 'warn', summary: 'Предупреждение', detail: 'Нет данных для экспорта', life: 3000 });
    return;
  }

  if (exportFormat.value === 'csv') {
    const headers = tableColumns.value.map((col) => col.header);
    const rows = normalizedReportData.value.map((item: any) =>
      tableColumns.value.map((col) => {
        const value = item[col.field];
        if (col.format === 'price') return formatPrice(value).replace('₽', 'RUB');
        if (col.format === 'date') return formatDate(value);
        return value ?? '';
      })
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `report_${reportType.value}_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Данные экспортированы', life: 3000 });
    return;
  }

  const mappedRows = normalizedReportData.value.map((item: any) => ({ ...item }));
  const excelColumns: ExcelColumn[] = tableColumns.value.map((col) => ({
    key: col.field,
    header: col.header,
    type: col.format === 'price' ? 'number' : col.format === 'date' ? 'date' : 'string',
  }));
  const tableKey = reportType.value === 'sales' ? 'sales' : reportType.value === 'returns' ? 'returns' : 'stock';
  const template = getDefaultTemplate(tableKey as any);
  const selectedColumns = template?.columns?.length
    ? excelColumns.filter((c) => template!.columns!.includes(c.key))
    : excelColumns;

  exportExcelTable(selectedColumns, mappedRows, {
    totals: true,
    tableName: reportType.value === 'sales' ? 'Sales' : reportType.value === 'returns' ? 'Returns' : reportType.value === 'stock' ? 'Stock' : 'Report',
    fileName: `report_${reportType.value}_${new Date().toISOString().split('T')[0]}.xlsx`,
  }).then(() => {
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Данные экспортированы в Excel', life: 3000 });
  }).catch(() => {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось экспортировать в Excel', life: 3000 });
  });
};

// Наблюдатели - ИСПРАВЛЕННАЯ ВЕРСИЯ
watch(reportType, async (newType, oldType) => {
  if (newType !== oldType) {
    await generateReport();
    
    // Обновляем график после смены вкладки
    if (newType === 'sales' || newType === 'returns') {
      await nextTick();
      // Уничтожаем старый график
      if (mainChart) {
        mainChart.dispose();
        mainChart = null;
      }
      // Инициализируем и обновляем график
      initChart();
      await updateChart();
    } else {
      // Для вкладок без графика уничтожаем график если он есть
      if (mainChart) {
        mainChart.dispose();
        mainChart = null;
      }
    }
  }
});

watch(() => normalizedReportData.value, () => {
  if (reportType.value === 'sales' || reportType.value === 'returns') {
    nextTick(() => updateChart());
  }
}, { deep: true });

watch(editDialogVisible, (newValue) => {
  if (!newValue) availableQuantity.value = 0;
});

watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    const tabIndex = tabs.value.findIndex(tab => tab.type === newTab);
    if (tabIndex !== -1 && tabIndex !== activeTabIndex.value) {
      activeTabIndex.value = tabIndex;
    }
  }
});

// Хуки жизненного цикла
onBeforeMount(() => restoreTabFromUrl());

onMounted(async () => {
  await generateReport();
  
  if (reportType.value === 'sales' || reportType.value === 'returns') {
    await nextTick();
    initChart();
    updateChart();
  }

  window.addEventListener('resize', () => {
    if (mainChart) {
      mainChart.resize();
    }
  });
});

onBeforeUnmount(() => {
  if (mainChart) {
    mainChart.dispose();
    mainChart = null;
  }
  
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
    resizeObserver.value = null;
  }
  
  window.removeEventListener('resize', () => {
    if (mainChart) {
      mainChart.resize();
    }
  });
});
</script>

<style scoped>
.reports {
  min-height: calc(100vh - 100px);
}

/* Стили для вкладок */
.tab-button-active {
  background-color: var(--primary-color) !important;
  color: white !important;
  border-color: var(--primary-color) !important;
}

.tab-button-active .pi {
  color: white !important;
}

.section-card :deep(.p-card-body) {
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.filters-section {
  padding-top: 0.25rem;
}

.filters-grid {
  align-items: end;
}

/* График */
.chart-container {
  width: 100%;
  height: 400px;
  min-height: 400px;
}

/* Обрезка длинного текста */
.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Таблица */
.report-table :deep(.p-datatable-wrapper) {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.report-table :deep(.p-datatable-thead > tr > th) {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-color: #e5e7eb;
}

.report-table :deep(.p-datatable-tbody > tr) {
  transition: background-color 0.2s ease;
}

.report-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f3f4f6 !important;
}

/* Адаптивность */
@media (max-width: 991px) {
  .chart-container {
    height: 350px;
  }
}

@media (max-width: 768px) {
  .section-header {
    align-items: stretch;
  }

  .chart-container {
    height: 300px;
  }
}

@media (max-width: 576px) {
  .chart-container {
    height: 250px;
  }
}
</style>
