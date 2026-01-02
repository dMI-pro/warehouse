<template>
  <div class="reports">
    <div class="reports-layout">
      <!-- Левая панель -->
      <div class="sidebar">
        <Card class="sidebar-card">
          <template #content>
            <h3 class="sidebar-title">Типы отчетов</h3>
            <div class="report-types">
              <Button
                :label="'Продажи'"
                :class="{ active: reportType === 'sales' }"
                class="report-type-btn"
                @click="reportType = 'sales'"
              />
              <Button
                :label="'Остатки'"
                :class="{ active: reportType === 'stock' }"
                class="report-type-btn"
                @click="reportType = 'stock'"
              />
              <Button
                :label="'Движение товаров'"
                :class="{ active: reportType === 'movement' }"
                class="report-type-btn"
                @click="reportType = 'movement'"
              />
            </div>

            <Divider />

            <div class="filters-section">
              <h4 class="filters-title">Фильтры периода</h4>
              <div class="filter-field">
                <label for="startDate" class="filter-label">Дата начала</label>
                <Calendar
                  id="startDate"
                  v-model="filters.startDate"
                  dateFormat="yy-mm-dd"
                  showIcon
                  class="w-full"
                />
              </div>
              <div class="filter-field">
                <label for="endDate" class="filter-label">Дата окончания</label>
                <Calendar
                  id="endDate"
                  v-model="filters.endDate"
                  dateFormat="yy-mm-dd"
                  showIcon
                  class="w-full"
                />
              </div>
              <Button
                label="Сгенерировать отчет"
                icon="pi pi-chart-bar"
                class="w-full generate-btn"
                @click="generateReport"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Основная область -->
      <div class="main-content">
        <!-- Панель экспорта -->
        <Card class="export-panel mb-4">
          <template #content>
            <div class="export-controls">
              <div class="export-select">
                <label for="exportFormat" class="export-label">Формат экспорта:</label>
                <Dropdown
                  id="exportFormat"
                  v-model="exportFormat"
                  :options="exportFormats"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                />
              </div>
              <Button
                label="Экспортировать"
                icon="pi pi-download"
                @click="handleExport"
              />
            </div>
          </template>
        </Card>

        <!-- Статистика -->
        <div v-if="salesStore.statistics" class="stats-panel mb-4">
          <Card class="stat-card">
            <template #content>
              <div class="stat-item">
                <div class="stat-label">Общая выручка:</div>
                <div class="stat-value">{{ formatPrice(salesStore.statistics.totalRevenue) }}</div>
              </div>
            </template>
          </Card>
          <Card class="stat-card">
            <template #content>
              <div class="stat-item">
                <div class="stat-label">Прибыль:</div>
                <div class="stat-value profit">{{ formatPrice(calculateProfit()) }}</div>
              </div>
            </template>
          </Card>
          <Card class="stat-card">
            <template #content>
              <div class="stat-item">
                <div class="stat-label">Количество продаж:</div>
                <div class="stat-value">{{ salesStore.statistics.totalSales }}</div>
              </div>
            </template>
          </Card>
        </div>

        <!-- График -->
        <Card class="chart-card mb-4">
          <template #title>Динамика продаж</template>
          <template #content>
            <div ref="mainChartRef" class="chart-container"></div>
          </template>
        </Card>

        <!-- Таблица -->
        <Card>
          <template #title>Детализация отчета</template>
          <template #content>
            <DataTable
              :value="normalizedReportData"
              :loading="salesStore.loading"
              :paginator="true"
              :rows="20"
              :rowsPerPageOptions="[20, 50, 100]"
              paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
              currentPageReportTemplate="{first} - {last} из {totalRecords}"
              :emptyMessage="salesStore.loading ? 'Загрузка...' : 'Нет данных'"
              class="report-table"
            >
              <Column
                v-for="column in tableColumns"
                :key="column.field"
                :field="column.field"
                :header="column.header"
                :sortable="column.sortable"
              >
                <template #body="{ data }">
                  <template v-if="column.format === 'price'">
                    {{ formatPrice(data[column.field]) }}
                  </template>
                  <template v-else-if="column.format === 'date'">
                    {{ formatDate(data[column.field]) }}
                  </template>
                  <template v-else>
                    {{ data[column.field] }}
                  </template>
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { saveAs } from 'file-saver';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Divider from 'primevue/divider';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useSalesStore } from '@/stores/salesStore';
import { useProductsStore } from '@/stores/productsStore';
import { useToast } from 'primevue/usetoast';
import type { Sale, Product } from '@/types/api';

// Типы для нормализованных данных
interface NormalizedSale {
  id: number;
  productName: string;
  quantity: number;
  salePrice: number;
  totalAmount: number;
  seller: string;
  date: string;
  originalData?: Sale; // Сохраняем оригинальные данные для экспорта
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

interface ReportColumn {
  field: string;
  header: string;
  sortable: boolean;
  format?: 'price' | 'date';
}

const salesStore = useSalesStore();
const productsStore = useProductsStore();
const toast = useToast();

const reportType = ref<'sales' | 'stock' | 'movement'>('sales');
const mainChartRef = ref<HTMLDivElement | null>(null);
let mainChart: echarts.ECharts | null = null;

const filters = reactive({
  startDate: null as Date | null,
  endDate: null as Date | null,
});

const exportFormat = ref<'excel' | 'csv'>('csv');
const exportFormats = [
  { label: 'Excel', value: 'excel' },
  { label: 'CSV', value: 'csv' },
];

// Нормализация данных для таблицы
const normalizedReportData = computed(() => {
  if (reportType.value === 'sales') {
    return salesStore.sales.map((sale): NormalizedSale => ({
      id: sale.id,
      productName: sale.product?.name || 'Неизвестный товар',
      quantity: sale.quantity,
      salePrice: Number(sale.salePrice) || 0,
      totalAmount: (Number(sale.salePrice) || 0) * sale.quantity,
      seller: sale.user?.fullName || 'Неизвестный продавец',
      date: sale.soldAt || sale.createdAt || new Date().toISOString(),
      originalData: sale
    }));
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
  } else {
    // Для движения товаров
    return salesStore.sales.map((sale): NormalizedSale => ({
      id: sale.id,
      productName: sale.product?.name || 'Неизвестный товар',
      quantity: sale.quantity,
      salePrice: Number(sale.salePrice) || 0,
      totalAmount: (Number(sale.salePrice) || 0) * sale.quantity,
      seller: sale.user?.fullName || 'Неизвестный продавец',
      date: sale.soldAt || sale.createdAt || new Date().toISOString(),
      originalData: sale
    }));
  }
});

// Колонки для таблицы
const tableColumns = computed<ReportColumn[]>(() => {
  if (reportType.value === 'sales') {
    return [
      { field: 'id', header: 'ID', sortable: true },
      { field: 'productName', header: 'Товар', sortable: true },
      { field: 'quantity', header: 'Количество', sortable: true },
      { field: 'salePrice', header: 'Цена', sortable: true, format: 'price' },
      { field: 'totalAmount', header: 'Сумма', sortable: true, format: 'price' },
      { field: 'seller', header: 'Продавец', sortable: false },
      { field: 'date', header: 'Дата', sortable: true, format: 'date' },
    ];
  } else if (reportType.value === 'stock') {
    return [
      { field: 'id', header: 'ID', sortable: true },
      { field: 'name', header: 'Название', sortable: true },
      { field: 'sku', header: 'Артикул', sortable: true },
      { field: 'quantity', header: 'Количество', sortable: true },
      { field: 'minStockLevel', header: 'Мин. запас', sortable: true },
      { field: 'salePrice', header: 'Цена', sortable: true, format: 'price' },
    ];
  } else {
    return [
      { field: 'id', header: 'ID', sortable: true },
      { field: 'productName', header: 'Товар', sortable: true },
      { field: 'quantity', header: 'Количество', sortable: true },
      { field: 'totalAmount', header: 'Сумма', sortable: true, format: 'price' },
      { field: 'seller', header: 'Продавец', sortable: false },
      { field: 'date', header: 'Дата', sortable: true, format: 'date' },
    ];
  }
});

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
    if (isNaN(date.getTime())) {
      return 'Неверная дата';
    }
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return 'Ошибка даты';
  }
};

const calculateProfit = () => {
  if (!salesStore.statistics) return 0;
  return salesStore.statistics.totalRevenue * 0.3;
};

const generateReport = async () => {
  const params: any = {};
  if (filters.startDate) {
    params.startDate = filters.startDate.toISOString().split('T')[0];
  }
  if (filters.endDate) {
    params.endDate = filters.endDate.toISOString().split('T')[0];
  }

  if (reportType.value === 'sales') {
    await salesStore.fetchSales(params);
    await salesStore.fetchStatistics(params.startDate, params.endDate);
  } else if (reportType.value === 'stock') {
    await productsStore.fetchProducts({ limit: 1000 });
  } else {
    // Для движения товаров
    await salesStore.fetchSales(params);
  }

  await updateChart();
};

const initChart = async () => {
  await nextTick();
  if (mainChartRef.value) {
    mainChart = echarts.init(mainChartRef.value);
    await updateChart();
  }
};

const updateChart = async () => {
  if (!mainChart || !salesStore.statistics) return;

  if (reportType.value === 'sales' && salesStore.statistics.salesByDate) {
    const dates = salesStore.statistics.salesByDate.map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}.${date.getMonth() + 1}`;
    });
    const revenues = salesStore.statistics.salesByDate.map((item) => item.revenue);

    mainChart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return `${params[0].name}<br/>${params[0].seriesName}: ${formatPrice(params[0].value)}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}М`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}К`;
            return value.toString();
          },
        },
      },
      series: [
        {
          name: 'Выручка',
          type: 'line',
          smooth: true,
          data: revenues,
          itemStyle: {
            color: '#1890ff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ],
            },
          },
        },
      ],
    });
  }
};

const handleExport = () => {
  if (exportFormat.value === 'csv') {
    exportToCSV();
  } else {
    exportToExcel();
  }
};

const exportToCSV = () => {
  if (!normalizedReportData.value.length) {
    toast.add({
      severity: 'warn',
      summary: 'Предупреждение',
      detail: 'Нет данных для экспорта',
      life: 3000,
    });
    return;
  }

  const headers = tableColumns.value.map((col) => col.header);
  const rows = normalizedReportData.value.map((item: any) =>
    tableColumns.value.map((col) => {
      const value = item[col.field];
      
      // Форматирование для экспорта
      if (col.format === 'price') {
        return formatPrice(value).replace('₽', 'RUB');
      } else if (col.format === 'date') {
        return formatDate(value);
      }
      return value ?? '';
    })
  );

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `report_${reportType.value}_${new Date().toISOString().split('T')[0]}.csv`);

  toast.add({
    severity: 'success',
    summary: 'Успешно',
    detail: 'Данные экспортированы в CSV',
    life: 3000,
  });
};

const exportToExcel = () => {
  exportToCSV();
  toast.add({
    severity: 'info',
    summary: 'Информация',
    detail: 'Excel экспорт использует CSV формат',
    life: 3000,
  });
};

watch(reportType, () => {
  generateReport();
});

watch(
  () => salesStore.statistics,
  () => {
    updateChart();
  },
  { deep: true }
);

onMounted(async () => {
  await generateReport();
  await initChart();

  window.addEventListener('resize', () => {
    mainChart?.resize();
  });
});
</script>

<style scoped>
.reports {
  max-width: 1600px;
  margin: 0 auto;
}

.reports-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 1.5rem;
}

.sidebar {
  position: sticky;
  top: 1rem;
  height: fit-content;
}

.sidebar-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.report-types {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.report-type-btn {
  width: 100%;
  justify-content: flex-start;
}

.report-type-btn.active {
  background: var(--primary-color);
  color: white;
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.generate-btn {
  margin-top: 0.5rem;
}

.main-content {
  display: flex;
  flex-direction: column;
}

.export-panel {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.export-controls {
  display: flex;
  gap: 1rem;
  align-items: end;
}

.export-select {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.export-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.stat-value.profit {
  color: var(--success-color);
}

.chart-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-container {
  width: 100%;
  height: 400px;
}

.report-table {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1024px) {
  .reports-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .stats-panel {
    grid-template-columns: 1fr;
  }
}
</style>