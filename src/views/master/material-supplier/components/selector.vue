<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import ProSearch from '@/components/ProSearch.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import SupplierRefer from '@/refer/SupplierRefer.vue'
import type { MaterialSupplierListRequest, MaterialSupplierStatus } from '@/types/master/materialSupplier.ts'
import { MaterialSupplierStatus as MaterialSupplierStatusCode } from '@/constants/enumCode'

const props = defineProps<{
  queryData: MaterialSupplierListRequest
}>()

const statusOptions: { label: string; value: MaterialSupplierStatus }[] = [
  { label: '启用', value: MaterialSupplierStatusCode.ACTIVE },
  { label: '停用', value: MaterialSupplierStatusCode.INACTIVE },
]

const emit = defineEmits<{
  (e: 'query', params: MaterialSupplierListRequest): void
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
      <el-input v-model="props.queryData.materialSupplierCode" placeholder="请输入关联编码"></el-input>
      <MaterialRefer v-model="props.queryData.materialId" />
      <SupplierRefer v-model="props.queryData.supplierId" />
      <el-select v-model="props.queryData.status" placeholder="请选择状态" clearable>
        <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </div>
  </ProSearch>
</template>

<style scoped>
.search-container {
  display: flex;
  gap: 10px;
}
</style>
