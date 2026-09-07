<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTable, { type ProColumn } from "@/components/ProTable.vue";
import ProTree from "@/components/ProTree.vue";
import Selector from "@/views/system/permission/components/selector.vue";
import SaveDialog from "@/views/system/permission/components/saveDialog.vue";
import {
  getPermissionList,
  getPermissionTree,
  createPermission,
  updatePermission
} from "@/api/system/permission.ts";
import type {
  PermissionListRequest,
  PermissionListResponse,
  PermissionNode,
  PermissionSaveRequest
} from "@/types/system/permission.ts";
import PageHeader from '@/components/PageHeader.vue'

type EditRow = PermissionSaveRequest & { parentName?: string }

const tableData = ref<PermissionListResponse>()
const dialogMode = ref<'add' | 'edit'>('add')
const dialogVisible = ref(false)
const editRow = ref<EditRow | null>(null)
const selectedData = ref<PermissionListResponse['records']>([])
const treeData = ref<PermissionNode[]>([])
const queryData = reactive<PermissionListRequest>({
  page: 1,
  pageSize: 10,
  name: null,
  code: null,
  type: null,
  status: null,
})

const columns: ProColumn[] = [
  { label: '权限名称', prop: 'name', width: 180, fixed: 'left' },
  { label: '权限编码', prop: 'code', width: 260 },
  { label: '类型', prop: 'type', width: 100, slot: 'type' },
  { label: '排序', prop: 'sort', width: 100 },
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '操作', prop: 'actions', fixed: 'right', width: 120, slot: 'actions' },
]

const handleQuery = async (params: PermissionListRequest) => {
  try {
    tableData.value = await getPermissionList(params)
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

const handleSelectorQuery = (params: Omit<PermissionListRequest, 'page' | 'pageSize'>) => {
  Object.assign(queryData, params, { page: 1 })
  handleQuery(queryData)
}

const handleSelectorReset = () => {
  queryData.name = null
  queryData.code = null
  queryData.type = null
  queryData.status = null
  queryData.page = 1
  handleQuery(queryData)
}

const loadTree = async () => {
  try {
    treeData.value = await getPermissionTree()
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

// 点击左侧权限树，按 parentId 过滤右侧列表
const handleTreeClick = (node: PermissionNode | { id: string }) => {
  queryData.parentId = (node as { id: string }).id === '__all__' ? null : (node as PermissionNode).id
  queryData.page = 1
  handleQuery(queryData)
}

const handleAdd = () => {
  dialogMode.value = 'add'
  editRow.value = null
  dialogVisible.value = true
}

const openEditDialog = (row: PermissionListResponse['records'][number]) => {
  dialogMode.value = 'edit'
  editRow.value = {
    id: row.id,
    name: row.name,
    code: row.code,
    type: row.type,
    parentId: row.parentId,
    parentName: row.parentName ?? '',
    sort: row.sort,
    status: row.status,
    remark: row.remark ?? '',
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

const handleCancel = () => {
  dialogVisible.value = false
}

const handleSubmit = async (form: PermissionSaveRequest) => {
  try {
    if (dialogMode.value === 'edit' && form.id != null) {
      await updatePermission({
        id: form.id,
        name: form.name,
        code: form.code,
        type: form.type,
        parentId: form.parentId ?? null,
        status: form.status,
        remark: form.remark ?? null,
      })
      ElMessage.success('修改成功')
    } else {
      await createPermission({
        name: form.name,
        code: form.code,
        type: form.type,
        parentId: form.parentId ?? null,
        sort: form.sort ?? 0,
        status: form.status,
        remark: form.remark ?? null,
      })
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
  loadTree()
})
</script>

<template>
  <div class="permission-container round">
    <PageHeader title="权限管理" description="维护权限节点与访问标识">
      <template #search><Selector @query="handleSelectorQuery" @reset="handleSelectorReset" /></template>
      <template #toolbar><ProToolbar :show-delete="false" :show-export="false" @add="handleAdd"
        @edit="handleEdit" @refresh="handleQuery(queryData)" /></template>
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
            @selectionChange="(rows) => selectedData = rows">
            <template #type="{ row }">
              <el-tag :type="row.type === 'MENU' ? 'primary' : 'warning'" size="small">
                {{ row.type === 'MENU' ? '菜单' : '按钮' }}
              </el-tag>
            </template>
            <template #status="{ row }">
              <el-tag :type="row.status === 'ENABLE' ? 'success' : 'danger'" size="small">
                {{ row.status === 'ENABLE' ? '启用' : '禁用' }}
              </el-tag>
            </template>
            <template #actions="{ row }">
              <el-button type="text" @click="openEditDialog(row)">修改</el-button>
            </template>
          </ProTable>
        </div>
      </div>
    </div>
  </div>

  <SaveDialog :visible="dialogVisible" :mode="dialogMode" :row="editRow" @submit="handleSubmit"
    @cancel="handleCancel" />
</template>

<style scoped>
.permission-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  width: 100%;

  .page-body {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 8px;

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
      gap: 8px;
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
