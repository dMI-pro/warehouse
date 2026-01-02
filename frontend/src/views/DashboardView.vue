<template>
  <div class="dashboard">
    <h1 class="page-title">Главная</h1>

    <div class="dashboard-grid">
      <!-- Статистика (2 колонки) -->
      <Card class="widget-card stats-widget" style="grid-column: span 2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">📦</div>
            <div class="widget-title">Статистика</div>
          </div>
          <div class="stats-content">
            <div class="stat-item">
              <div class="stat-label">Всего товаров:</div>
              <div class="stat-value">{{ formatNumber(stats.totalProducts) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">На сумму:</div>
              <div class="stat-value">{{ formatPrice(stats.totalValue) }}</div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Низкий запас (2 колонки) -->
      <Card class="widget-card low-stock-widget" style="grid-column: span 2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">⚠️</div>
            <div class="widget-title">Низкий запас</div>
          </div>
          <div class="low-stock-content">
            <div class="stat-item">
              <div class="stat-label">Товаров с низким запасом:</div>
              <div class="stat-value warning">{{ lowStockCount }}</div>
            </div>
            <Button
              label="Просмотреть"
              icon="pi pi-eye"
              severity="warning"
              outlined
              @click="viewLowStock"
            />
          </div>
        </template>
      </Card>

      <!-- График продаж (4 колонки) -->
      <Card class="widget-card chart-widget" style="grid-column: span 4">
        <template #content>
          <div class="widget-header">
            <div class="widget-title">Динамика продаж</div>
          </div>
          <div class="chart-container">
            <v-chart
              v-if="chartOption"
              :option="chartOption"
              :loading="loading"
              class="chart"
            />
            <div v-else class="chart-placeholder">Загрузка данных...</div>
          </div>
        </template>
      </Card>

      <!-- Последние действия (4 колонки) -->
      <Card class="widget-card actions-widget" style="grid-column: span 4">
        <template #content>
          <div class="widget-header">
            <div class="widget-title">Последние действия</div>
          </div>
          <DataTable
            :value="recentActions"
            :loading="loading"
            :paginator="false"
            class="actions-table"
          >
            <Column field="user" header="Пользователь">
              <template #body="{ data }">
                {{ data.user || 'Система' }}
              </template>
            </Column>
            <Column field="action" header="Действие" />
            <Column field="time" header="Время">
              <template #body="{ data }">
                {{ formatTime(data.time) }}
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useAuthStore } from '@/stores/authStore';
import { useProductsStore } from '@/stores/productsStore';
import { apiService } from '@/services/api';
import type { Product, Sale } from '@/types/api';
import { useSalesStore } from '@/stores/salesStore';

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
const productsStore = useProductsStore();
const salesStore = useSalesStore();

const loading = ref(false);
const stats = ref({
  totalProducts: 0,
  totalValue: 0,
});
const lowStockCount = ref(0);
const recentActions = ref<Array<{ user: string; action: string; time: string }>>([]);
const salesData = ref<Sale[]>([]);

const chartOption = computed(() => {
  if (!salesData.value.length) return null;

  // Группируем продажи по датам за последние 30 дней
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  }).filter((d): d is string => !!d);

  const salesByDate = new Map<string, number>();
  last30Days.forEach((date) => {
    if (date) {
      salesByDate.set(date, 0);
    }
  });

  salesData.value.forEach((sale) => {
    if (sale.createdAt) {
      const date = sale.createdAt.split('T')[0];
      if (date && salesByDate.has(date)) {
        salesByDate.set(date, (salesByDate.get(date) || 0) + sale.totalAmount);
      }
    }
  });

  const dates = last30Days.map((d) => {
    if (d) {
      const date = new Date(d);
      return `${date.getDate()}.${date.getMonth() + 1}`;
    }
    return '';
  }).filter(Boolean);
  const values = Array.from(salesByDate.values());

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
        itemStyle: {
          color: '#3b82f6',
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

const loadStats = async () => {
  loading.value = true;
  try {
    // Загружаем товары для статистики
    const productsData = await apiService.getProducts({ limit: 1000 });
    stats.value.totalProducts = productsData.meta?.total || 0;

    // Вычисляем общую стоимость товаров
    let totalValue = 0;
    productsData.data.forEach((product: Product) => {
      totalValue += product.salePrice * product.quantity;
    });
    stats.value.totalValue = totalValue;

    // Подсчитываем товары с низким запасом
    lowStockCount.value = productsData.data.filter(
      (product: Product) => product.quantity <= product.minStockLevel
    ).length;

    // Загружаем продажи для графика
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const salesResponse = await apiService.getSales({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 1000,
    });
    salesData.value = salesResponse.data;

    // Формируем список последних действий из продаж
    recentActions.value = salesResponse.data.slice(0, 10).map((sale: Sale) => ({
      user: sale.user?.fullName || sale.user?.username || 'Неизвестно',
      action: `Продажа: ${sale.product?.name || 'Товар'} (${sale.quantity} шт.)`,
      time: sale.createdAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to load dashboard stats', error);
  } finally {
    loading.value = false;
  }
};

const viewLowStock = () => {
  router.push({ name: 'products', query: { lowStock: 'true' } });
};

onMounted(() => {
  loadStats();
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

.widget-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

.stat-value.warning {
  color: var(--orange-500);
}

.low-stock-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-container {
  height: 300px;
  width: 100%;
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
}

.actions-table {
  margin-top: 1rem;
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

  .stats-widget,
  .low-stock-widget {
    grid-column: span 1 !important;
  }

  .chart-widget,
  .actions-widget {
    grid-column: span 2 !important;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stats-widget,
  .low-stock-widget,
  .chart-widget,
  .actions-widget {
    grid-column: span 1 !important;
  }
}
</style>
