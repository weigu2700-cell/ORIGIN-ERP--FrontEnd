<script setup lang="ts">
import TreeTableSelector, { type SelectorColumn } from "@/refer/TreeTableSelector.vue"
import type { MenuTreeNode } from "@/types/system/menu.ts"
import { getPageMenuList, getCurrentUserMenu } from "@/api/system/menu.ts"

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'select', menu: { id: string, title: string }): void
}>()

const columns: SelectorColumn<MenuTreeNode>[] = [
  { label: '菜单名称', prop: 'title', minWidth: 140 },
  { label: '菜单编码', prop: 'name', minWidth: 120 },
  { label: '路由路径', prop: 'path', minWidth: 140 },
]

// 父级菜单树：/system/menu/tree 需按 roleId 查询（无参返回空），改用当前用户菜单树
const loadTree = async (): Promise<MenuTreeNode[]> => {
  const tree = await getCurrentUserMenu()
  return tree as unknown as MenuTreeNode[]
}

const loadList = (params: { page: number, pageSize: number, parentId: string | number | null }) => {
  return getPageMenuList({
    page: params.page,
    pageSize: params.pageSize,
    title: null,
    name: null,
    parentId: params.parentId == null ? null : String(params.parentId),
    visible: null,
    status: null,
  })
}

const handleSelect = (row: MenuTreeNode) => {
  emit('select', { id: row.id, title: row.title })
}
</script>

<template>
  <TreeTableSelector :visible="props.visible" title="选择父级菜单" :load-tree="loadTree" :load-list="loadList"
    :columns="columns" :tree-props="{ label: 'title', children: 'children' }"
    @update:visible="(v) => emit('update:visible', v)" @select="handleSelect" />
</template>