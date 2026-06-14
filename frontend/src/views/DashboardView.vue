<template>
  <div class="dashboard" v-if="!isGuest">
    <h1 class="page-title">Главная</h1>

    <div class="dashboard-grid">
      <!-- Статистика (2 колонки) -->
      <Card class="widget-card stats-widget span-2" v-if="isAdminOrManager">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">📊</div>
            <div class="widget-title">Общая статистика</div>
          </div>
          <div class="stats-content">
            <div class="stats-item">
              <div class="stat-label">Кол-во позиций:</div>
              <div class="stat-value">{{ formatNumber(stats.totalPositions) }}</div>
            </div>
            <div class="stats-item">
              <div class="stat-label">Всего товара:</div>
              <div class="stat-value">{{ formatNumber(stats.totalItemsQuantity) }}</div>
            </div>
            <div class="stats-item">
              <div class="stat-label">Активные позиции:</div>
              <div class="stat-value">{{ formatNumber(stats.activePositions) }}</div>
            </div>
            <div class="stats-item">
              <div class="stat-label">Активные товары:</div>
              <div class="stat-value">{{ formatNumber(stats.activeItemsCount) }}</div>
            </div>
            <div class="stats-item">
              <div class="stat-label">Продано:</div>
              <div class="stat-value">{{ formatNumber(stats.soldItemsCount) }}</div>
            </div>
            <div class="stats-item">
              <div class="stat-label">Возвращено:</div>
              <div class="stat-value">{{ formatNumber(stats.returnedItemsCount) }}</div>
            </div>
            <div class="stats-item">
              <div class="stat-label">На сумму:</div>
              <div class="stat-value">{{ formatPrice(stats.totalValue) }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Новые поступления (2 колонки) -->
      <Card class="widget-card new-arrivals-widget span-2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">📥</div>
            <div class="widget-title">
              Новые поступления
              <small class="text-sm text-500">(новые 5 поступлений)</small>
            </div>
          </div>
          <div class="new-arrivals-content">
            <DataTable
              :value="newArrivals"
              :loading="loading"
              :paginator="false"
              class="new-arrivals-table"
              :rows="5"
              :scrollable="true"
              scrollHeight="200px"
            >
              <Column field="name" header="Товар">
                <template #body="{ data }">
                  <div class="truncate-text" style="max-width: 280px">{{ data.name }}</div>
                </template>
              </Column>
              <Column field="quantity" header="Кол-во" style="width: 80px" />
              <Column field="arrivalDate" style="width: 140px">
                <template #header>
                  <span title="Дата поступления товара на склад (поле «Дата поступления»), а не дата создания карточки в системе">
                    Дата
                  </span>
                </template>
                <template #body="{ data }">
                  {{ formatTime(data.arrivalDate) }}
                </template>
              </Column>
            </DataTable>
            <div class="text-center mt-2">
              <Button 
                label="Все товары" 
                icon="pi pi-list" 
                text 
                size="small" 
                @click="router.push('/products')"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Последние продажи (2 колонки) -->
      <Card class="widget-card recent-sales-widget span-2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">💰</div>
            <div class="widget-title">
              Последние продажи
              <small class="text-sm text-500">(последние 5 продаж)</small>
            </div>
          </div>
          <div class="recent-sales-content">
            <DataTable
              :value="recentSales"
              :loading="loading"
              :paginator="false"
              class="recent-sales-table"
              :rows="5"
              :scrollable="true"
              scrollHeight="200px"
            >
              <Column field="productName" header="Товар">
                <template #body="{ data }">
                  <div class="truncate-text" style="max-width: 280px">{{ data.productName }}</div>
                </template>
              </Column>
              <Column field="quantity" header="Кол-во" style="width: 80px" />
              <Column field="amount" header="Сумма" style="width: 120px">
                <template #body="{ data }">
                  {{ formatPrice(data.amount) }}
                </template>
              </Column>
              <Column field="time" header="Дата" style="width: 140px">
                <template #body="{ data }">
                  {{ formatTime(data.time) }}
                </template>
              </Column>
            </DataTable>
            <div class="text-center mt-2">
              <Button 
                label="Все продажи" 
                icon="pi pi-list" 
                text 
                size="small" 
                @click="router.push('/sales')"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Последние возвраты (2 колонки) -->
      <Card class="widget-card recent-returns-widget span-2" v-if="isAdminOrManager">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">↩️</div>
            <div class="widget-title">
              Последние возвраты
              <small class="text-sm text-500">(последние 5 возвратов)</small>
            </div>
          </div>
          <div class="recent-returns-content">
            <DataTable
              :value="lastReturns"
              :loading="loading"
              :paginator="false"
              class="recent-returns-table"
              :rows="5"
              :scrollable="true"
              scrollHeight="200px"
            >
              <Column field="productName" header="Товар">
                <template #body="{ data }">
                  <div class="truncate-text" style="max-width: 280px">{{ data.productName }}</div>
                </template>
              </Column>
              <Column field="quantity" header="Кол-во" style="width: 80px" />
              <Column field="time" header="Дата" style="width: 140px">
                <template #body="{ data }">
                  {{ formatTime(data.time) }}
                </template>
              </Column>
            </DataTable>
            <div class="text-center mt-2">
              <Button 
                label="Все возвраты" 
                icon="pi pi-list" 
                text 
                size="small" 
                @click="router.push('/reports')"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Динамика продаж (4 колонки) -->
      <Card class="widget-card chart-widget span-4" v-if="isAdminOrManager">
        <template #content>
          <div class="widget-header">
            <div class="widget-title">Динамика продаж</div>
          </div>
          <div class="chart-container">
            <div class="chart-scroll" ref="chartScrollRef">
              <div class="chart-inner">
                <v-chart
                  :option="chartOption"
                  :loading="loading"
                  class="chart"
                />
              </div>
            </div>
            <div v-if="loading" class="chart-placeholder">Загрузка данных...</div>
          </div>
        </template>
      </Card>

      <!-- Последние действия (4 колонки) -->
      <Card class="widget-card actions-widget span-4" v-if="isAdminOrManager">
        <template #content>
          <div class="widget-header">
            <div class="widget-title">Последние действия</div>
          </div>
          <DataTable
            :value="recentActions"
            :loading="loading"
            :paginator="false"
            class="actions-table"
            :rows="5"
            :scrollable="true"
            scrollHeight="220px"
          >
            <Column header="Тип" style="width: 140px">
              <template #body="{ data }">
                {{ data.type }}
              </template>
            </Column>
            <Column header="Сущность">
              <template #body="{ data }">
                <div class="truncate-text" style="max-width: 220px">{{ data.entity }}</div>
              </template>
            </Column>
            <Column header="Детали">
              <template #body="{ data }">
                <div class="truncate-text" style="max-width: 260px">{{ data.details }}</div>
              </template>
            </Column>
            <Column header="Пользователь" style="width: 200px">
              <template #body="{ data }">
                {{ data.user || 'Система' }}
              </template>
            </Column>
            <Column header="Время" style="width: 150px">
              <template #body="{ data }">
                {{ formatTime(data.time) }}
              </template>
            </Column>
          </DataTable>
          <div class="text-center mt-2">
            <Button 
              label="Все действия" 
              icon="pi pi-list" 
              text 
              size="small" 
              @click="router.push('/audit-log')"
            />
          </div>
        </template>
      </Card>

      <!-- Низкий запас (2 колонки) -->
      <Card class="widget-card low-stock-widget span-2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">⚠️</div>
            <div class="widget-title">Низкий запас</div>
          </div>
          <div class="low-stock-content">
            <div class="low-stock-item">
              <div class="low-stock-label">
                Товаров с низким запасом:
                <span class="low-stock-value warning">{{ lowStockProducts.length }}</span>
              </div>
              <div class="stats__container" v-if="lowStockProducts.length > 0">
                <Tag 
                  v-for="(product, index) of lowStockProducts.slice(0, 3)" 
                  :key="index"
                  :value="getNameProductWithQuantity(product)"
                  severity="warn"
                  class="mb-1"
                />
                <div v-if="lowStockProducts.length > 3" class="text-sm text-500 mt-1">
                  + ещё {{ lowStockProducts.length - 3 }}
                </div>
              </div>
              <div v-else class="text-sm text-500 mt-2">
                Все товары в норме
              </div>
            </div>
            <Button
              label="Просмотреть"
              icon="pi pi-eye"
              severity="warning"
              outlined
              @click="viewLowStock"
              :disabled="lowStockProducts.length === 0"
            />
          </div>
        </template>
      </Card>

      <!-- Долгохранящиеся товары (2 колонки) -->
      <Card class="widget-card long-storage-widget span-2">
        <template #content>
          <div class="widget-header" title="Товары которые не продаются больше 90 дней">
            <div class="widget-icon">📦</div>
            <div class="widget-title">Долгохранящиеся товары</div>
          </div>
          <div class="long-storage-content">
            <div class="long-storage-item">
              <div class="long-storage-label">
                Товаров на складе более 90 дней:
                <span class="long-storage-value warning">{{ longStorageProducts.length }}</span>
              </div>
              <div class="stats__container" v-if="longStorageProducts.length > 0">
                <Tag 
                  v-for="(product, index) of longStorageProducts.slice(0, 3)" 
                  :key="index"
                  :value="getNameProductWithQuantity(product)" 
                  severity="info"
                  class="mb-1"
                />
                <div v-if="longStorageProducts.length > 3" class="text-sm text-500 mt-1">
                  + ещё {{ longStorageProducts.length - 3 }}
                </div>
              </div>
              <div v-else class="text-sm text-500 mt-2">
                Нет долгохранящихся товаров
              </div>
            </div>
            <Button
              label="Просмотреть"
              icon="pi pi-eye"
              severity="warning"
              outlined
              @click="viewLongStorage"
              :disabled="longStorageProducts.length === 0"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';
import type { Product } from '@/types/api';
import { storeToRefs } from 'pinia';
import { mapAuditLogToDashboardAction } from '@/utils/audit-log-display';

type DashboardAction = {
  type: string;
  entity: string;
  details: string;
  user: string;
  time: string;
};

const buildRecentProductActions = (
  recentSales: Array<{ productName: string; quantity: number; amount: number; time: string; userName: string }>,
  lastReturns: Array<{ productName: string; quantity: number; time: string; userName: string }>,
  productLogs: Parameters<typeof mapAuditLogToDashboardAction>[0][],
): DashboardAction[] => {
  return [
    ...recentSales.map((sale) => ({
      type: 'Продажа',
      entity: sale.productName,
      details: `${sale.quantity} шт. на ${formatPrice(sale.amount)}`,
      user: sale.userName,
      time: String(sale.time),
    })),
    ...lastReturns.map((ret) => ({
      type: 'Возврат',
      entity: ret.productName,
      details: `${ret.quantity} шт.`,
      user: ret.userName,
      time: String(ret.time),
    })),
    ...productLogs.map(mapAuditLogToDashboardAction),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);
};

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

const router = useRouter();
const authStore = useAuthStore();
const chartScrollRef = ref<HTMLDivElement | null>(null);
const CHART_DAYS = 30;
const REFRESH_MS = 5 * 60 * 1000;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const loading = ref(false);
const stats = ref({
  totalPositions: 0, // Кол-во позиций
  totalItemsQuantity: 0, // Всего товара
  activePositions: 0, // Активные позиции
  activeItemsCount: 0, // Активные товары
  soldItemsCount: 0, // Продано
  returnedItemsCount: 0, // Возвращено
  totalValue: 0, // На сумму
});
const lowStockProducts = ref<Product[]>([]);
const longStorageProducts = ref<Product[]>([]);
const recentActions = ref<Array<{ type: string; entity: string; details: string; user: string; time: string }>>([]);
const recentSales = ref<Array<{ productName: string; quantity: number; amount: number; time: string }>>([]);
const newArrivals = ref<Array<{ name: string; quantity: number; arrivalDate: string }>>([]);
const lastReturns = ref<Array<{ productName: string; quantity: number; time: string }>>([]);
const salesChartData = ref<Array<{ date: string; amount: number }>>([]);

const getRecentChartDateKeys = () =>
  Array.from({ length: CHART_DAYS }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (CHART_DAYS - 1 - index));
    return date.toISOString().split('T')[0];
  }).filter((date): date is string => Boolean(date));

const chartSeriesData = computed(() => {
  const recentDateKeys = getRecentChartDateKeys();
  const salesByDate = new Map<string, number>(recentDateKeys.map((date) => [date, 0]));

  salesChartData.value.forEach((point) => {
    if (salesByDate.has(point.date)) {
      salesByDate.set(point.date, point.amount);
    }
  });

  return recentDateKeys.map((dateKey) => {
    const date = new Date(dateKey);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    return {
      dateKey,
      label: `${day}.${month}`,
      value: salesByDate.get(dateKey) || 0,
    };
  });
});

const hasSalesInChartPeriod = computed(() =>
  chartSeriesData.value.some((item) => item.value > 0),
);

const { isAdminOrManager, isGuest } = storeToRefs(authStore);

const chartOption = computed(() => {
  const dates = chartSeriesData.value.map((item) => item.label);
  const values = chartSeriesData.value.map((item) => item.value);

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.seriesName}: ${formatPrice(param.value)}`;
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
        name: 'Продажи',
        type: 'line',
        smooth: true,
        data: values,
        showSymbol: false,
        itemStyle: {
          color: '#3b82f6',
        },
        lineStyle: {
          width: 3,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
      },
    ],
  };
});

const scrollChartToRight = () => {
  const el = chartScrollRef.value;
  if (!el) return;
  const max = el.scrollWidth - el.clientWidth;
  if (max > 0) el.scrollLeft = max;
};

watch(chartOption, async (opt) => {
  if (!opt) return;
  await nextTick();
  scrollChartToRight();
});

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ru-RU').format(num);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(price);
};

const formatTime = (time: string) => {
  const date = new Date(time);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getNameProductWithQuantity = (product: Product) => {
  return `${product.name} — ${product.quantity} шт.`
}

const loadStats = async () => {
  loading.value = true;
  try {
    const summaryPromise = apiService.getDashboardSummary({ chartDays: CHART_DAYS });
    const productLogsPromise = isAdminOrManager.value
      ? apiService.getAuditLogs({ entityType: 'Product', limit: 5, page: 1 })
      : Promise.resolve(null);

    const [summary, productLogsResponse] = await Promise.all([
      summaryPromise,
      productLogsPromise,
    ]);

    stats.value = summary.stats;
    newArrivals.value = summary.newArrivals.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      arrivalDate: String(item.arrivalDate),
    }));
    lowStockProducts.value = summary.lowStockProducts;
    longStorageProducts.value = summary.longStorageProducts;
    recentSales.value = summary.recentSales.map((sale) => ({
      ...sale,
      time: String(sale.time),
    }));
    lastReturns.value = summary.lastReturns.map((ret) => ({
      ...ret,
      time: String(ret.time),
    }));
    salesChartData.value = summary.salesChart;

    if (productLogsResponse) {
      recentActions.value = buildRecentProductActions(
        summary.recentSales,
        summary.lastReturns,
        productLogsResponse.data,
      );
    }
  } catch (error) {
    console.error('Failed to load dashboard stats', error);
  } finally {
    loading.value = false;
  }
};

const viewLowStock = () => {
  router.push({ name: 'products', query: { lowStock: 'true' } });
};

const viewLongStorage = () => {
  router.push({ name: 'products', query: { longStorage: 'true' } });
};

onMounted(() => {
  loadStats();

  refreshTimer = setInterval(() => {
    if (!loading.value) {
      loadStats();
    }
  }, REFRESH_MS);
  window.addEventListener('resize', scrollChartToRight);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  window.removeEventListener('resize', scrollChartToRight);
});
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.page-title {
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.span-2 {
  grid-column: span 2;
}

.span-4 {
  grid-column: span 4;
}

.widget-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 0;
}

.widget-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.widget-icon {
  font-size: 2rem;
  line-height: 1;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.stats-content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1rem;
}

.long-storage-item,
.low-stock-item {
  /* display: flex;
  flex-flow: column; */
}

.stats__container {
  display: flex;
  flex-flow: row wrap;
  gap: 4px;
  margin: 0.5rem 0;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  background: var(--surface-ground);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  min-width: 0;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  text-align: right;
  word-break: break-word;
}

.stat-value.warning {
  color: var(--orange-500);
}

.low-stock-content,
.long-storage-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.chart-scroll {
  width: 100%;
  height: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chart-inner {
  min-width: 1000px;
  height: 100%;
}

.chart {
  height: 100%;
  width: 100%;
}

.chart-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.chart-empty-state {
  margin-top: 0.75rem;
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.p-card-body) {
  padding: 1.5rem;
}

:deep(.p-card-content) {
  padding: 0;
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-title {
    font-size: 1.6rem;
    margin-bottom: 1.5rem;
  }

  .widget-header {
    gap: 0.5rem;
  }

  .widget-title {
    font-size: 1.1rem;
  }

  .span-4 {
    grid-column: span 2 !important;
  }

  .span-2 {
    grid-column: span 1 !important;
  }

  .stats-content {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .span-4,
  .span-2 {
    grid-column: span 1 !important;
  }

  .stats-content {
    grid-template-columns: 1fr;
  }
  
  .stats-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .page-title {
    font-size: 1.4rem;
    margin-bottom: 1rem;
  }

  .widget-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .widget-icon {
    font-size: 1.5rem;
  }

  .widget-title {
    font-size: 1rem;
  }

  .widget-title small {
    display: none;
  }
}
</style>
