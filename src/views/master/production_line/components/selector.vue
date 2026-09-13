<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import ProSearch from '@/components/ProSearch.vue'
import WorkshopRefer from '@/refer/WorkshopRefer.vue'
import type { ProductionLineListRequest, ProductionLineStatus } from '@/types/master/productionLine.ts'
import { EnableStatus } from '@/constants/enumCode'

const props = defineProps<{
  queryData: ProductionLineListRequest
}>()

const statusOptions: { label: string; value: ProductionLineStatus }[] = [
  { label: '启用', value: EnableStatus.ENABLE },
  { label: '停用', value: EnableStatus.DISABLE },
]

const emit = defineEmits<{
  (e: 'query', params: ProductionLineListRequest): void
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
      <el-input v-model="props.queryData.name" placeholder="请输入生产线名称"></el-input>
      <WorkshopRefer v-model="props.queryData.workshopId" />
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
