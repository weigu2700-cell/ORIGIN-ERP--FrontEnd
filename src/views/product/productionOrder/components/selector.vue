<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue';
import MaterialRefer from '@/refer/MaterialRefer.vue';
import type { GetPageProductionOrderRequest } from '@/types/product/productionOrder';

const props = defineProps<{
  queryData: GetPageProductionOrderRequest
}>()

const emit = defineEmits<{
  (e: 'query', params: GetPageProductionOrderRequest): void
  (e: 'reset'): void
}>()

const handleQuery = () => {
  emit('query', props.queryData)
}

const handleReset = () => {
  emit('reset')
}

const statusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已下达', value: 'RELEASED' },
  { label: '生产中', value: 'IN_PROGRESS' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' }
]
</script>

<template>
  <ProSearch @search="handleQuery" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="props.queryData.productionOrderNo" placeholder="请输入生产订单号" clearable />
      <el-input v-model="props.queryData.productionDemandNo" placeholder="请输入需求单号" clearable />
      <MaterialRefer v-model="props.queryData.materialId" />
      <el-select v-model="props.queryData.status" placeholder="请选择状态" clearable>
        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
  </ProSearch>
</template>

<style scoped>
.search-container {
  display: flex;
  gap: 10px;

  :deep(.el-input),
  :deep(.el-select) {
    min-width: 240px;
  }
}
</style>
