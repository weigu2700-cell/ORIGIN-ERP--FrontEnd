<script setup lang="ts">
import ReferPicker from '@/components/ReferPicker.vue'
import { getPageBom } from '@/api/product/Bom'
import type { GetPageBomRequest } from '@/types/product/Bom'

const props = defineProps<{
  modelValue?: string | number | null
  displayText?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

const columns = [
  { prop: 'bomNo', label: 'BOM编号', width: 160 },
  { prop: 'materialCode', label: '物料编码', width: 160 },
  { prop: 'materialName', label: '物料名称', minWidth: 160 },
  { prop: 'status', label: '状态', width: 80 },
]

const fetcher = (params: Record<string, unknown>) => getPageBom({
  pageNum: Number(params.pageNum ?? 1),
  pageSize: Number(params.pageSize ?? 10),
  bomNo: (params.bomNo as string | undefined) ?? null,
  materialId: null,
  status: 'ACTIVE',
} as GetPageBomRequest)
</script>

<template>
  <ReferPicker
    :model-value="props.modelValue"
    :display-text="props.displayText"
    title="选择BOM"
    placeholder="请选择BOM"
    search-field="bomNo"
    search-placeholder="请输入BOM编号"
    value-key="materialId"
    label-key="materialName"
    :columns="columns"
    :fetcher="fetcher"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
