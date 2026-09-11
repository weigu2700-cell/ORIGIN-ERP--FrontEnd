<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue';
import MaterialRefer from '@/refer/MaterialRefer.vue';
import type { ProductionDemandQuery } from '@/types/product/productionDemand';

const props = defineProps<{
  queryData: ProductionDemandQuery
}>()

const emit = defineEmits<{
  (e: 'query', params: ProductionDemandQuery): void
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

</script>

<template>
  <ProSearch @search="handleQuery" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="props.queryData.demandNo" placeholder="请输入需求单号" clearable />
      <MaterialRefer v-model="props.queryData.materialId" />
      <el-select v-model="props.queryData.sourceType" placeholder="请选择来源类型" clearable>
        <el-option v-for="item in sourceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
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