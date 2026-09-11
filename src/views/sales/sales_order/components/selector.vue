<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue';
import CustomerRefer from '@/refer/CustomerRefer.vue';
import type { GetPageSalesOrderQuery } from '@/types/sales/salesOrder';

const props = defineProps<{
  queryData: GetPageSalesOrderQuery
}>()

const emit = defineEmits<{
  (e: 'query', params: GetPageSalesOrderQuery): void
  (e: 'reset'): void
}>()

const handleQuery = () => {
  emit('query', props.queryData)
}

const handleReset = () => {
  emit('reset')
}

const statusOptions = [
  { label: '草稿', value: 0 },
  { label: '已确认', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已取消', value: 3 }
]
</script>

<template>
  <ProSearch @search="handleQuery" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="props.queryData.orderNo" placeholder="请输入订单号" clearable />
      <CustomerRefer class="customer" v-model="props.queryData.customerId" />
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
  :deep(.el-select),
  .customer {
    min-width: 300px;
  }
}
</style>