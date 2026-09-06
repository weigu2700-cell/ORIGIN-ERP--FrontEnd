<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue';
import MaterialRefer from '@/refer/MaterialRefer.vue';
import type { GetPageProductionDemandRequest } from '@/types/product/productionDemand';

const props = defineProps<{
  queryData: GetPageProductionDemandRequest
}>()

const emit = defineEmits<{
  (e: 'query', params: GetPageProductionDemandRequest): void
  (e: 'reset'): void
}>()

const handleQuery = () => {
  emit('query', props.queryData)
}

const handleReset = () => {
  emit('reset')
}

const sourceTypeOptions = [
  { label: '销售订单', value: 'SALES_ORDER' },
  { label: '预测', value: 'FORECAST' },
  { label: '手工创建', value: 'MANUAL' }
]

const statusOptions = [
  { label: '待处理', value: 'PENDING' },
  { label: '处理中', value: 'IN_PROGRESS' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' }
]
</script>

<template>
  <ProSearch @search="handleQuery" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="props.queryData.demandNo" placeholder="请输入需求单号" clearable />
      <MaterialRefer v-model="props.queryData.materialId" />
      <el-select v-model="props.queryData.sourceType" placeholder="请选择来源类型" clearable>
        <el-option v-for="item in sourceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
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