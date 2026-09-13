<script setup lang="ts">
import { reactive, ref } from 'vue'
import ProSearch from '@/components/ProSearch.vue'
import ParentMenuSelector from '@/views/system/menu/components/parentMenuSelector.vue'
import { CircleClose, Search } from '@element-plus/icons-vue'
import type { MenuListRequest, MenuStatus } from '@/types/system/menu.ts'
import { EnableStatus } from '@/constants/enumCode'

const parentSelectorVisible = ref(false)

const queryData = reactive<Omit<MenuListRequest, 'page' | 'pageSize'> & { parentName: string | null }>({
  title: null,
  name: null,
  parentId: null,
  parentName: '',
  visible: null,
  status: null,
})

const emit = defineEmits<{
  (e: 'query', params: Omit<MenuListRequest, 'page' | 'pageSize'>): void
  (e: 'reset'): void
}>()

const visibleOptions: { label: string; value: number }[] = [
  { label: '显示', value: 1 },
  { label: '隐藏', value: 0 },
]
const statusOptions: { label: string; value: MenuStatus }[] = [
  { label: '启用', value: EnableStatus.ENABLE },
  { label: '禁用', value: EnableStatus.DISABLE },
]

const openParentSelector = () => {
  parentSelectorVisible.value = true
}

const clearParent = () => {
  queryData.parentId = null
  queryData.parentName = null
}

const handleParentSelect = (menu: { id: string; title: string }) => {
  queryData.parentId = menu.id
  queryData.parentName = menu.title
  parentSelectorVisible.value = false
}

const handleQuery = () => {
  emit('query', {
    title: queryData.title || null,
    name: queryData.name || null,
    parentId: queryData.parentId,
    visible: queryData.visible,
    status: queryData.status,
  })
}

const handleReset = () => {
  queryData.title = null
  queryData.name = null
  queryData.parentId = null
  queryData.parentName = null
  queryData.visible = null
  queryData.status = null
  emit('reset')
}
</script>

<template>
  <ProSearch class="menu-selector" @search="handleQuery" @reset="handleReset">
    <el-input v-model="queryData.title" placeholder="菜单名称" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input v-model="queryData.name" placeholder="菜单编码" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input
      :model-value="queryData.parentName"
      readonly
      placeholder="点击选择父级菜单"
      @click="openParentSelector"
      style="width: 160px; flex: 0 0 160px"
    >
      <template #suffix>
        <el-icon v-if="queryData.parentName" class="field-icon" @click.stop="clearParent">
          <CircleClose />
        </el-icon>
        <el-icon v-else class="field-icon" @click.stop="openParentSelector">
          <Search />
        </el-icon>
      </template>
    </el-input>
    <el-select v-model="queryData.visible" placeholder="可见性" clearable style="width: 120px; flex: 0 0 120px">
      <el-option v-for="item in visibleOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-select v-model="queryData.status" placeholder="状态" clearable style="width: 120px; flex: 0 0 120px">
      <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </ProSearch>
  <ParentMenuSelector v-model:visible="parentSelectorVisible" @select="handleParentSelect" />
</template>

<style scoped>
.menu-selector .field-icon {
  cursor: pointer;
}
</style>
