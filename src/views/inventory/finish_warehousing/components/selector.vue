<script setup lang="ts">
import { reactive, watch } from 'vue'
import ProSearch from '@/components/ProSearch.vue'
import ProductionOrderRefer from '@/refer/ProductionOrderRefer.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import WarehouseRefer from '@/refer/WarehouseRefer.vue'
import { FinishWarehousingStatus } from '@/constants/enumCode'
import type { FinishWarehousingQuery } from '@/types/inventory/finishWarehousing'

const props = defineProps<{ queryData: FinishWarehousingQuery }>()
const emit = defineEmits<{ (e: 'query', value: FinishWarehousingQuery): void; (e: 'reset'): void }>()
const localQuery = reactive<FinishWarehousingQuery>({ ...props.queryData })
watch(
  () => props.queryData,
  (value) => Object.assign(localQuery, value),
  { deep: true },
)
</script>

<template>
  <ProSearch @search="emit('query', { ...localQuery })" @reset="emit('reset')">
    <div class="selector">
      <el-input v-model="localQuery.warehousingNo" placeholder="请输入入库单号" clearable />
      <ProductionOrderRefer v-model="localQuery.productionOrderId" />
      <MaterialRefer v-model="localQuery.materialId" />
      <WarehouseRefer v-model="localQuery.warehouseId" />
      <el-select v-model="localQuery.status" placeholder="请选择状态" clearable>
        <el-option
          v-for="item in FinishWarehousingStatus.options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
  </ProSearch>
</template>

<style scoped>
.selector {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
