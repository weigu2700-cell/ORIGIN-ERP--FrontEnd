<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import ProSearch from '@/components/ProSearch.vue'
import type { CustomerListRequest, CustomerStatus } from '@/types/master/customer.ts'
import { CustomerStatus as CustomerStatusCode } from '@/constants/enumCode'

const props = defineProps<{
  queryData: CustomerListRequest
}>()

const statusOptions: { label: string; value: CustomerStatus }[] = [
  { label: '合作中', value: CustomerStatusCode.ACTIVE },
  { label: '停用', value: CustomerStatusCode.INACTIVE },
]

const emit = defineEmits<{
  (e: 'query', params: CustomerListRequest): void
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
      <el-input v-model="props.queryData.name" placeholder="请输入客户名称"></el-input>
      <el-input v-model="props.queryData.code" placeholder="请输入客户编码"></el-input>
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
