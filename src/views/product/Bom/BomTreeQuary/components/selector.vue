<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue'
import BomRefer from '@/refer/BomRefer.vue'

defineOptions({ name: 'BomTreeSelector' })

export interface BomTreeQuery {
  materialId: string | null
  quantity: number
}

const props = defineProps<{
  queryData: BomTreeQuery
}>()

const emit = defineEmits<{
  (e: 'query', params: BomTreeQuery): void
  (e: 'reset'): void
  (e: 'update:queryData', params: BomTreeQuery): void
}>()
</script>

<template>
  <ProSearch @search="emit('query', props.queryData)" @reset="emit('reset')">
    <div class="search-container">
      <div class="bom-field">
        <BomRefer :model-value="props.queryData.materialId"
          @update:model-value="(materialId) => emit('update:queryData', { ...props.queryData, materialId: materialId == null ? null : String(materialId) })" />
      </div>
      <div class="quantity-field">
        <el-input-number :model-value="props.queryData.quantity" :min="0.0001" :precision="4" :step="1"
          controls-position="right" placeholder="请输入展开数量"
          @update:model-value="(quantity: number | undefined) => emit('update:queryData', { ...props.queryData, quantity: Number(quantity ?? 1) })" />
      </div>
    </div>
  </ProSearch>
</template>

<style scoped>
.search-container {
  display: flex;
  gap: 10px;
}

.bom-field {
  width: 220px;
}

.quantity-field,
.quantity-field :deep(.el-input-number) {
  width: 180px;
}
</style>
