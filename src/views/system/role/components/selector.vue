<script setup lang="ts">
import { reactive } from 'vue'
import ProSearch from '@/components/ProSearch.vue'
import type { RoleListRequest, RoleStatus } from '@/types/system/role.ts'
import { EnableStatus } from '@/constants/enumCode'

const queryData = reactive<Omit<RoleListRequest, 'page' | 'pageSize'>>({
  name: null,
  code: null,
  status: null,
})

const emit = defineEmits<{
  (e: 'query', params: Omit<RoleListRequest, 'page' | 'pageSize'>): void
  (e: 'reset'): void
}>()

const statusOptions: { label: string; value: RoleStatus }[] = [
  { label: '启用', value: EnableStatus.ENABLE },
  { label: '禁用', value: EnableStatus.DISABLE },
]

const handleQuery = () => {
  emit('query', {
    name: queryData.name || null,
    code: queryData.code || null,
    status: queryData.status,
  })
}

const handleReset = () => {
  queryData.name = null
  queryData.code = null
  queryData.status = null
  emit('reset')
}
</script>

<template>
  <ProSearch class="role-selector" @search="handleQuery" @reset="handleReset">
    <el-input v-model="queryData.name" placeholder="角色名称" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input v-model="queryData.code" placeholder="角色编码" clearable style="width: 160px; flex: 0 0 160px" />
    <el-select v-model="queryData.status" placeholder="状态" clearable style="width: 120px; flex: 0 0 120px">
      <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </ProSearch>
</template>
