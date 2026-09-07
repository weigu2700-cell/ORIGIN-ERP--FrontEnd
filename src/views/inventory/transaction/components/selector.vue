<script setup lang="ts">
import ProSearch from "@/components/ProSearch.vue";
import MaterialRefer from "@/refer/MaterialRefer.vue";
import WarehouseRefer from "@/refer/WarehouseRefer.vue";
import type { TransactionListRequest } from "@/types/inventory/transaction.ts";

const props = defineProps<{
  queryData: TransactionListRequest
}>()

const emit = defineEmits<{
  (e: 'query', params: TransactionListRequest): void
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
      <MaterialRefer v-model="props.queryData.materialId" />
      <WarehouseRefer v-model="props.queryData.warehouseId" />
      <el-input v-model="props.queryData.businessType" placeholder="请输入业务类型"></el-input>
      <el-input v-model="props.queryData.businessNo" placeholder="请输入业务单号"></el-input>
    </div>
  </ProSearch>
</template>

<style scoped>
.search-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.search-container > :deep(.el-input),
.search-container > :deep(.el-select) {
  flex: 0 1 200px;
  min-width: 0;
  width: 200px;
}
</style>
