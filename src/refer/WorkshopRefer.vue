<script setup lang="ts">
import ReferPicker from "@/components/ReferPicker.vue";
import { getPageWorkshopList } from "@/api/master/workshop.ts";
import type { WorkshopListRequest } from "@/types/master/workshop.ts";

// 双向绑定选中的车间 id
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
  { prop: 'code', label: '车间编码', width: 140 },
  { prop: 'name', label: '车间名称', minWidth: 160 },
  { prop: 'factoryName', label: '所属工厂', minWidth: 140 },
  { prop: 'status', label: '状态', width: 80 },
]

const fetcher = (params: Record<string, any>) =>
  getPageWorkshopList(params as WorkshopListRequest)
</script>

<template>
  <ReferPicker :model-value="props.modelValue" title="车间参照" placeholder="请选择车间" search-field="name"
    search-placeholder="请输入车间名称关键字" value-key="id" :columns="columns" :fetcher="fetcher"
    @update:model-value="handleChange" @change="handleRowChange" />
</template>