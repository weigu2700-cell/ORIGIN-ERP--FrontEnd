<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue'
import CustomerRefer from '@/refer/CustomerRefer.vue'
import type { GetPageSalesOrderQuery } from '@/types/sales/salesOrder'
import { reactive, watch } from 'vue'

const props = defineProps<{
  queryData: GetPageSalesOrderQuery
}>()

const emit = defineEmits<{
  (e: 'query', params: GetPageSalesOrderQuery): void
  (e: 'reset'): void
}>()

const localQuery = reactive<GetPageSalesOrderQuery>({ ...props.queryData })

watch(
  () => props.queryData,
  (value) => Object.assign(localQuery, value),
  { deep: true },
)

const handleQuery = () => {
  emit('query', { ...localQuery })
}

const handleReset = () => {
  emit('reset')
}

const statusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已确认', value: 'CONFIRMED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
]
</script>

<template>
  <ProSearch @search="handleQuery" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="localQuery.orderNo" placeholder="请输入订单号" clearable />
      <CustomerRefer v-model="localQuery.customerId" class="customer" />
      <el-select v-model="localQuery.status" placeholder="请选择状态" clearable>
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
