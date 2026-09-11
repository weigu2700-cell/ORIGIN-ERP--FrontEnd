<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProTable, { type ProColumn } from "@/components/ProTable.vue";
import type { UserQuery, getUserListResponse } from "@/types/system/user.ts";
import {
  getUserList,
  createUser,
  updateUser,
  getUserDetail,
  updateUserStatus
} from "@/api/system/user.ts";
import ProToolbar from "@/components/ProToolbar.vue";
import SaveDialog from "@/views/system/user/components/saveDialog.vue";
import AssignDialog from "@/views/system/user/assignDialog.vue";
import Selector from "@/views/system/user/components/selector.vue";
import type {
  UserAdd,
  UserUpdate,
  UserListRecord,
  UserStatus
} from "@/types/system/user.ts";
import PageHeader from '@/components/PageHeader.vue'

defineOptions({ name: 'SystemUserPage' })

import type { PageResult } from '@/types/common'

const tableData = ref<PageResult<UserListRecord>>()
const dialogMode = ref<'add' | 'edit'>('add')
const dialogVisible = ref(false)
const editRow = ref<UserAdd & { id?: string, deptName?: string } | null>(null)
const selectedData = ref<UserListRecord[]>([])
const assignMode = ref<'role' | 'dept'>('role')
const assignVisible = ref(false)
const assignRow = ref<{ id: string, username: string, realName?: string } | null>(null)
const queryData = reactive<{
  page: number
  pageSize: number
  username: string | null
  realName: string | null
  deptId: string | null
  status: UserStatus | null
  phone: string | null
}>({
  page: 1,
  pageSize: 10,
  username: null,
  realName: null,
  deptId: null,
  status: null,
  phone: null,
})

const columns: ProColumn<UserListRecord>[] = [
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '用户名', prop: 'username', width: 220, sortable: true },
  { label: '姓名', prop: 'realName', width: 220, sortable: true },
  { label: '手机号', prop: 'phone', width: 220 },
  { label: '所属部门', prop: 'deptName', width: 200 },
  { label: '角色', prop: 'roles', width: 200, slot: 'roles' },
  { label: '操作', prop: 'actions', fixed: 'right', slot: 'actions', minWidth: 240 },
]

const statusLabel: Record<UserStatus, string> = {
  1: '正常',
  2: '锁定',
  3: '注销',
}

const statusTagType: Record<UserStatus, 'success' | 'warning' | 'info'> = {
  1: 'success',
  2: 'warning',
  3: 'info',
}

const handleQuery = async (queryData: UserQuery) => {
  try {
    tableData.value = await getUserList(queryData)
  } catch { }
}

const openAssignDialog = (row: getUserListResponse['records'][number], mode: 'role' | 'dept') => {
  assignMode.value = mode
  assignRow.value = { id: row.id, username: row.username, realName: row.realName }
  assignVisible.value = true
}

const handleSelectorQuery = (params: Omit<UserQuery, 'page' | 'pageSize'>) => {
  Object.assign(queryData, params, { page: 1 })
  handleQuery(queryData)
}

const handleSelectorReset = () => {
  queryData.username = null
  queryData.realName = null
  queryData.phone = null
  queryData.deptId = null
  queryData.status = null
  queryData.page = 1
  handleQuery(queryData)
}

const handleAdd = () => {
  dialogMode.value = 'add'
  editRow.value = null
  dialogVisible.value = true
}

const handleEdit = async () => {
  const row = selectedData.value[0]
  if (!row) {
    ElMessage.warning('请先选择要修改的数据')
    return
  }
  try {
    const detail = await getUserDetail(row.id)
    dialogMode.value = 'edit'
    editRow.value = {
      id: detail.id,
      username: detail.username,
      realName: detail.realName,
      password: '',
      deptId: detail.deptId ?? null,
      deptName: detail.deptName ?? row.deptName ?? '',
      roleIds: detail.roleIds ?? null
    }
    dialogVisible.value = true
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}


const handleCancel = () => {
  dialogVisible.value = false
}

const handleStatusChange = async (row: UserListRecord, status: UserStatus) => {
  if (row.status === status) return
  try {
    await ElMessageBox.confirm(
      `确定将用户“${row.realName || row.username}”修改为${statusLabel[status]}状态吗？`,
      '修改状态',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await updateUserStatus({ id: row.id, status })
    ElMessage.success('状态修改成功')
    await handleQuery(queryData)
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

const handleSubmit = async (form: UserAdd & { id?: string }) => {
  try {
    if (dialogMode.value === 'edit') {
      if (!form.id) return
      await updateUser(form as UserUpdate)
      ElMessage.success('修改成功')
    } else {
      await createUser(form)
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
  <div class="user-container round">
    <PageHeader title="用户管理" description="维护系统用户、角色与账号状态">
      <template #search>
        <Selector @query="handleSelectorQuery" @reset="handleSelectorReset" />
      </template>
      <template #toolbar>
        <ProToolbar :show-delete="false" :show-export="false" @add="handleAdd" @edit="handleEdit"
          @refresh="handleQuery(queryData)" />
      </template>
    </PageHeader>
    <div class="table round">
      <ProTable :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.page" :page-size="queryData.pageSize"
        @update:page="(p) => { queryData.page = p; handleQuery(queryData) }"
        @update:pageSize="(s) => { queryData.pageSize = s; queryData.page = 1; handleQuery(queryData) }"
        @selectionChange="(rows) => selectedData = rows">
        <template #roles="{ row }">
          <el-tag v-for="role in row.roles" :key="role.roleId" class="role-tag" size="small">{{ role.roleName
            }}</el-tag>
        </template>
        <template #status="{ row }">
          <el-dropdown trigger="click" @command="(status: UserStatus) => handleStatusChange(row, status)">
            <el-tag :type="statusTagType[row.status as UserStatus]" class="status-tag" size="small">
              {{ statusLabel[row.status as UserStatus] ?? row.status }}
            </el-tag>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="1" :disabled="row.status === 1">正常</el-dropdown-item>
                <el-dropdown-item :command="2" :disabled="row.status === 2">锁定</el-dropdown-item>
                <el-dropdown-item :command="3" :disabled="row.status === 3">注销</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #actions="{ row }">
          <el-button type="text" @click="openAssignDialog(row, 'role')">分配角色</el-button>
          <el-button type="text" @click="openAssignDialog(row, 'dept')">分配部门</el-button>
        </template>
      </ProTable>
    </div>
  </div>

  <SaveDialog :visible="dialogVisible" :mode="dialogMode" :row="editRow" @submit="handleSubmit"
    @cancel="handleCancel" />

  <AssignDialog :visible="assignVisible" :mode="assignMode" :row="assignRow" @success="handleQuery(queryData)"
    @cancel="assignVisible = false" />
</template>

<style scoped>
.user-container {
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

  .role-tag {
    margin-right: 6px;
  }

  .status-tag {
    cursor: pointer;
  }
}
</style>