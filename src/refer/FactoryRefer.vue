<script setup lang="ts">
import ReferPicker from "@/components/ReferPicker.vue";
import { getPageFactoryList } from "@/api/master/factory.ts";
import type { FactoryListRequest } from "@/types/master/factory.ts";

// 双向绑定选中的工厂 id（显式 props/emit，避免 defineModel 边界情况）
const props = defineProps<{
  modelValue?: string | number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | null): void
  (e: 'change', row: Record<string, any> | null): void
}>()

const handleChange = (v: string | number | null) => {
  console.log('[FactoryRefer] update:modelValue ->', v)
  emit('update:modelValue', v)
}

const handleRowChange = (row: Record<string, any> | null) => {
  console.log('[FactoryRefer] change row ->', row)
  emit('change', row)
}

// 工厂参照专属配置：列、API、搜索字段，集中在这里，业务页面零配置
const columns = [
  { prop: 'code', label: '工厂编码', width: 140 },
  { prop: 'name', label: '工厂名称', minWidth: 160 },
  { prop: 'shortName', label: '简称', width: 120 },
  { prop: 'status', label: '状态', width: 80 },
]

const fetcher = (params: Record<string, any>) =>
  getPageFactoryList(params as FactoryListRequest)
</script>

<template>
  <!-- factoryId 后端按工厂主键 id 校验，value-key 必须取 id；之前因列表返回 id 为 null 才临时用 code，后端修复后这里自动生效 -->
  <ReferPicker :model-value="props.modelValue" title="工厂参照" placeholder="请选择工厂" search-field="name"
    search-placeholder="请输入工厂名称关键字" value-key="id" :columns="columns" :fetcher="fetcher"
    @update:model-value="handleChange" @change="handleRowChange" />
</template>