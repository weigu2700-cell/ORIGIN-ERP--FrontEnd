<script setup lang="ts">
import { reactive, watch } from 'vue'
import ProSearch from '@/components/ProSearch.vue'
import ProductionOrderRefer from '@/refer/ProductionOrderRefer.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import { ProductionReportStatus } from '@/constants/enumCode'
import type { ProductionReportQuery } from '@/types/product/productionReport'

const props = defineProps<{ queryData: ProductionReportQuery }>()
const emit = defineEmits<{
  (e: 'query', value: ProductionReportQuery): void
  (e: 'reset'): void
}>()

const localQuery = reactive<ProductionReportQuery>({ ...props.queryData })
watch(
  () => props.queryData,
  (value) => Object.assign(localQuery, value),
  { deep: true },
)

const search = () => emit('query', { ...localQuery })
</script>

<template>
  <ProSearch @search="search" @reset="emit('reset')">
    <div class="selector">
      <el-input v-model="localQuery.productionReportNo" placeholder="请输入报工单号" clearable />
      <ProductionOrderRefer v-model="localQuery.productionOrderId" />
      <MaterialRefer v-model="localQuery.materialId" />
      <el-select v-model="localQuery.status" placeholder="请选择状态" clearable>
        <el-option
          v-for="item in ProductionReportStatus.options"
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
