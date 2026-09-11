<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import SupplierRefer from '@/refer/SupplierRefer.vue'
import WarehouseRefer from '@/refer/WarehouseRefer.vue'
import type { PurchaseInStockQuery } from '@/types/purchase/purchaseInStock'
import { reactive, watch } from 'vue'

const props = defineProps<{
  queryData: PurchaseInStockQuery
}>()

const emit = defineEmits<{
  (e: 'search', params: PurchaseInStockQuery): void
  (e: 'reset'): void
}>()

const localQuery = reactive<PurchaseInStockQuery>({ ...props.queryData })

watch(
  () => props.queryData,
  (value) => Object.assign(localQuery, value),
  { deep: true },
)

const handleSearch = () => {
  emit('search', { ...localQuery })
}

const handleReset = () => {
  emit('reset')
}
</script>

<template>
  <ProSearch @search="handleSearch" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="localQuery.purchaseOrderNo" placeholder="请输入采购订单号" clearable />
      <el-input v-model="localQuery.purchaseInStockNo" placeholder="请输入入库单号" clearable />
      <MaterialRefer v-model="localQuery.materialId" placeholder="请选择物料" />
      <SupplierRefer v-model="localQuery.supplierId" placeholder="请选择供应商" />
      <WarehouseRefer v-model="localQuery.warehouseId" placeholder="请选择仓库" />
      <el-input v-model="localQuery.storageLocation" placeholder="请输入储位" clearable />
      <el-input v-model="localQuery.operator" placeholder="请输入操作人" clearable />
      <el-select v-model="localQuery.inType" placeholder="请选择入库类型" clearable>
        <el-option label="采购入库" value="PURCHASE_NORMAL" />
        <el-option label="采购退货" value="PURCHASE_RETURN" />
        <el-option label="赠品入库" value="PURCHASE_GIFT" />
      </el-select>
      <el-select v-model="localQuery.status" placeholder="请选择状态" clearable>
        <el-option label="草稿" value="DRAFT" />
        <el-option label="已审核" value="APPROVED" />
        <el-option label="已上架" value="UPLOADED" />
      </el-select>
      <el-date-picker v-model="localQuery.productionDate" type="date" placeholder="请选择生产日期" clearable />
      <el-date-picker v-model="localQuery.deliveryDate" type="date" placeholder="请选择到货日期" clearable />
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
