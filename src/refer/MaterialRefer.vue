<script setup lang="ts">
import ReferPicker from "@/components/ReferPicker.vue";
import { getPageMaterialList } from "@/api/master/material.ts";
import type { MaterialListRequest } from "@/types/master/material.ts";

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
  { prop: 'code', label: '物料编码', width: 140 },
  { prop: 'name', label: '物料名称', minWidth: 140 },
  { prop: 'spec', label: '规格', width: 120 },
  { prop: 'unit', label: '单位', width: 80 },
  { prop: 'status', label: '状态', width: 80 },
]

const fetcher = (params: Record<string, any>) =>
  getPageMaterialList(params as MaterialListRequest)
</script>

<template>
  <ReferPicker :model-value="props.modelValue" :display-text="props.displayText" title="物料参照" placeholder="请选择物料"
    search-field="name" search-placeholder="请输入物料名称关键字" value-key="id" :columns="columns" :fetcher="fetcher"
    @update:model-value="handleChange" @change="handleRowChange" />
</template>