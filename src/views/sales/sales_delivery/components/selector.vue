<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue'
import CustomerRefer from '@/refer/CustomerRefer.vue'
import type { GetPageSalesDelivery } from '@/types/sales/salesDelivery'
import { SalesDeliveryStatus } from '@/constants/enumCode'
import { reactive, watch } from 'vue'

const props = defineProps<{
  queryData: GetPageSalesDelivery
}>()

const emit = defineEmits<{
  (e: 'query', params: GetPageSalesDelivery): void
  (e: 'reset'): void
}>()

const localQuery = reactive<GetPageSalesDelivery>({ ...props.queryData })

watch(
  () => props.queryData,
  (queryData) => Object.assign(localQuery, queryData),
  { deep: true },
)

const handleQuery = () => {
  emit('query', { ...localQuery })
}

const handleReset = () => {
  emit('reset')
}

const statusOptions = [
  { label: '草稿', value: SalesDeliveryStatus.DRAFT },
  { label: '已确认', value: SalesDeliveryStatus.CONFIRMED },
  { label: '已完成', value: SalesDeliveryStatus.COMPLETED },
  { label: '已取消', value: SalesDeliveryStatus.CANCELLED },
]
</script>

<template>
  <ProSearch @search="handleQuery" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="localQuery.deliveryNo" placeholder="请输入交货单号" clearable />
      <CustomerRefer class="customer" v-model="localQuery.customerId" />
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
