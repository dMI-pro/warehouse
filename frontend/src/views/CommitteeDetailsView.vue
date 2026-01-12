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
                <Calendar id="startDate" v-model="filters.startDate" dateFormat="yy-mm-dd" showIcon />
              </div>
              <div class="field mb-0">
                <label for="endDate" class="block text-sm font-medium text-gray-700">Дата окончания</label>
                <Calendar id="endDate" v-model="filters.endDate" dateFormat="yy-mm-dd" showIcon />
              </div>
              <Button label="Применить" icon="pi pi-filter" @click="fetchStatistics" :loading="isLoading" />
            </div>
          </template>
        </Card>

        <div class="grid">
          <div class="col-12 md:col-4">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Общее кол-во товаров</div>
                <div class="text-2xl font-bold text-primary">{{ stats?.metrics.totalItems || 0 }}</div>
              </template>
            </Card>
          </div>
          <div class="col-12 md:col-4">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Активные товары</div>
                <div class="text-2xl font-bold text-green-500">{{ stats?.metrics.activeItemsCount || 0 }}</div>
              </template>
            </Card>
          </div>
          <div class="col-12 md:col-4">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Продано</div>
                <div class="text-2xl font-bold text-blue-500">{{ stats?.metrics.soldItemsCount || 0 }}</div>
              </template>
            </Card>
          </div>
          <div class="col-12 md:col-4">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Возвращено</div>
                <div class="text-2xl font-bold text-orange-500">{{ stats?.metrics.returnedItemsCount || 0 }}</div>
              </template>
            </Card>
          </div>
          <div class="col-12 md:col-4">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Выплачено</div>
                <div class="text-2xl font-bold text-purple-500">{{ formatPrice(stats?.metrics.totalPayout || 0) }}</div>
              </template>
            </Card>
          </div>
          <div class="col-12 md:col-4">
            <Card class="stat-card text-center">
              <template #content>
                <div class="text-500 mb-2">Прибыль</div>
                <div class="text-2xl font-bold text-teal-500">{{ formatPrice(stats?.metrics.totalProfit || 0) }}</div>
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

const committeeId = Number(route.params.id);
const committee = ref<Committee | null>(null);
const stats = ref<any>(null);
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
const chartOptions = [
  { label: 'Выручка', value: 'revenue' },
  { label: 'Выплаты', value: 'payout' },
  { label: 'Продажи (шт)', value: 'sold' },
  { label: 'Возвраты (шт)', value: 'returned' },
];

const fetchStatistics = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    const startDateStr = filters.startDate ? filters.startDate.toISOString() : undefined;
    const endDateStr = filters.endDate ? filters.endDate.toISOString() : undefined;
    
    const data = await apiService.getCommitteeStatistics(committeeId, startDateStr, endDateStr);
    committee.value = data.committee;
    stats.value = data;
    
    updateChart();
  } catch (error) {
    console.error('Error fetching committee stats:', error);
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось загрузить данные' });
  } finally {
    isLoading.value = false;
  }
};

const updateChart = () => {
  if (!chartRef.value || !stats.value?.dailyStats) return;

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
    window.addEventListener('resize', () => chartInstance?.resize());
  }

  const dailyStats = stats.value.dailyStats;
  const dates = Object.keys(dailyStats).sort();
  
  const seriesData = dates.map(date => dailyStats[date][chartMetric.value]);
  
  const metricName = chartOptions.find(o => o.value === chartMetric.value)?.label;

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        const date = params[0].name;
        const value = params[0].value;
        if (chartMetric.value === 'revenue' || chartMetric.value === 'payout') {
            return `${date}<br/>${metricName}: ${formatPrice(value)}`;
        }
        return `${date}<br/>${metricName}: ${value}`;
      }
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
        data: seriesData,
        type: 'bar', // or line
        smooth: true,
        name: metricName,
        itemStyle: {
            color: chartMetric.value === 'revenue' ? '#10B981' : 
                   chartMetric.value === 'payout' ? '#8B5CF6' :
                   chartMetric.value === 'sold' ? '#3B82F6' : '#F97316'
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            console.log('params', params);
            if (chartMetric.value === 'revenue' || chartMetric.value === 'payout') {
              return formatPrice(params.value);
            }
            return params.value;
          },
          fontSize: 20,
          color: '#333'
        }
      },
    ],
  };

  chartInstance.setOption(option);
};

watch(chartMetric, () => {
  updateChart();
});

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
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось сохранить изменения' });
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
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось удалить комитет (возможно, есть связанные товары)' });
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
}
</style>
