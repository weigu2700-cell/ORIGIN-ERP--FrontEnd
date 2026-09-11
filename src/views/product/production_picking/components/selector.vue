<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import ProSearch from '@/components/ProSearch.vue'
import ProductionOrderRefer from '@/refer/ProductionOrderRefer.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import WarehouseRefer from '@/refer/WarehouseRefer.vue'
import type { ProductionPickingQuery } from '@/types/product/productionPicking'

defineOptions({ name: 'ProductionPickingSelector' })

const props = defineProps<{ queryData: ProductionPickingQuery }>()
const emit = defineEmits<{
  (e: 'query', params: ProductionPickingQuery): void
  (e: 'reset'): void
}>()
const localQuery = reactive<ProductionPickingQuery>({ ...props.queryData })

watch(
  () => props.queryData,
  (value) => Object.assign(localQuery, value),
  { deep: true },
)

const pickingTimeRange = computed<[string, string] | null>({
  get: () =>
    localQuery.pickingTimeStart && localQuery.pickingTimeEnd
      ? ([localQuery.pickingTimeStart, localQuery.pickingTimeEnd] as [string, string])
      : null,
  set: (value: [string, string] | null) => {
    localQuery.pickingTimeStart = value?.[0] ?? ''
    localQuery.pickingTimeEnd = value?.[1] ?? ''
  },
})
</script>

<template>
  <ProSearch @search="emit('query', { ...localQuery })" @reset="emit('reset')">
    <div class="search-container">
      <ProductionOrderRefer v-model="localQuery.productionOrderId" />
      <MaterialRefer v-model="localQuery.materialId" placeholder="请选择领料物料" />
      <WarehouseRefer v-model="localQuery.warehouseId" placeholder="请选择领料仓库" />
      <el-date-picker
        v-model="pickingTimeRange"
        type="datetimerange"
        value-format="YYYY-MM-DD HH:mm:ss"
        start-placeholder="领料开始时间"
        end-placeholder="领料结束时间"
        clearable
      />
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
  width: 200px;
}

.search-container > :deep(.el-date-editor) {
  width: 340px;
}
</style>
