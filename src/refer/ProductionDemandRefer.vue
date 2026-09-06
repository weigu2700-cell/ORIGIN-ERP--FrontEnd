<script setup lang="ts">
import ReferPicker from "@/components/ReferPicker.vue";
import { getPageProductionDemand } from "@/api/product/productionDemand";
import type { GetPageProductionDemandRequest } from "@/types/product/productionDemand";

const props = defineProps<{
  modelValue?: string | number | null
  displayText?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | null): void
  (e: 'change', row: Record<string, any> | null): void
}>()

const handleChange = (v: string | number | null) => {
  emit('update:modelValue', v)
}

const handleRowChange = (row: Record<string, any> | null) => {
  emit('change', row)
}

const columns = [
  { prop: 'demandNo', label: '需求单号', width: 160 },
  { prop: 'materialCode', label: '物料编码', width: 140 },
  { prop: 'materialName', label: '物料名称', minWidth: 140 },
  { prop: 'quantity', label: '数量', width: 100 },
  { prop: 'status', label: '状态', width: 100 },
]

const fetcher = (params: Record<string, any>) =>
  getPageProductionDemand(params as GetPageProductionDemandRequest)
</script>

<template>
  <ReferPicker :model-value="props.modelValue" :display-text="props.displayText" title="生产需求参照" placeholder="请选择生产需求"
    search-field="demandNo" search-placeholder="请输入需求单号或物料名称" value-key="id" :columns="columns" :fetcher="fetcher"
    @update:model-value="handleChange" @change="handleRowChange" />
</template>