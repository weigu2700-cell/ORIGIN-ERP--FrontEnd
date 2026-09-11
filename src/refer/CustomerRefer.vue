<script setup lang="ts">
import ReferPicker from "@/components/ReferPicker.vue";
import { getPageCustomerList } from "@/api/master/customer.ts";
import type { CustomerListRequest } from "@/types/master/customer.ts";
import { ref } from "vue";

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

const columns = ref([
  { prop: 'code', label: '客户编码', width: 140 },
  { prop: 'name', label: '客户名称', minWidth: 160 },
  { prop: 'contactName', label: '联系人', width: 120 },
  { prop: 'phone', label: '联系电话', width: 130 },
])

const fetcher = (params: Record<string, any>) =>
  getPageCustomerList(params as CustomerListRequest)
</script>

<template>
  <ReferPicker :model-value="props.modelValue" title="客户参照" placeholder="请选择客户" search-field="name"
    search-placeholder="请输入客户名称关键字" value-key="id" :columns="columns" :fetcher="fetcher"
    @update:model-value="handleChange" @change="handleRowChange" />
</template>