<script setup lang="ts">
import ReferPicker from "@/components/ReferPicker.vue";
import { getPageWarehouseList } from "@/api/master/warehouse.ts";
import type { WarehouseListRequest } from "@/types/master/warehouse.ts";

// 双向绑定选中的仓库 id
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
  { prop: 'code', label: '仓库编码', width: 140 },
  { prop: 'name', label: '仓库名称', minWidth: 160 },
  { prop: 'factoryName', label: '所属工厂', minWidth: 140 },
  { prop: 'type', label: '仓库类型', width: 100 },
  { prop: 'status', label: '状态', width: 80 },
]

const fetcher = (params: Record<string, any>) =>
  getPageWarehouseList(params as WarehouseListRequest)
</script>

<template>
  <ReferPicker :model-value="props.modelValue" title="仓库参照" placeholder="请选择仓库" search-field="name"
    search-placeholder="请输入仓库名称关键字" value-key="id" :columns="columns" :fetcher="fetcher"
    @update:model-value="handleChange" @change="handleRowChange" />
</template>