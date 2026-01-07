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
              <Button
                :label="'Возвраты товара'"
                :class="{ active: reportType === 'returns' }"
                class="report-type-btn"
                @click="reportType = 'returns'"
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
        <div v-if="reportType === 'sales' && normalizedReportData.length" class="stats-panel mb-4">
          <Card class="stat-card">
            <template #content>
              <div class="stat-item">
                <div class="stat-label">Общая выручка:</div>
                <div class="stat-value">{{ formatPrice(calculatedStats.totalRevenue) }}</div>
              </div>
            </template>
          </Card>
          <Card class="stat-card">
            <template #content>
              <div class="stat-item">
                <div class="stat-label">Прибыль:</div>
                <div class="stat-value profit">{{ formatPrice(calculatedStats.totalProfit) }}</div>
              </div>
            </template>
          </Card>
          <Card class="stat-card">
            <template #content>
              <div class="stat-item">
                <div class="stat-label">Количество чеков:</div>
                <div class="stat-value">{{ calculatedStats.totalInvoices }}</div>
              </div>
            </template>
          </Card>
          <Card class="stat-card">
            <template #content>
              <div class="stat-item">
                <div class="stat-label">Товаров продано:</div>
                <div class="stat-value">{{ calculatedStats.totalItemsSold }}</div>
              </div>
            </template>
          </Card>
        </div>

        <!-- График -->
        <Card v-if="reportType === 'sales'" class="chart-card mb-4">
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
              <!-- Динамические колонки данных -->
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

              <Column header="Действия" :exportable="false" style="min-width: 8rem">
                <template #body="{ data }">
                  <div class="report-table__actions">
                    <!-- Редактировать: только для ADMIN -->
                    <Button 
                      v-if="authStore.hasRole(Role.ADMIN)"
                      class="p-button-xs"
                      icon="pi pi-pencil"
                      severity="info"
                      size="small"
                      outlined
                      rounded
                      v-tooltip.top="'Редактировать'"
                      @click="editItem(data)" 
                    />
                    
                    <!-- Удалить: для ADMIN и MANAGER -->
                    <Button
                      class="p-button-xs"
                      icon="pi pi-trash"
                      size="small"
                      outlined 
                      rounded 
                      severity="danger"
                      v-tooltip.top="'Удалить'"
                      @click="deleteItem(data)" 
                    />
                  </div>
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
import { useReturnsStore } from '@/stores/returnsStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'primevue/usetoast';
import type { Sale, Product } from '@/types/api';
import { Role } from '@/types/api';

// Типы для нормализованных данных
interface NormalizedSale {
  id: number;
  productName: string;
  quantity: number;
  salePrice: number;
  purchasePrice: number; // Добавляем закупочную цену
  totalAmount: number;
  totalProfit: number; // Добавляем прибыль по позиции
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
  quantity: number;
  reason: string;
  returnedBy: string;
  date: string;
  originalData?: any;
}

interface ReportColumn {
  field: string;
  header: string;
  sortable: boolean;
  format?: 'price' | 'date';
}

interface CalculatedStats {
  totalRevenue: number;
  totalProfit: number;
  totalInvoices: number;
  totalItemsSold: number;
}

const salesStore = useSalesStore();
const productsStore = useProductsStore();
const returnsStore = useReturnsStore();
const authStore = useAuthStore();
const toast = useToast();

const reportType = ref<'sales' | 'stock' | 'movement' | 'returns'>('sales');
const mainChartRef = ref<HTMLDivElement | null>(null);
let mainChart: echarts.ECharts | null = null;

// Предположим, роль берется из вашего store
// const userRole = computed(() => authStore.user?.role); 
// const userRole = 'ADMIN'; // Для теста: 'ADMIN' или 'MANAGER'
const userRole = authStore.hasRole(Role.MANAGER)
console.log('userRole:', userRole);


const filters = reactive({
  startDate: null as Date | null,
  endDate: null as Date | null,
});

const exportFormat = ref<'excel' | 'csv'>('csv');
const exportFormats = [
  // { label: 'Excel', value: 'excel' },
  { label: 'CSV', value: 'csv' },
];

// Нормализация данных для таблицы
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
      quantity: ret.quantity,
      reason: ret.reason || '-',
      returnedBy: ret.user?.fullName || 'Неизвестно',
      date: ret.returnedAt,
      originalData: ret
    }));
  } else {
    // Для движения товаров
    return salesStore.sales.map((sale): NormalizedSale => {
      const salePrice = Number(sale.salePrice) || 0;
      const quantity = sale.quantity;
      const totalAmount = salePrice * quantity;
      
      return {
        id: sale.id,
        productName: sale.product?.name || 'Неизвестный товар',
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

// Расчет статистики на основе нормализованных данных
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
    acc.totalRevenue += item.totalAmount;
    acc.totalProfit += item.totalProfit;
    acc.totalItemsSold += item.quantity;
    return acc;
  }, {
    totalRevenue: 0,
    totalProfit: 0,
    totalInvoices: normalizedReportData.value.length, // Каждая запись - это отдельный чек
    totalItemsSold: 0
  });

  return stats;
});

// Колонки для таблицы
const tableColumns = computed<ReportColumn[]>(() => {
  if (reportType.value === 'sales') {
    return [
      { field: 'id', header: 'ID чека', sortable: true },
      { field: 'productName', header: 'Товар', sortable: true },
      { field: 'quantity', header: 'Количество', sortable: true },
      { field: 'totalAmount', header: 'Сумма продажи', sortable: true, format: 'price' },
      { field: 'totalProfit', header: 'Прибыль', sortable: true, format: 'price' },
      { field: 'seller', header: 'Продавец', sortable: true },
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
      { field: 'seller', header: 'Продавец', sortable: true },
      { field: 'date', header: 'Дата', sortable: true, format: 'date' },
    ];
  }
});

// Ваши методы
const editItem = (item: any) => {
  console.log('Редактирование записи:', item.id);
};

const deleteItem = (item: any) => {
  if (confirm(`Вы уверены, что хотите удалить запись ${item.id}?`)) {
    console.log('Удаление записи:', item.id);
  }
};

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
    // Не загружаем statistics, т.к. считаем самостоятельно
  } else if (reportType.value === 'stock') {
    await productsStore.fetchProducts({ limit: 1000 });
  } else if (reportType.value === 'returns') {
    await returnsStore.fetchReturns(params);
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
  if (!mainChart || (reportType.value !== 'sales' && reportType.value !== 'returns')) return;

  mainChart.clear();

  if (reportType.value === 'sales') {
    // Группируем продажи по дате для графика
    if (normalizedReportData.value.length) {
      const salesByDate: Record<string, { revenue: number; profit: number }> = {};
      
      normalizedReportData.value.forEach(sale => {
        const date = new Date(sale.date);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!salesByDate[dateKey]) {
          salesByDate[dateKey] = { revenue: 0, profit: 0 };
        }
        
        salesByDate[dateKey].revenue += sale.totalAmount;
        salesByDate[dateKey].profit += sale.totalProfit;
      });

      // Сортируем даты по возрастанию
      const sortedDates = Object.keys(salesByDate).sort();
      
      const dates = sortedDates.map(dateStr => {
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit'
        }).format(new Date(dateStr));
      });
      
      const revenues = sortedDates.map(date => salesByDate[date].revenue);
      const profits = sortedDates.map(date => salesByDate[date].profit);

      mainChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: (params: any) => {
            let result = `${params[0].axisValueLabel}<br/>`;
            params.forEach((param: any) => {
              if (param.seriesName === 'Выручка') {
                result += `${param.seriesName}: ${formatPrice(param.value)}<br/>`;
              } else if (param.seriesName === 'Прибыль') {
                result += `${param.seriesName}: ${formatPrice(param.value)}<br/>`;
              }
            });
            return result;
          },
        },
        legend: {
          data: ['Выручка', 'Прибыль']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '40px',
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
          {
            name: 'Прибыль',
            type: 'line',
            smooth: true,
            data: profits,
            itemStyle: {
              color: '#52c41a',
            },
            lineStyle: {
              type: 'dashed'
            }
          },
        ],
      });
    }
  } else if (reportType.value === 'returns') {
    // График возвратов
    if (normalizedReportData.value.length) {
      const returnsByDate: Record<string, number> = {};
      
      normalizedReportData.value.forEach(ret => {
        const date = new Date(ret.date);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!returnsByDate[dateKey]) {
          returnsByDate[dateKey] = 0;
        }
        
        returnsByDate[dateKey] += ret.quantity;
      });

      const sortedDates = Object.keys(returnsByDate).sort();
      
      const dates = sortedDates.map(dateStr => {
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit'
        }).format(new Date(dateStr));
      });
      
      const quantities = sortedDates.map(date => returnsByDate[date]);

      mainChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['Количество возвратов']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '40px',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: dates,
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: 'Количество возвратов',
            type: 'bar',
            data: quantities,
            itemStyle: {
              color: '#fa8c16',
            },
            barMaxWidth: 50
          }
        ]
      });
    }
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

// Обновляем график при изменении данных
watch(
  () => normalizedReportData.value,
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
  grid-template-columns: repeat(4, 1fr);
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

.report-table__actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 1200px) {
  .stats-panel {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .reports-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}
</style>