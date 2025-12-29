<template>
  <div class="products">
    <div class="page-header">
      <h1 class="page-title">Товары</h1>
    </div>

    <Card>
      <template #content>
        <DataTable
          :value="products"
          :loading="loading"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
          currentPageReportTemplate="{first} - {last} из {totalRecords}"
          :emptyMessage="loading ? 'Загрузка...' : 'Нет товаров'"
          class="p-datatable-sm"
        >
          <Column field="id" header="ID" :sortable="true" style="width: 80px" />
          <Column field="name" header="Название" :sortable="true" />
          <Column field="sku" header="SKU" :sortable="true" />
          <Column field="price" header="Цена" :sortable="true">
            <template #body="{ data }">
              {{ formatPrice(data.price) }}
            </template>
          </Column>
          <Column field="quantity" header="Количество" :sortable="true" />
          <Column field="category.name" header="Категория" />
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { apiService } from '@/services/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category?: {
    name: string;
  };
}

const products = ref<Product[]>([]);
const loading = ref(false);

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(price);
};

const loadProducts = async () => {
  loading.value = true;
  try {
    const response = await apiService.getProducts({ limit: 100 });
    products.value = response.data || [];
  } catch (error) {
    console.error('Failed to load products', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
.products {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}
</style>


