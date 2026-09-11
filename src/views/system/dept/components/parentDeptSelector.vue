<script setup lang="ts">
import TreeTableSelector, { type SelectorColumn } from "@/refer/TreeTableSelector.vue"
import type { deptResponse } from "@/types/system/dept.ts"
import { getPageDeptList, getDeptTree } from "@/api/system/dept.ts"

const props = defineProps<{
  visible: boolean
}>()
const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'select', dept: { id: string, name: string }): void
}>()

type DeptRow = deptResponse['records'][number]

const columns: SelectorColumn<DeptRow>[] = [
  { label: '部门名称', prop: 'name', minWidth: 140 },
  { label: '部门编码', prop: 'code', minWidth: 100 },
]

const loadTree = () => getDeptTree()

const loadList = (params: { page: number, pageSize: number, parentId: string | number | null }) => {
  return getPageDeptList({
    page: params.page,
    pageSize: params.pageSize,
    parentId: params.parentId == null ? null : String(params.parentId),
  })
}

const handleSelect = (row: DeptRow) => {
  emit('select', { id: row.id, name: row.name })
}
</script>

<template>
  <TreeTableSelector :visible="props.visible" title="选择上级部门" :load-tree="loadTree" :load-list="loadList"
    :columns="columns" @update:visible="(v) => emit('update:visible', v)" @select="handleSelect" />
</template>