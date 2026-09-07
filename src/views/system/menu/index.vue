<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTable, { type ProColumn } from "@/components/ProTable.vue";
import ProTree from "@/components/ProTree.vue";
import Selector from "@/views/system/menu/components/selector.vue";
import SaveDialog from "@/views/system/menu/components/saveDialog.vue";
import {
  getMenuList,
  getCurrentUserMenu,
  createMenu,
  updateMenu,
  deleteMenu
} from "@/api/system/menu.ts";
import { isClassIcon } from "@/utils/icon.ts";
import type {
  MenuListRequest,
  MenuListResponse,
  MenuListVO,
  MenuSaveRequest,
  MenuTreeNode
} from "@/types/system/menu.ts";
import ProPageTitle from '@/components/ProPageTitle.vue'

type EditRow = MenuSaveRequest & { parentName?: string }

const tableData = ref<MenuListResponse>()
const dialogMode = ref<'add' | 'edit'>('add')
const dialogVisible = ref(false)
const editRow = ref<EditRow | null>(null)
const selectedData = ref<MenuListResponse['records']>([])
const treeData = ref<MenuTreeNode[]>([])
const queryData = reactive<MenuListRequest>({
  page: 1,
  pageSize: 10,
  title: null,
  name: null,
  parentId: null,
  visible: null,
  status: null,
})

const columns: ProColumn[] = [
  { label: '菜单名称', prop: 'title', width: 160, fixed: 'left' },
  { label: '菜单编码', prop: 'name', width: 180 },
  { label: '路由路径', prop: 'path', width: 240 },
  { label: '父级菜单', prop: 'parentName', width: 140 },
  { label: '图标', prop: 'icon', width: 140, slot: 'icon' },
  { label: '可见性', prop: 'visible', width: 100, slot: 'visible' },
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
]

const handleQuery = async (params: MenuListRequest) => {
  try {
    tableData.value = await getMenuList(params)
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

const handleSelectorQuery = (params: Omit<MenuListRequest, 'page' | 'pageSize'>) => {
  Object.assign(queryData, params, { page: 1 })
  handleQuery(queryData)
}

const handleSelectorReset = () => {
  queryData.title = null
  queryData.name = null
  queryData.parentId = null
  queryData.visible = null
  queryData.status = null
  queryData.page = 1
  handleQuery(queryData)
}

// /system/menu/tree 需按 roleId 查询（无参返回空），左侧树使用当前用户菜单树
const loadTree = async () => {
  try {
    const tree = await getCurrentUserMenu()
    treeData.value = tree as unknown as MenuTreeNode[]
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

// 点击左侧菜单树，按 parentId 过滤右侧列表
const handleTreeClick = (node: MenuTreeNode | { id: string }) => {
  const id = (node as { id: string }).id
  // id 是雪花 Long 字符串，直接传字符串避免 Number 精度丢失
  queryData.parentId = id === '__all__' ? null : id
  queryData.page = 1
  handleQuery(queryData)
}

const handleAdd = () => {
  dialogMode.value = 'add'
  editRow.value = null
  dialogVisible.value = true
}

const openEditDialog = (row: MenuListVO) => {
  dialogMode.value = 'edit'
  editRow.value = {
    id: row.id,
    name: row.name,
    title: row.title,
    path: row.path,
    component: row.component,
    icon: row.icon ?? null,
    parentId: row.parentId,
    parentName: row.parentName ?? '',
    visible: row.visible,
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
      `确定删除选中的 ${selectedData.value.length} 条菜单数据吗？`,
      '提示',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    const ids = selectedData.value.map(item => item.id)
    await Promise.all(ids.map(id => deleteMenu(id)))
    ElMessage.success('删除成功')
    await handleQuery(queryData)
  } catch {
    // 取消或请求失败均在此处，错误信息已由拦截器提示
  }
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleSubmit = async (form: MenuSaveRequest) => {
  try {
    if (dialogMode.value === 'edit' && form.id != null) {
      await updateMenu({
        id: form.id,
        name: form.name,
        title: form.title,
        path: form.path,
        component: form.component ?? '',
        icon: form.icon ?? null,
        parentId: form.parentId ?? null,
        visible: form.visible ?? 1,
        status: form.status,
      })
      ElMessage.success('修改成功')
    } else {
      await createMenu({
        name: form.name,
        title: form.title,
        path: form.path,
        component: form.component ?? '',
        icon: form.icon ?? null,
        parentId: form.parentId ?? null,
        visible: form.visible ?? 1,
        status: form.status,
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
  <div class="menu-container round">
    <ProPageTitle title="菜单管理" description="维护系统菜单、路由与显示顺序" />
    <div class="page-body">
      <div class="tree round">
        <ProTree :data="treeData" :tree-props="{ label: 'title', children: 'children' }" show-root
          @node-click="handleTreeClick" />
      </div>
      <div class="content">
        <div class="selector round">
          <Selector @query="handleSelectorQuery" @reset="handleSelectorReset" />
        </div>
        <div class="toolbar round">
          <ProToolbar :show-export="false" @add="handleAdd" @edit="handleEdit" @delete="handleDelete"
            @refresh="handleQuery(queryData)" />
        </div>
        <div class="table round">
          <ProTable :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
            :page="queryData.page" :page-size="queryData.pageSize"
            @update:page="(p) => { queryData.page = p; handleQuery(queryData) }"
            @update:pageSize="(s) => { queryData.pageSize = s; queryData.page = 1; handleQuery(queryData) }"
            @selectionChange="(rows) => selectedData = rows">
            <template #icon="{ row }">
              <span v-if="row.icon" class="icon-cell">
                <el-icon v-if="!isClassIcon(row.icon)">
                  <component :is="row.icon" />
                </el-icon>
                <i v-else :class="row.icon"></i>
                <span class="icon-name">{{ row.icon }}</span>
              </span>
              <span v-else>-</span>
            </template>
            <template #visible="{ row }">
              <el-tag :type="row.visible === 1 ? 'primary' : 'info'" size="small">
                {{ row.visible === 1 ? '显示' : '隐藏' }}
              </el-tag>
            </template>
            <template #status="{ row }">
              <el-tag :type="row.status === 'ENABLE' ? 'success' : 'danger'" size="small">
                {{ row.status === 'ENABLE' ? '启用' : '禁用' }}
              </el-tag>
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
.menu-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  width: 100%;
}

.menu-container .page-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 8px;
}

.menu-container .page-body .tree {
  width: 240px;
  flex: 0 0 240px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.menu-container .page-body .content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-container .page-body .selector {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e4e7ed;
}

.menu-container .page-body .table {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.icon-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-color-primary);
}

.icon-cell .icon-name {
  color: #606266;
  font-size: 12px;
}
</style>
