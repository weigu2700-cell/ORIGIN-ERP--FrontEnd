<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import SupplierRefer from '@/refer/SupplierRefer.vue'
import type { PagePurchaseOrderRequest } from '@/types/purchase/purchaseOrder'

const props = defineProps<{ queryData: PagePurchaseOrderRequest }>()
const emit = defineEmits<{
  (e: 'query', params: PagePurchaseOrderRequest): void
  (e: 'reset'): void
}>()
</script>

<template>
  <ProSearch @search="emit('query', props.queryData)" @reset="emit('reset')">
    <div class="search-container">
      <el-input v-model="props.queryData.purchaseOrderNo" placeholder="请输入采购订单号" clearable />
      <MaterialRefer v-model="props.queryData.materialId" />
      <SupplierRefer v-model="props.queryData.supplierId" />
    </div>
  </ProSearch>
</template>

<style scoped>
.search-container { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.search-container > :deep(.el-input),
.search-container > :deep(.el-select) { flex: 0 1 200px; min-width: 0; width: 200px; }
</style>
