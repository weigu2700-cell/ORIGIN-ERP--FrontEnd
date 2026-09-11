<script setup lang="ts">
import ReferPicker from '@/components/ReferPicker.vue'
import { getPageProductionOrder } from '@/api/product/productionOrder'
import type { ProductionOrderQuery } from '@/types/product/productionOrder'

defineProps<{ modelValue?: string | number | null; displayText?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
  (e: 'change', row: Record<string, unknown> | null): void
}>()

const columns = [
  { prop: 'productionOrderNo', label: '生产订单号', width: 180 },
  { prop: 'materialCode', label: '物料编码', width: 130 },
  { prop: 'materialName', label: '物料名称', minWidth: 150 },
  { prop: 'plannedQuantity', label: '计划数量', width: 100 },
  { prop: 'status', label: '状态', width: 90 },
]

const fetcher = (params: Record<string, unknown>) => getPageProductionOrder(params as unknown as ProductionOrderQuery)
</script>

<template>
  <ReferPicker
    :model-value="modelValue"
    :display-text="displayText"
    title="生产订单参照"
    placeholder="请选择生产订单"
    search-field="productionOrderNo"
    search-placeholder="请输入生产订单号"
    value-key="id"
    label-key="productionOrderNo"
    :columns="columns"
    :fetcher="fetcher"
    @update:model-value="(value) => emit('update:modelValue', value)"
    @change="(row) => emit('change', row)"
  />
</template>
