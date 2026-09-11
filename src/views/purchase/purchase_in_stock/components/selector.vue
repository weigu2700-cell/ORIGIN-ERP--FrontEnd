<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import SupplierRefer from '@/refer/SupplierRefer.vue'
import WarehouseRefer from '@/refer/WarehouseRefer.vue'
import type { PurchaseInStockQuery } from '@/types/purchase/purchaseInStock';

const props = defineProps<{
  queryData: PurchaseInStockQuery
}>()

const emit = defineEmits<{
  (e: 'search', params: PurchaseInStockQuery): void
  (e: 'reset'): void
}>()

const handleSearch = () => {
  emit('search', props.queryData)
}

const handleReset = () => {
  emit('reset')
}
</script>

<template>
  <ProSearch :query-data="props.queryData" @search="handleSearch" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="props.queryData.purchaseOrderNo" placeholder="请输入采购订单号" clearable />
      <el-input v-model="props.queryData.purchaseInStockNo" placeholder="请输入入库单号" clearable />
      <MaterialRefer v-model="props.queryData.materialId" placeholder="请选择物料" />
      <SupplierRefer v-model="props.queryData.supplierId" placeholder="请选择供应商" />
      <WarehouseRefer v-model="props.queryData.warehouseId" placeholder="请选择仓库" />
      <el-input v-model="props.queryData.storageLocation" placeholder="请输入储位" clearable />
      <el-input v-model="props.queryData.operator" placeholder="请输入操作人" clearable />
      <el-select v-model="props.queryData.inType" placeholder="请选择入库类型" clearable>
        <el-option label="采购入库" value="purchase" />
        <el-option label="退货入库" value="return" />
        <el-option label="其他入库" value="other" />
      </el-select>
      <el-date-picker v-model="props.queryData.productionDate" type="date" placeholder="请选择生产日期" clearable />
      <el-date-picker v-model="props.queryData.deliveryDate" type="date" placeholder="请选择到货日期" clearable />
    </div>
  </ProSearch>
</template>

<style scoped>
.search-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.search-container :deep(.el-input),
.search-container :deep(.el-select),
.search-container :deep(.el-date-picker) {
  width: 200px;
}
</style>