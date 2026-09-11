<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import { ElMessage } from "element-plus";
import type { DeptQuery, deptColumns, DeptAdd, deptTree } from "@/types/system/dept.ts";
import { getPageDeptList, getDeptTree, addDept, updateDept } from "@/api/system/dept.ts";
import SaveDialog from "@/views/system/dept/components/saveDialog.vue";
import Selector from "@/views/system/dept/components/selector.vue";
import ProTable from "@/components/ProTable.vue";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTree from "@/components/ProTree.vue";
import PageHeader from '@/components/PageHeader.vue'

import type { PageResult } from '@/types/common'

interface DeptRecord {
  id: string
  name: string
  code: string
  parentName: string
  createTime: string
  updateTime: string
}

const tableData = ref<PageResult<DeptRecord>>()
const selectedData = ref<DeptRecord[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const editRow = ref<DeptAdd & { parentName?: string } | null>(null)
const treeData = ref<deptTree[]>([])
const queryData = reactive<DeptQuery>({
  page: 1,
  pageSize: 10,
  name: null,
  code: null,
  parentId: null,
  status: null,
  sort: null
})

const columns: deptColumns[] = [
  { label: '部门名称', prop: 'name', width: 240, sortable: true, fixed: 'left' },
  { label: '部门编码', prop: 'code', width: 240, sortable: true, fixed: 'left' },
  { label: '上级部门', prop: 'parentName', width: 240, sortable: true, fixed: 'left' },
  { label: '创建时间', prop: 'createTime', width: 200, sortable: true, fixed: 'left' },
]

const handleQuery = async (queryData: DeptQuery) => {
  tableData.value = await getPageDeptList(queryData)
}

const loadTree = async () => {
  try {
    treeData.value = await getDeptTree()
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

// 点击左侧部门树，按 parentId 过滤右侧列表
const handleTreeClick = (node: deptTree | { id: string }) => {
  queryData.parentId = (node as { id: string }).id === '__all__' ? null : (node as { id: string }).id
  queryData.page = 1
  handleQuery(queryData)
}

const handleSelectorQuery = (params: Omit<DeptQuery, 'page' | 'pageSize'>) => {
  Object.assign(queryData, params, { page: 1 })
  handleQuery(queryData)
}

const handleSelectorReset = () => {
  queryData.name = null
  queryData.code = null
  queryData.parentId = null
  queryData.status = null
  queryData.page = 1
  handleQuery(queryData)
}

const handleAdd = () => {
  dialogMode.value = 'add'
  editRow.value = null
  dialogVisible.value = true
}

const handleEdit = () => {
  const row = selectedData.value[0]
  if (!row) {
    ElMessage.warning('请先选择要修改的数据')
    return
  }
  dialogMode.value = 'edit'
  editRow.value = {
    id: row.id,
    name: row.name,
    code: row.code,
    parentId: null,
    sort: 0,
    parentName: row.parentName
  }
  dialogVisible.value = true
}

const handleDelete = () => {
  if (selectedData.value.length === 0) {
    ElMessage.warning('请先选择要删除的数据')
    return
  }
  ElMessage.warning('删除功能待接入')
}

const handleSubmit = async (form: DeptAdd) => {
  try {
    if (dialogMode.value === 'edit') {
      await updateDept(form)
      ElMessage.success('修改成功')
    } else {
      await addDept(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await handleQuery(queryData)
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

const handleCancel = () => {
  dialogVisible.value = false
}

onMounted(() => {
  handleQuery(queryData)
  loadTree()
})
</script>

<template>
  <div class="dept-container round">
    <PageHeader title="部门管理" description="维护组织部门与层级关系">
      <template #search>
        <Selector @query="handleSelectorQuery" @reset="handleSelectorReset" />
      </template>
      <template #toolbar>
        <ProToolbar @add="handleAdd" @edit="handleEdit" @delete="handleDelete" @refresh="handleQuery(queryData)" />
      </template>
    </PageHeader>
    <div class="page-body">
      <div class="tree round">
        <ProTree :data="treeData" show-root @node-click="handleTreeClick" />
      </div>
      <div class="content">
        <div class="table round">
          <ProTable :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
            :page="queryData.page" :page-size="queryData.pageSize"
            @update:page="(p) => { queryData.page = p; handleQuery(queryData) }"
            @update:pageSize="(s) => { queryData.pageSize = s; queryData.page = 1; handleQuery(queryData) }"
            @selectionChange="(rows) => selectedData = rows as DeptRecord[]" />
        </div>
      </div>
    </div>
    <SaveDialog :visible="dialogVisible" :mode="dialogMode" :row="editRow" @submit="handleSubmit"
      @cancel="handleCancel" />
  </div>
</template>

<style scoped>
.dept-container {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .page-body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 10px;

    .tree {
      width: 240px;
      flex: 0 0 240px;
      background: #ffffff;
      border: 1px solid #e4e7ed;
      overflow: hidden;
    }

    .content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }

  .selector {
    width: 100%;
    background: #ffffff;
    border: 1px solid #e4e7ed;
  }

  .table {
    width: 100%;
    flex: 1;
    min-height: 0;
  }
}
</style>