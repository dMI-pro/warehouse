<template>
  <div class="committee-details">
    <div class="header-section mb-4">
      <div class="flex align-items-center gap-3">
        <Button 
          icon="pi pi-arrow-left" 
          text 
          rounded 
          @click="router.back()" 
          aria-label="Назад"
        />
        <h1 class="text-3xl font-bold m-0" v-if="committee">{{ committee.name }}</h1>
        <Skeleton v-else width="200px" height="2rem" />
      </div>
      
      <div class="actions flex gap-2" v-if="committee">
        <Button 
          label="Редактировать" 
          icon="pi pi-pencil" 
          outlined 
          @click="openEditDialog" 
        />
        <Button 
          label="Удалить" 
          icon="pi pi-trash" 
          severity="danger" 
          outlined 
          @click="confirmDelete" 
        />
      </div>
    </div>

    <div class="grid">
      <!-- Информация -->
      <div class="col-12 md:col-4">
        <Card class="h-full">
          <template #title>Информация</template>
          <template #content>
            <div v-if="committee" class="committee-info">
              <div class="info-item mb-3">
                <div class="text-500 text-sm">Описание</div>
                <div class="text-900">{{ committee.description || '-' }}</div>
              </div>
              <div class="info-item mb-3">
                <div class="text-500 text-sm">Контакты</div>
                <div class="text-900">{{ committee.contactInfo || '-' }}</div>
              </div>
              <div class="info-item">
                <div class="text-500 text-sm">Дата создания</div>
                <div class="text-900">{{ formatDate(committee.createdAt) }}</div>
              </div>
            </div>
            <div v-else>
              <Skeleton width="100%" height="100px" />
            </div>
          </template>
        </Card>
      </div>

      <!-- Фильтры и статистика -->
      <div class="col-12 md:col-8">
        <Card class="mb-3">
          <template #content>
            <div class="flex flex-wrap gap-3 align-items-end">
              <div class="field mb-0">
                <label for="startDate" class="block text-sm font-medium text-gray-700">Дата начала</label>
                <Calendar 
                  id="startDate" 
                  v-model="filters.startDate" 
                  dateFormat="yy-mm-dd" 
                  showIcon 
                  :maxDate="filters.endDate || undefined"
                />
              </div>
              <div class="field mb-0">
                <label for="endDate" class="block text-sm font-medium text-gray-700">Дата окончания</label>
                <Calendar 
                  id="endDate" 
                  v-model="filters.endDate" 
                  dateFormat="yy-mm-dd" 
                  showIcon 
                  :minDate="filters.startDate || undefined"
                />
              </div>
              <Button label="Применить" icon="pi pi-filter" @click="fetchStatistics" :loading="isLoading" />
              <Button 
                label="Сбросить" 
                icon="pi pi-refresh" 
                severity="secondary" 
                outlined 
                @click="resetFilters" 
              />
            </div>
            <div v-if="filters.startDate || filters.endDate" class="mt-2 text-sm text-500">
              <i class="pi pi-info-circle mr-1"></i>
              Период: {{ formatDateRange(filters.startDate, filters.endDate) }}
            </div>
          </template>
        </Card>

        <div class="grid">
          <!-- Кол-во позиций -->
          <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Кол-во позиций</div>
                <div class="text-2xl font-bold text-primary">{{ stats?.metrics.totalPositions || 0 }}</div>
              </template>
            </Card>
          </div>
          
          <!-- Всего товара -->
          <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Всего товара</div>
                <div class="text-2xl font-bold text-blue-500">{{ stats?.metrics.totalItemsQuantity || 0 }}</div>
              </template>
            </Card>
          </div>
          
          <!-- Активные товары -->
          <!-- <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Активные товары</div>
                <div class="text-2xl font-bold text-green-500">{{ stats?.metrics.activeItems || 0 }}</div>
              </template>
            </Card>
          </div> -->

          <!-- Активные позиции -->
          <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Активные позиции</div>
                <div class="text-2xl font-bold text-green-500">{{ stats?.metrics.activePositions || 0 }}</div>
              </template>
            </Card>
          </div>

          <!-- Активные товары -->
          <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Активные товары</div>
                <div class="text-2xl font-bold text-green-600">{{ stats?.metrics.activeItemsCount || 0 }}</div>
              </template>
            </Card>
          </div>
          
          <!-- Продано -->
          <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Продано</div>
                <div class="text-2xl font-bold text-teal-500">{{ stats?.metrics.soldItemsCount || 0 }}</div>
              </template>
            </Card>
          </div>
          
          <!-- Возвращено -->
          <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Возвращено</div>
                <div class="text-2xl font-bold text-orange-500">{{ stats?.metrics.returnedItemsCount || 0 }}</div>
              </template>
            </Card>
          </div>
          
          <!-- Выручка -->
          <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Выручка</div>
                <div class="text-2xl font-bold text-purple-500">{{ formatPrice(stats?.metrics.totalRevenue || 0) }}</div>
              </template>
            </Card>
          </div>
          
          <!-- Прибыль -->
          <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Прибыль</div>
                <div class="text-2xl font-bold text-indigo-500">{{ formatPrice(stats?.metrics.totalProfit || 0) }}</div>
              </template>
            </Card>
          </div>
          
          <!-- Выплачено комитету -->
          <div class="col-12 md:col-3">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Выплачено комитету</div>
                <div class="text-2xl font-bold text-pink-500">{{ formatPrice(stats?.metrics.totalPayout || 0) }}</div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- График -->
    <Card class="mt-4 mb-4">
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>Динамика показателей</span>
          <SelectButton v-model="chartMetric" :options="chartOptions" optionLabel="label" optionValue="value" />
        </div>
      </template>
      <template #content>
        <div ref="chartRef" class="w-full" style="height: 400px;"></div>
      </template>
    </Card>

    <!-- Редактирование комитета -->
    <Dialog v-model:visible="editDialogVisible" header="Редактировать комитет" :modal="true" :style="{ width: '450px' }">
      <div class="field">
        <label for="name">Название</label>
        <InputText id="name" v-model="editForm.name" required autofocus class="w-full" />
      </div>
      <div class="field">
        <label for="description">Описание</label>
        <Textarea id="description" v-model="editForm.description" rows="3" class="w-full" />
      </div>
      <div class="field">
        <label for="contactInfo">Контакты</label>
        <Textarea id="contactInfo" v-model="editForm.contactInfo" rows="3" class="w-full" />
      </div>
      <template #footer>
        <Button label="Отмена" icon="pi pi-times" text @click="editDialogVisible = false" />
        <Button label="Сохранить" icon="pi pi-check" @click="saveCommittee" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiService } from '@/services/api';
import type { Committee } from '@/types/api';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import * as echarts from 'echarts';

// PrimeVue Components
import Card from 'primevue/card';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import Skeleton from 'primevue/skeleton';
import SelectButton from 'primevue/selectbutton';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

interface CommitteeStats {
  committee: Committee;
  metrics: {
    totalPositions: number;        // Кол-во позиций (записей товаров)
    totalItemsQuantity: number;    // Всего товара (сумма quantity)
    activePositions: number;       // Активные позиции (с quantity > 0)
    activeItemsCount: number;      // Активные товары (сумма quantity > 0)
    soldItemsCount: number;        // Продано
    returnedItemsCount: number;    // Возвращено
    totalRevenue: number;          // Выручка
    totalProfit: number;           // Прибыль
    totalPayout: number;           // Выплачено комитету
  };
  dailyStats: Record<string, any>;
}

const committeeId = Number(route.params.id);
const committee = ref<Committee | null>(null);
const stats = ref<CommitteeStats | null>(null);
const isLoading = ref(false);

const filters = reactive({
  startDate: null as Date | null,
  endDate: null as Date | null,
});

const editDialogVisible = ref(false);
const editForm = reactive({
  name: '',
  description: '',
  contactInfo: '',
});

// Chart
const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
const chartMetric = ref('revenue');
// const chartOptions = [
//   { label: 'Выручка', value: 'revenue' },
//   { label: 'Прибыль', value: 'profit' },
//   { label: 'Выплаты', value: 'payout' },
//   { label: 'Позиции', value: 'positions' },
//   { label: 'Активные позиции', value: 'activePositions' },
//   { label: 'Товар (шт)', value: 'items' },
//   { label: 'Активные товары', value: 'activeItems' },
//   { label: 'Продажи (шт)', value: 'sold' },
//   { label: 'Возвраты (шт)', value: 'returned' },
// ];
// new chartOptions

const chartOptions = [
  { label: 'Выручка', value: 'revenue' },
  { label: 'Прибыль', value: 'profit' },
  { label: 'Выплаты', value: 'payout' },
  { label: 'Продажи (шт)', value: 'sold' },
  { label: 'Возвраты (шт)', value: 'returned' },
];

// const fetchStatistics = async () => {
//   if (isLoading.value) return;
//   isLoading.value = true;
//   try {
//     // Форматируем даты для включения конечной даты
//     const startDateStr = filters.startDate ? formatDateForApi(filters.startDate) : undefined;
//     const endDateStr = filters.endDate ? formatDateForApi(filters.endDate, true) : undefined;
    
//     const data = await apiService.getCommitteeStatistics(committeeId, startDateStr, endDateStr);
//     committee.value = data.committee;
//     stats.value = data;
    
//     updateChart();
//   } catch (error: any) {
//     console.error('Error fetching committee stats:', error);
//     toast.add({ 
//       severity: 'error', 
//       summary: 'Ошибка', 
//       detail: error.response?.data?.message || 'Не удалось загрузить данные' 
//     });
//   } finally {
//     isLoading.value = false;
//   }
// };

const fetchStatistics = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    // Форматируем даты для включения конечной даты
    const startDateStr = filters.startDate ? formatDateForApi(filters.startDate) : undefined;
    const endDateStr = filters.endDate ? formatDateForApi(filters.endDate, true) : undefined;

    const data = await apiService.getCommitteeStatistics(committeeId, startDateStr, endDateStr);
    
    console.log('Получены данные статистики:', data);
    
    committee.value = data.committee;
    stats.value = data;
    
    updateChart();
  } catch (error: any) {
    console.error('Error fetching committee stats:', error);
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка', 
      detail: error.response?.data?.message || 'Не удалось загрузить данные' 
    });
  } finally {
    isLoading.value = false;
  }
};

// Форматирование даты для API (включительно конечную дату)
const formatDateForApi = (date: Date, isEndDate: boolean = false): string => {
  const d = new Date(date);
  if (isEndDate) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
};

const resetFilters = () => {
  filters.startDate = null;
  filters.endDate = null;
  fetchStatistics();
};

const formatDateRange = (startDate: Date | null, endDate: Date | null): string => {
  if (!startDate && !endDate) return 'Весь период';
  if (startDate && !endDate) return `с ${formatDate(startDate.toISOString())}`;
  if (!startDate && endDate) return `по ${formatDate(endDate.toISOString())}`;
  return `${formatDate(startDate!.toISOString())} - ${formatDate(endDate!.toISOString())}`;
};

const updateChart = () => {
  if (!chartRef.value || !stats.value?.dailyStats) return;

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
    window.addEventListener('resize', () => chartInstance?.resize());
  }

  const dailyStats = stats.value.dailyStats;
  
  // Сортируем даты по возрастанию
  const dates = Object.keys(dailyStats).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });
  
  // Форматируем даты для отображения
  const formattedDates = dates.map(dateStr => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  });
  
  // Получаем данные для выбранной метрики
  const seriesData = dates.map(date => {
    const value = dailyStats[date][chartMetric.value] || 0;
    return Math.round(value * 100) / 100; // Округляем до 2 знаков
  });

  const metricName = chartOptions.find(o => o.value === chartMetric.value)?.label;

  // Определяем цвет в зависимости от метрики
  // const getMetricColor = (metric: string) => {
  //   switch (metric) {
  //     case 'revenue': return '#10B981'; // Зеленый
  //     case 'profit': return '#3B82F6'; // Синий
  //     case 'payout': return '#8B5CF6'; // Фиолетовый
  //     case 'positions': return '#EF4444'; // Красный
  //     case 'activePositions': return '#06B6D4'; // Бирюзовый
  //     case 'items': return '#F59E0B'; // Оранжевый
  //     case 'activeItems': return '#84CC16'; // Лаймовый
  //     case 'sold': return '#8B5CF6'; // Фиолетовый
  //     case 'returned': return '#F97316'; // Оранжевый
  //     default: return '#6B7280'; // Серый
  //   }
  // };

  // New Определяем цвет в зависимости от метрики
  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'revenue': return '#10B981'; // Зеленый
      case 'profit': return '#3B82F6'; // Синий
      case 'payout': return '#8B5CF6'; // Фиолетовый
      case 'sold': return '#8B5CF6'; // Фиолетовый
      case 'returned': return '#F97316'; // Оранжевый
      default: return '#6B7280'; // Серый
    }
  };

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        const date = params[0].name;
        const value = params[0].value;
        const metric = chartMetric.value;
        
        let formattedValue = value;
        if (metric === 'revenue' || metric === 'profit' || metric === 'payout') {
          formattedValue = formatPrice(value);
        }
        
        return `${date}<br/>${metricName}: ${formattedValue}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: formattedDates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (chartMetric.value === 'revenue' || chartMetric.value === 'profit' || chartMetric.value === 'payout') {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}М`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}К`;
          }
          return value.toString();
        },
      },
    },
    series: [
      {
        name: metricName,
        type: 'bar',
        data: seriesData,
        itemStyle: {
          color: getMetricColor(chartMetric.value)
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            const value = params.value;
            if (chartMetric.value === 'revenue' || chartMetric.value === 'profit' || chartMetric.value === 'payout') {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}М`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}К`;
            }
            return value;
          },
          fontSize: 10
        }
      },
    ],
  };

  chartInstance.setOption(option, true);
};

watch(chartMetric, () => {
  updateChart();
});

watch(() => [filters.startDate, filters.endDate], () => {
  // Автоматическое обновление при изменении фильтров
  fetchStatistics();
}, { deep: true });

const openEditDialog = () => {
  if (!committee.value) return;
  editForm.name = committee.value.name;
  editForm.description = committee.value.description || '';
  editForm.contactInfo = committee.value.contactInfo || '';
  editDialogVisible.value = true;
};

const saveCommittee = async () => {
  try {
    await apiService.updateCommittee(committeeId, editForm);
    toast.add({ severity: 'success', summary: 'Успешно', detail: 'Комитет обновлен' });
    editDialogVisible.value = false;
    fetchStatistics(); // Refresh info
  } catch (error: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка', 
      detail: error.response?.data?.message || 'Не удалось сохранить изменения' 
    });
  }
};

const confirmDelete = () => {
  confirm.require({
    message: 'Вы уверены, что хотите удалить этот комитет? Это действие нельзя отменить.',
    header: 'Подтверждение удаления',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await apiService.deleteCommittee(committeeId);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Комитет удален' });
        router.push('/settings'); // Or wherever appropriate
      } catch (error: any) {
        toast.add({ 
          severity: 'error', 
          summary: 'Ошибка', 
          detail: error.response?.data?.message || 'Не удалось удалить комитет (возможно, есть связанные товары)' 
        });
      }
    },
  });
};

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string | Date) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ru-RU');
};

onMounted(() => {
  fetchStatistics();
});
</script>

<style scoped>
.stat-card {
  height: 100%;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.committee-info .info-item {
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.75rem;
}

.committee-info .info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
</style>
