<script setup lang="ts">
  import {computed, nextTick, ref, watch} from "vue";
  import {ElMessage} from "element-plus";
  import type {ElTree} from "element-plus";
  import type {RoleInfo} from "@/types/system/role.ts";
  import type {PermissionNode} from "@/types/system/permission.ts";
  import type {MenuTreeNode, MenuListVO} from "@/types/system/menu.ts";
  import {getPermissionTree} from "@/api/system/permission.ts";
  import {getMenuTree, getMenuList} from "@/api/system/menu.ts";
  import {assignRolePermissions, assignRoleMenus, getRoleDetail} from "@/api/system/role.ts";

  const props = defineProps<{
    visible: boolean
    mode: 'permission' | 'menu'
    row: RoleInfo | null
  }>()
  const emit = defineEmits<{
    (e: 'cancel'): void
    (e: 'success'): void
  }>()

  // 虚拟"全部"父节点 id，仅用于前端一键勾选，不提交后端
  const ALL_NODE_ID = '__all__'

  const permissionTreeRef = ref<InstanceType<typeof ElTree>>()
  const menuTreeRef = ref<InstanceType<typeof ElTree>>()
  const permissionNodes = ref<PermissionNode[]>([])
  const menuTree = ref<MenuTreeNode[]>([])
  const saving = ref(false)
  const loading = ref(false)

  // 在原权限树顶层包一层"全部"父节点，勾选它即可一键分配全部权限
  const permissionTree = computed<PermissionNode[]>(() => [
    {id: ALL_NODE_ID, name: '全部', code: '', type: 'MENU', parentId: null, parentName: null, sort: -1, status: 'ENABLE', remark: null, children: permissionNodes.value},
  ])

  // 递归收集树节点 id（后端 Long 序列化为 string，统一转 string 避免精度丢失）
  const collectIds = (nodes: {id: string | number, children?: any[]}[]): string[] => {
    const ids: string[] = []
    const walk = (list: {id: string | number, children?: {id: string | number, children?: any[]}[]) => {
      list.forEach(n => {
        ids.push(String(n.id))
        if (n.children?.length) walk(n.children)
      })
    }
    walk(nodes)
    return ids
  }

  // 分页循环拉取全部菜单（菜单量小，一次取完），并按 parentId 组装成树
  const fetchAllMenus = async (): Promise<MenuTreeNode[]> => {
    const all: MenuListVO[] = []
    const pageSize = 100
    let page = 1
    for (;;) {
      const res = await getMenuList({
        page,
        pageSize,
        title: null,
        name: null,
        parentId: null,
        visible: null,
        status: null,
      })
      all.push(...res.records)
      if (all.length >= res.total || res.records.length === 0) break
      page += 1
    }
    const map = new Map<string, MenuTreeNode>()
    all.forEach(m => map.set(String(m.id), {
      id: String(m.id),
      name: m.name,
      title: m.title,
      path: m.path,
      component: m.component,
      icon: m.icon,
      parentId: m.parentId,
      children: [],
    }))
    const roots: MenuTreeNode[] = []
    map.forEach(n => {
      const parent = n.parentId != null ? map.get(String(n.parentId)) : undefined
      if (parent) parent.children?.push(n)
      else roots.push(n)
    })
    return roots
  }

  const loadPermissionTree = async () => {
    try {
      // 列表行不含 permissionIds，需从详情接口获取准确回显数据
      const detail = await getRoleDetail(props.row!.id)
      permissionNodes.value = await getPermissionTree()
      await nextTick()
      permissionTreeRef.value?.setCheckedKeys(detail.permissionIds ?? [])
    } catch {
      // 错误信息已由请求拦截器统一提示
    }
  }

  const loadMenuTree = async () => {
    if (!props.row) return
    try {
      // 数据源：全部菜单树（可勾选任意菜单）
      menuTree.value = await fetchAllMenus()
      // 回显：该角色已分配的菜单树（GET /system/menu/tree?dto.roleId=xx）
      const assigned = await getMenuTree(props.row.id)
      await nextTick()
      menuTreeRef.value?.setCheckedKeys(collectIds(assigned))
    } catch {
      // 错误信息已由请求拦截器统一提示
    }
  }

  watch(() => props.visible, (visible) => {
    if (visible && props.row) {
      permissionNodes.value = []
      menuTree.value = []
      loading.value = true
      const done = () => {
        loading.value = false
      }
      if (props.mode === 'permission') {
        loadPermissionTree().finally(done)
      } else {
        loadMenuTree().finally(done)
      }
    }
  })

  const handleSave = async () => {
    if (!props.row) {
      ElMessage.warning('缺少角色数据')
      return
    }
    const tree = props.mode === 'permission' ? permissionTreeRef.value : menuTreeRef.value
    if (!tree) {
      ElMessage.warning('权限树未加载完成，请稍后重试')
      return
    }
    // 剔除虚拟的"全部"节点，避免把 __all__ 提交给后端
    const keys = [...tree.getCheckedKeys(false), ...tree.getHalfCheckedKeys()]
      .map(k => String(k))
      .filter(k => k !== ALL_NODE_ID)
    saving.value = true
    try {
      if (props.mode === 'permission') {
        await assignRolePermissions({roleId: props.row.id, permissionIds: keys})
        ElMessage.success('权限分配成功')
      } else {
        await assignRoleMenus({roleId: props.row.id, menuIds: keys})
        ElMessage.success('菜单分配成功')
      }
      emit('success')
      // 保存成功后自动关闭对话框
      emit('cancel')
    } catch {
      // 错误信息已由请求拦截器统一提示
    } finally {
      saving.value = false
    }
  }

  const handleCancel = () => {
    emit('cancel')
  }
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    :title="`${props.mode === 'permission' ? '分配权限' : '分配菜单'} - ${props.row?.name ?? ''}`"
    width="640px"
    @close="handleCancel"
  >
    <div v-loading="loading" class="tree-wrap">
      <el-tree
        v-if="props.mode === 'permission'"
        ref="permissionTreeRef"
        :data="permissionTree"
        :props="{label: 'name', children: 'children'}"
        node-key="id"
        show-checkbox
        default-expand-all
      >
        <template #default="{ data }">
          <span :class="{'all-node': data.id === ALL_NODE_ID}">{{ data.name }}</span>
        </template>
      </el-tree>
      <el-tree
        v-else
        ref="menuTreeRef"
        :data="menuTree"
        :props="{label: 'title', children: 'children'}"
        node-key="id"
        show-checkbox
        default-expand-all
      />
    </div>
    <template #footer>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      <el-button @click="handleCancel">取消</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
  .tree-wrap {
    max-height: 380px;
    overflow: auto;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 8px;

    :deep(.all-node) {
      font-weight: 600;
    }
  }
</style>
