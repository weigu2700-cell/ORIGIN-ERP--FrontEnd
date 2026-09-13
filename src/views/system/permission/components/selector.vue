<script setup lang="ts">
import { reactive, ref } from 'vue'
import ProSearch from '@/components/ProSearch.vue'
import ParentPermissionSelector from '@/views/system/permission/components/parentPermissionSelector.vue'
import { CircleClose, Search } from '@element-plus/icons-vue'
import type { PermissionListRequest, PermissionType, PermissionStatus } from '@/types/system/permission.ts'
import { EnableStatus, PermissionType as PermissionTypeCode } from '@/constants/enumCode'

const parentSelectorVisible = ref(false)

const queryData = reactive<Omit<PermissionListRequest, 'page' | 'pageSize'> & { parentName: string | null }>({
  name: null,
  code: null,
  type: null,
  status: null,
  parentId: null,
  parentName: '',
})

const emit = defineEmits<{
  (e: 'query', params: Omit<PermissionListRequest, 'page' | 'pageSize'>): void
  (e: 'reset'): void
}>()

const typeOptions: { label: string; value: PermissionType }[] = [
  { label: '菜单', value: PermissionTypeCode.MENU },
  { label: '按钮', value: PermissionTypeCode.BUTTON },
]
const statusOptions: { label: string; value: PermissionStatus }[] = [
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

const handleParentSelect = (permission: { id: string; name: string }) => {
  queryData.parentId = permission.id
  queryData.parentName = permission.name
  parentSelectorVisible.value = false
}

const handleQuery = () => {
  emit('query', {
    name: queryData.name || null,
    code: queryData.code || null,
    type: queryData.type,
    status: queryData.status,
    parentId: queryData.parentId,
  })
}

const handleReset = () => {
  queryData.name = null
  queryData.code = null
  queryData.type = null
  queryData.status = null
  queryData.parentId = null
  queryData.parentName = null
  emit('reset')
}
</script>

<template>
  <ProSearch class="permission-selector" @search="handleQuery" @reset="handleReset">
    <el-input v-model="queryData.name" placeholder="权限名称" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input v-model="queryData.code" placeholder="权限编码" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input
      :model-value="queryData.parentName"
      readonly
      placeholder="点击选择父级权限"
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
    <el-select v-model="queryData.type" placeholder="类型" clearable style="width: 120px; flex: 0 0 120px">
      <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-select v-model="queryData.status" placeholder="状态" clearable style="width: 120px; flex: 0 0 120px">
      <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </ProSearch>
  <ParentPermissionSelector v-model:visible="parentSelectorVisible" @select="handleParentSelect" />
</template>

<style scoped>
.permission-selector {
  .field-icon {
    cursor: pointer;
  }
}
</style>
