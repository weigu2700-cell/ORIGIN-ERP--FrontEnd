<script setup lang="ts">
import ReferPicker from '@/components/ReferPicker.vue'
import { getPagePurchaseDemand } from '@/api/purchase/purchaseDemand'
import type { PagePurchaseDemandRequest } from '@/types/purchase/purchaseDemand'

defineProps<{ modelValue?: string | number | null; displayText?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
  (e: 'change', row: Record<string, unknown> | null): void
}>()
const columns = [
  { prop: 'purchaseDemandNo', label: '采购需求单号', width: 180 },
  { prop: 'materialId', label: '物料 ID', width: 110 },
  { prop: 'purchaseQuantity', label: '采购数量', width: 110 },
  { prop: 'status', label: '状态', width: 100 },
]
const fetcher = (params: Record<string, unknown>) => getPagePurchaseDemand(params as unknown as PagePurchaseDemandRequest)
</script>

<template>
  <ReferPicker :model-value="modelValue" :display-text="displayText" title="采购需求参照" placeholder="请选择采购需求"
    search-field="sourceNo" search-placeholder="请输入来源单号" value-key="id" label-key="purchaseDemandNo"
    :extra-params="{ status: 'APPROVED' }" :columns="columns" :fetcher="fetcher"
    @update:model-value="value => emit('update:modelValue', value)" @change="row => emit('change', row)" />
</template>
