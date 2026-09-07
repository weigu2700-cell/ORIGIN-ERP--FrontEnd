<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTable, { type ProColumn } from "@/components/ProTable.vue";
import Selector from "@/views/system/role/components/selector.vue";
import SaveDialog from "@/views/system/role/components/saveDialog.vue";
import AssignDialog from "@/views/system/role/assignDialog.vue";
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole
} from "@/api/system/role.ts";
import type { RoleListRequest, RoleListResponse, RoleInfo, RoleSaveRequest } from "@/types/system/role.ts";
import PageHeader from '@/components/PageHeader.vue'

const tableData = ref<RoleListResponse>()
const dialogMode = ref<'add' | 'edit'>('add')
const dialogVisible = ref(false)
const editRow = ref<RoleSaveRequest | null>(null)
const assignVisible = ref(false)
const assignMode = ref<'permission' | 'menu'>('permission')
const assignRow = ref<RoleInfo | null>(null)
const selectedData = ref<RoleListResponse['records']>([])
const queryData = reactive<RoleListRequest>({
  page: 1,
  pageSize: 10,
  name: null,
  code: null,
  status: null,
})

const columns: ProColumn[] = [
  { label: '角色名称', prop: 'name', width: 160, fixed: 'left' },
  { label: '角色编码', prop: 'code', width: 160 },
  { label: '排序', prop: 'sort', width: 100 },
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '操作', prop: 'actions', fixed: 'right', width: 180, slot: 'actions' },
]

const handleQuery = async (params: RoleListRequest) => {
  try {
    tableData.value = await getRoleList(params)
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

const handleSelectorQuery = (params: Omit<RoleListRequest, 'page' | 'pageSize'>) => {
  Object.assign(queryData, params, { page: 1 })
  handleQuery(queryData)
}

const handleSelectorReset = () => {
  queryData.name = null
  queryData.code = null
  queryData.status = null
  queryData.page = 1
  handleQuery(queryData)
}

const handleAdd = () => {
  dialogMode.value = 'add'
  editRow.value = null
  dialogVisible.value = true
}

const openEditDialog = (row: RoleListResponse['records'][number]) => {
  dialogMode.value = 'edit'
  editRow.value = {
    id: row.id,
    name: row.name,
    code: row.code,
    status: row.status,
  }
  dialogVisible.value = true
}

const handleEdit = () => {
  const row = selectedData.value[0]
  if (!row) {
    ElMessage.warning('请先选择要修改的数据')
    return
  }
  openEditDialog(row)
}

const handleDelete = async () => {
  if (selectedData.value.length === 0) {
    ElMessage.warning('请先选择要删除的数据')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedData.value.length} 条角色数据吗？`,
      '提示',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    const ids = selectedData.value.map(item => item.id)
    await Promise.all(ids.map(id => deleteRole(id)))
    ElMessage.success('删除成功')
    await handleQuery(queryData)
  } catch {
    // 取消或请求失败均在此处，错误信息已由拦截器提示
  }
}

const handleCancel = () => {
  dialogVisible.value = false
}

const openAssignDialog = (row: RoleListResponse['records'][number], mode: 'permission' | 'menu') => {
  assignRow.value = row
  assignMode.value = mode
  assignVisible.value = true
}

const handleSubmit = async (form: RoleSaveRequest) => {
  try {
    if (dialogMode.value === 'edit') {
      if (!form.id) return
      await updateRole(form)
      ElMessage.success('修改成功')
    } else {
      await createRole(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await handleQuery(queryData)
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

onMounted(() => {
  handleQuery(queryData)
})
</script>

<template>
  <div class="role-container round">
    <PageHeader title="角色管理" description="维护角色资料并分配菜单权限">
      <template #search><Selector @query="handleSelectorQuery" @reset="handleSelectorReset" /></template>
      <template #toolbar><ProToolbar :show-export="false" @add="handleAdd" @edit="handleEdit"
        @delete="handleDelete" @refresh="handleQuery(queryData)" /></template>
    </PageHeader>
    <div class="table round">
      <ProTable :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.page" :page-size="queryData.pageSize"
        @update:page="(p) => { queryData.page = p; handleQuery(queryData) }"
        @update:pageSize="(s) => { queryData.pageSize = s; queryData.page = 1; handleQuery(queryData) }"
        @selectionChange="(rows) => selectedData = rows">
        <template #status="{ row }">
          <el-tag :type="row.status === 'ENABLE' ? 'success' : 'danger'" size="small">
            {{ row.status === 'ENABLE' ? '启用' : '禁用' }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button type="text" @click="openAssignDialog(row, 'permission')">分配权限</el-button>
          <el-button type="text" @click="openAssignDialog(row, 'menu')">分配菜单</el-button>
        </template>
      </ProTable>
    </div>
  </div>

  <SaveDialog :visible="dialogVisible" :mode="dialogMode" :row="editRow" @submit="handleSubmit"
    @cancel="handleCancel" />

  <AssignDialog :visible="assignVisible" :mode="assignMode" :row="assignRow" @cancel="assignVisible = false"
    @success="handleQuery(queryData)" />
</template>

<style scoped>
.role-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  width: 100%;

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
