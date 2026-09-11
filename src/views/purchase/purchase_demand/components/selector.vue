<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import type { PurchaseDemandQuery } from '@/types/purchase/purchaseDemand'

const props = defineProps<{ queryData: PurchaseDemandQuery }>()
const emit = defineEmits<{
  (e: 'query', params: PurchaseDemandQuery): void
  (e: 'reset'): void
}>()

const sourceOptions = [
  { label: '生产订单', value: 'PRODUCTION_ORDER' },
  { label: '其他', value: 'OTHER' },
]
</script>

<template>
  <ProSearch @search="emit('query', props.queryData)" @reset="emit('reset')">
    <div class="search-container">
      <MaterialRefer v-model="props.queryData.materialId" />
      <el-select v-model="props.queryData.sourceType" placeholder="请选择来源类型" clearable>
        <el-option v-for="item in sourceOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-input v-model="props.queryData.sourceNo" placeholder="请输入来源单号" clearable />
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

.search-container> :deep(.el-input),
.search-container> :deep(.el-select) {
  flex: 0 1 200px;
  min-width: 0;
  width: 200px;
}
</style>