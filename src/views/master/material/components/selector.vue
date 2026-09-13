<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import ProSearch from '@/components/ProSearch.vue'
import type { MaterialListRequest } from '@/types/master/material.ts'
import { MaterialStatus, MaterialType } from '@/constants/enumCode'

const props = defineProps<{
  queryData: MaterialListRequest
}>()

const typeOptions = [
  { label: '原材料', value: MaterialType.RAW_MATERIAL },
  { label: '半成品', value: MaterialType.SEMI_FINISHED },
  { label: '包装材料', value: MaterialType.PACKAGING },
  { label: '耗材', value: MaterialType.CONSUMABLE },
  { label: '其他', value: MaterialType.OTHER },
]

const statusOptions = [
  { label: '启用', value: MaterialStatus.ENABLE },
  { label: '停用', value: MaterialStatus.DISABLE },
]

const emit = defineEmits<{
  (e: 'query', params: MaterialListRequest): void
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
      <el-input v-model="props.queryData.name" placeholder="请输入物料名称"></el-input>
      <el-input v-model="props.queryData.code" placeholder="请输入物料编码"></el-input>
      <el-input v-model="props.queryData.spec" placeholder="请输入规格"></el-input>
      <el-select v-model="props.queryData.type" placeholder="请选择物料类型" clearable>
        <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
      </el-select>
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
