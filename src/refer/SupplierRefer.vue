<script setup lang="ts">
import ReferPicker from "@/components/ReferPicker.vue";
import { getPageSupplierList } from "@/api/master/supplier.ts";
import type { SupplierListRequest } from "@/types/master/supplier.ts";

// 双向绑定选中的供应商 id
const props = defineProps<{
  modelValue?: string | number | null
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
  { prop: 'code', label: '供应商编码', width: 140 },
  { prop: 'name', label: '供应商名称', minWidth: 160 },
  { prop: 'shortName', label: '简称', width: 120 },
  { prop: 'contactName', label: '联系人', width: 100 },
  { prop: 'phone', label: '联系电话', width: 130 },
]

const fetcher = (params: Record<string, any>) =>
  getPageSupplierList(params as SupplierListRequest)
</script>

<template>
  <ReferPicker :model-value="props.modelValue" title="供应商参照" placeholder="请选择供应商" search-field="name"
    search-placeholder="请输入供应商名称关键字" value-key="id" :columns="columns" :fetcher="fetcher"
    @update:model-value="handleChange" @change="handleRowChange" />
</template>