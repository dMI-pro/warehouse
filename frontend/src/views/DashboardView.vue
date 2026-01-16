<template>
  <div class="dashboard">
    <h1 class="page-title">Главная</h1>

    <div class="dashboard-grid">
      <!-- Статистика (2 колонки) -->
      <Card class="widget-card stats-widget" style="grid-column: span 2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">📊</div>
            <div class="widget-title">Общая статистика</div>
          </div>
          <div class="stats-content">
            <div class="stat-item">
              <div class="stat-label">Кол-во позиций:</div>
              <div class="stat-value">{{ formatNumber(stats.totalPositions) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Всего товара:</div>
              <div class="stat-value">{{ formatNumber(stats.totalItemsQuantity) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Активные позиции:</div>
              <div class="stat-value">{{ formatNumber(stats.activePositions) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Активные товары:</div>
              <div class="stat-value">{{ formatNumber(stats.activeItemsCount) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Продано:</div>
              <div class="stat-value">{{ formatNumber(stats.soldItemsCount) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Возвращено:</div>
              <div class="stat-value">{{ formatNumber(stats.returnedItemsCount) }}</div>
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
              <div class="stat-label">
                Товаров с низким запасом:
                <span class="stat-value warning">{{ lowStockProducts.length }}</span>
              </div>
              <div class="stats__container" v-if="lowStockProducts.length > 0">
                <Tag 
                  v-for="(product, index) of lowStockProducts.slice(0, 3)" 
                  :key="index"
                  :value="product.name" 
                  severity="warning"
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

      <!-- Последние продажи (2 колонки) -->
      <Card class="widget-card recent-sales-widget" style="grid-column: span 2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">💰</div>
            <div class="widget-title">Последние продажи</div>
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
                  <div class="truncate-text" style="max-width: 120px">{{ data.productName }}</div>
                </template>
              </Column>
              <Column field="quantity" header="Кол-во" style="width: 80px" />
              <Column field="amount" header="Сумма" style="width: 120px">
                <template #body="{ data }">
                  {{ formatPrice(data.amount) }}
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
      <Card class="widget-card recent-returns-widget" style="grid-column: span 2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">↩️</div>
            <div class="widget-title">Последние возвраты</div>
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
                  <div class="truncate-text" style="max-width: 120px">{{ data.productName }}</div>
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

      <!-- Новые поступления (2 колонки) -->
      <Card class="widget-card new-arrivals-widget" style="grid-column: span 2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">📥</div>
            <div class="widget-title">Новые поступления</div>
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
                  <div class="truncate-text" style="max-width: 120px">{{ data.name }}</div>
                </template>
              </Column>
              <Column field="quantity" header="Кол-во" style="width: 80px" />
              <Column field="arrivalDate" header="Дата" style="width: 120px">
                <template #body="{ data }">
                  {{ formatDate(data.arrivalDate) }}
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

      <!-- Долгохранящиеся товары (2 колонки) -->
      <Card class="widget-card long-storage-widget" style="grid-column: span 2">
        <template #content>
          <div class="widget-header">
            <div class="widget-icon">📦</div>
            <div class="widget-title">Долгохранящиеся товары</div>
          </div>
          <div class="long-storage-content">
            <div class="stat-item">
              <div class="stat-label">
                Товаров на складе более 90 дней:
                <span class="stat-value warning">{{ longStorageProducts.length }}</span>
              </div>
              <div class="stats__container" v-if="longStorageProducts.length > 0">
                <Tag 
                  v-for="(product, index) of longStorageProducts.slice(0, 3)" 
                  :key="index"
                  :value="product.name" 
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
              @click="router.push('/audit-logs')"
            />
          </div>
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
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useAuthStore } from '@/stores/authStore';
import { useProductsStore } from '@/stores/productsStore';
import { apiService } from '@/services/api';
import type { Product, Sale, Return as ApiReturn } from '@/types/api';
import { useSalesStore } from '@/stores/salesStore';
import { useReturnsStore } from '@/stores/returnsStore';

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
const returnsStore = useReturnsStore();

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
const recentSales = ref<Array<{ productName: string; quantity: number; amount: number }>>([]);
const newArrivals = ref<Array<{ name: string; quantity: number; arrivalDate: string }>>([]);
const lastReturns = ref<Array<{ productName: string; quantity: number; time: string }>>([]);
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
    if (sale.soldAt || sale.createdAt) {
      const date = (sale.soldAt || sale.createdAt).split('T')[0];
      if (date && salesByDate.has(date)) {
        const saleAmount = Number(sale.salePrice) * sale.quantity;
        salesByDate.set(date, (salesByDate.get(date) || 0) + saleAmount);
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

const loadStats = async () => {
  loading.value = true;
  try {
    // Загружаем все товары для статистики
    const productsResponse = await apiService.getProducts({ limit: 1000 });
    const allProducts = productsResponse.data;

    // Загружаем продажи и возвраты за последний месяц
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const salesResponse = await apiService.getSales({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 1000,
    });
    
    const returnsResponse = await apiService.getReturns({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Рассчитываем статистику
    let totalPositions = allProducts.length;
    let totalItemsQuantity = 0;
    let activePositions = 0;
    let activeItemsCount = 0;
    let soldItemsCount = 0;
    let returnedItemsCount = 0;
    let totalValue = 0;

    // Товары
    allProducts.forEach((product: Product) => {
      const quantity = product.quantity || 0;
      totalItemsQuantity += quantity;
      
      if (quantity > 0) {
        activePositions++;
        activeItemsCount += quantity;
      }
      
      totalValue += product.salePrice * quantity;
    });

    // Продажи за месяц
    salesResponse.data.forEach((sale: Sale) => {
      soldItemsCount += sale.quantity;
    });

    // Возвраты за месяц
    returnsResponse.forEach((ret: ApiReturn) => {
      returnedItemsCount += ret.quantity;
    });
    
    // Складываем активные, проданные и возвращенные товары
    totalItemsQuantity += soldItemsCount + returnedItemsCount;

    // Обновляем статистику
    stats.value = {
      totalPositions,
      totalItemsQuantity,
      activePositions,
      activeItemsCount,
      soldItemsCount,
      returnedItemsCount,
      totalValue
    };
    
    // Подсчитываем товары с низким запасом
    lowStockProducts.value = allProducts.filter(
      (product: Product) => product.minStockLevel > 0 && product.quantity < product.minStockLevel
    );

    // Формируем список последних продаж
    recentSales.value = salesResponse.data.slice(0, 5).map((sale: Sale) => ({
      productName: sale.product?.name || 'Неизвестный товар',
      quantity: sale.quantity,
      amount: Number(sale.salePrice) * sale.quantity,
    }));

    // Формируем список новых поступлений (товары, добавленные за последние 7 дней)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    newArrivals.value = allProducts
      .filter((product: Product) => {
        if (!product.arrivalDate && !product.createdAt) return false;
        const productDate = product.arrivalDate ? new Date(product.arrivalDate) : new Date(product.createdAt);
        return productDate >= sevenDaysAgo;
      })
      .sort((a: Product, b: Product) => {
        const dateA = new Date(a.arrivalDate || a.createdAt);
        const dateB = new Date(b.arrivalDate || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map((product: Product) => ({
        name: product.name,
        quantity: product.quantity,
        arrivalDate: product.arrivalDate || product.createdAt,
      }));

    // Подсчитываем долгохранящиеся товары (на складе более 90 дней)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    longStorageProducts.value = allProducts.filter((product: Product) => {
      const arrivalDate = product.arrivalDate ? new Date(product.arrivalDate) : new Date(product.createdAt);
      return arrivalDate < ninetyDaysAgo && product.quantity > 0;
    });

    lastReturns.value = returnsResponse.slice(0, 5).map((ret: ApiReturn) => ({
      productName: ret.product?.name || 'Товар',
      quantity: ret.quantity,
      time: ret.returnedAt || new Date().toISOString(),
    }));

    recentActions.value = [
      ...salesResponse.data.slice(0, 5).map((sale: Sale) => ({
        type: 'Продажа',
        entity: sale.product?.name || 'Товар',
        details: `${sale.quantity} шт. на ${formatPrice(Number(sale.salePrice) * sale.quantity)}`,
        user: sale.user?.fullName || sale.user?.username || 'Неизвестно',
        time: sale.soldAt || sale.createdAt || new Date().toISOString(),
      })),
      ...returnsResponse.slice(0, 5).map((ret: ApiReturn) => ({
        type: 'Возврат',
        entity: ret.product?.name || 'Товар',
        details: `${ret.quantity} шт.`,
        user: ret.user?.fullName || ret.user?.username || 'Неизвестно',
        time: ret.returnedAt || new Date().toISOString(),
      })),
      ...newArrivals.value.map((p) => ({
        type: 'Добавление товара',
        entity: p.name,
        details: `${p.quantity} шт.`,
        user: 'Система',
        time: p.arrivalDate,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    // Сохраняем данные для графика
    salesData.value = salesResponse.data;

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
  
  // Обновляем статистику каждые 5 минут
  setInterval(() => {
    if (!loading.value) {
      loadStats();
    }
  }, 5 * 60 * 1000);
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
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.stat-value.warning {
  color: var(--orange-500);
}

.stats__container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0.5rem 0;
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
  
  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
