<template>
  <div class="reports">
    <div class="page-header">
      <h1 class="page-title">Отчеты</h1>
      <div class="header-actions">
        <Button
          label="Экспорт в CSV"
          icon="pi pi-file-export"
          severity="secondary"
          outlined
          @click="exportToCSV"
        />
        <Button
          label="Экспорт в Excel"
          icon="pi pi-file-excel"
          severity="success"
          outlined
          @click="exportToExcel"
        />
      </div>
    </div>

    <!-- Фильтры -->
    <Card class="filters-card mb-4">
      <template #title>Фильтры</template>
      <template #content>
        <div class="filters-grid">
          <div class="filter-item">
            <label for="startDate" class="filter-label">Дата начала</label>
            <Calendar
              id="startDate"
              v-model="filters.startDate"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-full"
            />
          </div>
          <div class="filter-item">
            <label for="endDate" class="filter-label">Дата окончания</label>
            <Calendar
              id="endDate"
              v-model="filters.endDate"
              dateFormat="yy-mm-dd"
              showIcon
              class="w-full"
            />
          </div>
          <div class="filter-item">
            <label for="product" class="filter-label">Товар</label>
            <Dropdown
              id="product"
              v-model="filters.productId"
              :options="productOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Все товары"
              class="w-full"
            />
          </div>
          <div class="filter-item">
            <Button
              label="Применить"
              icon="pi pi-filter"
              @click="applyFilters"
            />
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

    <!-- Статистика -->
    <div v-if="salesStore.statistics" class="stats-grid mb-4">
      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon revenue">
              <i class="pi pi-dollar" style="font-size: 2rem"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Общая выручка</div>
              <div class="stat-value">{{ formatPrice(salesStore.statistics.totalRevenue) }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon sales">
              <i class="pi pi-shopping-cart" style="font-size: 2rem"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Всего продаж</div>
              <div class="stat-value">{{ salesStore.statistics.totalSales }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon products">
              <i class="pi pi-box" style="font-size: 2rem"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Товаров продано</div>
              <div class="stat-value">{{ salesStore.statistics.totalProducts }}</div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-icon average">
              <i class="pi pi-chart-line" style="font-size: 2rem"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Средний чек</div>
              <div class="stat-value">{{ formatPrice(salesStore.statistics.averageSalePrice) }}</div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Графики -->
    <div class="charts-grid">
      <Card class="chart-card">
        <template #title>Продажи по датам</template>
        <template #content>
          <div ref="salesByDateChartRef" class="chart-container"></div>
        </template>
      </Card>

      <Card class="chart-card">
        <template #title>Выручка по датам</template>
        <template #content>
          <div ref="revenueByDateChartRef" class="chart-container"></div>
        </template>
      </Card>

      <Card class="chart-card">
        <template #title>Топ товаров по продажам</template>
        <template #content>
          <div ref="topProductsChartRef" class="chart-container"></div>
        </template>
      </Card>

      <Card class="chart-card">
        <template #title>Выручка по товарам</template>
        <template #content>
          <div ref="revenueByProductChartRef" class="chart-container"></div>
        </template>
      </Card>
    </div>

    <!-- Таблица продаж -->
    <Card class="mt-4">
      <template #title>Детализация продаж</template>
      <template #content>
        <DataTable
          :value="salesStore.sales"
          :loading="salesStore.loading"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} - {last} из {totalRecords}"
          :emptyMessage="salesStore.loading ? 'Загрузка...' : 'Нет данных'"
          class="p-datatable-sm"
        >
          <Column field="id" header="ID" :sortable="true" style="width: 80px" />
          <Column field="product.name" header="Товар" :sortable="true" />
          <Column field="quantity" header="Количество" :sortable="true" />
          <Column field="salePrice" header="Цена" :sortable="true">
            <template #body="{ data }">
              {{ formatPrice(data.salePrice) }}
            </template>
          </Column>
          <Column field="totalAmount" header="Сумма" :sortable="true">
            <template #body="{ data }">
              {{ formatPrice(data.totalAmount) }}
            </template>
          </Column>
          <Column field="user.fullName" header="Продавец" />
          <Column field="createdAt" header="Дата" :sortable="true">
            <template #body="{ data }">
              {{ formatDate(data.createdAt) }}
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { saveAs } from 'file-saver';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useSalesStore } from '@/stores/salesStore';
import { useProductsStore } from '@/stores/productsStore';
import ToastService from 'primevue/toastservice';
import { useToast } from 'primevue/usetoast';

const salesStore = useSalesStore();
const productsStore = useProductsStore();
const toast = useToast();

const salesByDateChartRef = ref<HTMLDivElement | null>(null);
const revenueByDateChartRef = ref<HTMLDivElement | null>(null);
const topProductsChartRef = ref<HTMLDivElement | null>(null);
const revenueByProductChartRef = ref<HTMLDivElement | null>(null);

let salesByDateChart: echarts.ECharts | null = null;
let revenueByDateChart: echarts.ECharts | null = null;
let topProductsChart: echarts.ECharts | null = null;
let revenueByProductChart: echarts.ECharts | null = null;

const filters = reactive({
  startDate: null as Date | null,
  endDate: null as Date | null,
  productId: null as number | null,
});

const productOptions = ref<Array<{ label: string; value: number | null }>>([
  { label: 'Все товары', value: null },
]);

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const applyFilters = async () => {
  const params: any = {};
  if (filters.startDate) {
    params.startDate = filters.startDate.toISOString().split('T')[0];
  }
  if (filters.endDate) {
    params.endDate = filters.endDate.toISOString().split('T')[0];
  }
  if (filters.productId) {
    params.productId = filters.productId;
  }

  await salesStore.fetchSales(params);
  await salesStore.fetchStatistics(
    params.startDate,
    params.endDate
  );
  await updateCharts();
};

const resetFilters = () => {
  filters.startDate = null;
  filters.endDate = null;
  filters.productId = null;
  applyFilters();
};

const initCharts = async () => {
  await nextTick();

  if (salesByDateChartRef.value) {
    salesByDateChart = echarts.init(salesByDateChartRef.value);
  }
  if (revenueByDateChartRef.value) {
    revenueByDateChart = echarts.init(revenueByDateChartRef.value);
  }
  if (topProductsChartRef.value) {
    topProductsChart = echarts.init(topProductsChartRef.value);
  }
  if (revenueByProductChartRef.value) {
    revenueByProductChart = echarts.init(revenueByProductChartRef.value);
  }

  await updateCharts();
};

const updateCharts = async () => {
  if (!salesStore.statistics) return;

  // График продаж по датам
  if (salesByDateChart && salesStore.statistics.salesByDate) {
    const dates = salesStore.statistics.salesByDate.map((item) => item.date);
    const counts = salesStore.statistics.salesByDate.map((item) => item.count);

    salesByDateChart.setOption({
      tooltip: {
        trigger: 'axis',
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
          name: 'Количество продаж',
          type: 'line',
          data: counts,
          smooth: true,
          itemStyle: {
            color: '#42b883',
          },
        },
      ],
    });
  }

  // График выручки по датам
  if (revenueByDateChart && salesStore.statistics.salesByDate) {
    const dates = salesStore.statistics.salesByDate.map((item) => item.date);
    const revenues = salesStore.statistics.salesByDate.map((item) => item.revenue);

    revenueByDateChart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return `${params[0].name}<br/>${params[0].seriesName}: ${formatPrice(params[0].value)}`;
        },
      },
      xAxis: {
        type: 'category',
        data: dates,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatPrice(value),
        },
      },
      series: [
        {
          name: 'Выручка',
          type: 'bar',
          data: revenues,
          itemStyle: {
            color: '#2196F3',
          },
        },
      ],
    });
  }

  // Топ товаров по продажам
  if (topProductsChart && salesStore.statistics.salesByProduct) {
    const products = salesStore.statistics.salesByProduct
      .slice(0, 10)
      .map((item) => item.productName);
    const counts = salesStore.statistics.salesByProduct
      .slice(0, 10)
      .map((item) => item.count);

    topProductsChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      xAxis: {
        type: 'value',
      },
      yAxis: {
        type: 'category',
        data: products,
      },
      series: [
        {
          name: 'Количество продаж',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#FF9800',
          },
        },
      ],
    });
  }

  // Выручка по товарам
  if (revenueByProductChart && salesStore.statistics.salesByProduct) {
    const products = salesStore.statistics.salesByProduct
      .slice(0, 10)
      .map((item) => item.productName);
    const revenues = salesStore.statistics.salesByProduct
      .slice(0, 10)
      .map((item) => item.revenue);

    revenueByProductChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>${formatPrice(params.value)}`;
        },
      },
      series: [
        {
          name: 'Выручка',
          type: 'pie',
          radius: '60%',
          data: products.map((name, index) => ({
            value: revenues[index],
            name,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    });
  }
};

const exportToCSV = () => {
  if (!salesStore.sales.length) {
    toast.add({
      severity: 'warn',
      summary: 'Предупреждение',
      detail: 'Нет данных для экспорта',
      life: 3000,
    });
    return;
  }

  const headers = ['ID', 'Товар', 'Количество', 'Цена', 'Сумма', 'Продавец', 'Дата'];
  const rows = salesStore.sales.map((sale) => [
    sale.id,
    sale.product?.name || '',
    sale.quantity,
    sale.salePrice,
    sale.totalAmount,
    sale.user?.fullName || '',
    formatDate(sale.createdAt),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `sales_report_${new Date().toISOString().split('T')[0]}.csv`);

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

watch(
  () => salesStore.statistics,
  () => {
    updateCharts();
  },
  { deep: true }
);

onMounted(async () => {
  // Загружаем товары для фильтра
  await productsStore.fetchProducts({ limit: 1000 });
  productOptions.value = [
    { label: 'Все товары', value: null },
    ...productsStore.products.map((p) => ({ label: p.name, value: p.id })),
  ];

  await applyFilters();
  await initCharts();

  // Обработка изменения размера окна
  window.addEventListener('resize', () => {
    salesByDateChart?.resize();
    revenueByDateChart?.resize();
    topProductsChart?.resize();
    revenueByProductChart?.resize();
  });
});
</script>

<style scoped>
.reports {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.sales {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.products {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.average {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  height: 400px;
}

.chart-container {
  width: 100%;
  height: 350px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 300px;
  }
}
</style>

