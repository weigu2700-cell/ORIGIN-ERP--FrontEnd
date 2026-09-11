<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue';
import MaterialRefer from '@/refer/MaterialRefer.vue';
import type { ProductionOrderQuery } from '@/types/product/productionOrder';

const props = defineProps<{
  queryData: ProductionOrderQuery
}>()

const emit = defineEmits<{
  (e: 'query', params: ProductionOrderQuery): void
  (e: 'reset'): void
}>()

const handleQuery = () => {
  emit('query', props.queryData)
}

const handleReset = () => {
  emit('reset')
}

</script>

<template>
  <ProSearch @search="handleQuery" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="props.queryData.productionOrderNo" placeholder="请输入生产订单号" clearable />
      <el-input v-model="props.queryData.productionDemandNo" placeholder="请输入需求单号" clearable />
      <MaterialRefer v-model="props.queryData.materialId" />
    </div>
  </ProSearch>
</template>

<style scoped>
.search-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  width: auto;
  gap: 10px;
}

.search-container> :deep(.el-input),
.search-container> :deep(.el-select) {
  flex: 0 1 200px;
  min-width: 0;
  width: 200px;
}
</style>