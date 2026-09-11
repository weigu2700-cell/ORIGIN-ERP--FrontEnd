<script setup lang="ts">
import { reactive, ref } from "vue";
import ParentDeptSelector from "@/views/system/dept/components/parentDeptSelector.vue";
import { CircleClose, Search } from "@element-plus/icons-vue";
import type { DeptQuery } from "@/types/system/dept.ts";
import ProSearch from "@/components/ProSearch.vue";

let parentSelectorVisible = ref(false)

type DeptQueryLocal = DeptQuery & {
  parentName: string | null
}

const queryData = reactive<DeptQueryLocal>({
  page: 1,
  pageSize: 10,
  name: '',
  code: '',
  parentId: null,
  parentName: '',
  status: null,
})
const emit = defineEmits<{
  (e: 'query', params: Omit<DeptQuery, 'page' | 'pageSize'>): void
  (e: 'reset'): void
}>()
const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
]

const openParentSelector = () => {
  parentSelectorVisible.value = true
}

const clearParent = () => {
  queryData.parentId = null
  queryData.parentName = null
}

const handleParentSelect = (dept: { id: string, name: string }) => {
  queryData.parentId = dept.id
  queryData.parentName = dept.name
  parentSelectorVisible.value = false
}

const handleQuery = () => {
  // 后端只接收 id，parentName 仅用于展示，不发出去
  emit('query', {
    name: queryData.name || null,
    code: queryData.code || null,
    parentId: queryData.parentId,
    status: queryData.status,
  })
}

const handleReset = () => {
  queryData.name = ''
  queryData.code = ''
  queryData.parentId = null
  queryData.parentName = null
  queryData.status = null
  emit('reset')
}
</script>

<template>
  <ProSearch class="dept-selector" @search="handleQuery" @reset="handleReset">
    <el-input v-model="queryData.name" placeholder="部门名称" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input v-model="queryData.code" placeholder="部门编码" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input :model-value="queryData.parentName" readonly placeholder="点击选择上级部门" @click="openParentSelector"
      style="width: 160px; flex: 0 0 160px">
      <template #suffix>
        <el-icon v-if="queryData.parentName" class="field-icon" @click.stop="clearParent">
          <CircleClose />
        </el-icon>
        <el-icon v-else class="field-icon" @click.stop="openParentSelector">
          <Search />
        </el-icon>
      </template>
    </el-input>
    <el-select v-model="queryData.status" placeholder="请选择状态" clearable style="width: 120px; flex: 0 0 120px">
      <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </ProSearch>
  <ParentDeptSelector :visible="parentSelectorVisible" @select="handleParentSelect" />
</template>

<style scoped>
.dept-selector {

  .field-icon {
    cursor: pointer;
  }
}
</style>