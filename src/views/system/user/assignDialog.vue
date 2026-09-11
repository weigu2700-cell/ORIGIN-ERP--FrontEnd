<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { ElTree } from "element-plus";
import type { RoleInfo } from "@/types/system/role.ts";
import type { deptTree } from "@/types/system/dept.ts";
import { getPageRoleList } from "@/api/system/role.ts";
import { getDeptTree } from "@/api/system/dept.ts";
import { assignUserRoles, getDetailUser, updateUser } from "@/api/system/user.ts";

interface UserRow {
  id: string
  username: string
  realName?: string
}

const props = defineProps<{
  visible: boolean
  mode: 'role' | 'dept'
  row: UserRow | null
}>()
const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'success'): void
}>()

const deptTreeRef = ref<InstanceType<typeof ElTree>>()
const roleOptions = ref<RoleInfo[]>([])
const deptTree = ref<deptTree[]>([])
const selectedRoleIds = ref<string[]>([])
const saving = ref(false)
const loading = ref(false)

// 加载全量角色（角色为平级列表，用于多选分配）
const loadRoles = async () => {
  try {
    const res = await getPageRoleList({
      page: 1,
      pageSize: 999,
      name: null,
      code: null,
      sort: null,
      status: null,
    })
    roleOptions.value = res.records
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

// 加载部门树（树形结构，用于单选分配）
const loadDeptTree = async () => {
  try {
    deptTree.value = await getDeptTree()
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

const loadEcho = async () => {
  if (!props.row) return
  try {
    const detail = await getDetailUser(props.row.id)
    if (props.mode === 'role') {
      // 详情返回 roleIds 为 string[]（雪花 ID），直接回填
      selectedRoleIds.value = detail.roleIds ?? []
    } else {
      await nextTick()
      deptTreeRef.value?.setCurrentKey(detail.deptId ?? null)
    }
  } catch {
    // 错误信息已由请求拦截器统一提示
  }
}

watch(() => props.visible, (visible) => {
  if (visible && props.row) {
    selectedRoleIds.value = []
    loading.value = true
    const load = async () => {
      if (props.mode === 'role') {
        await loadRoles()
      } else {
        await loadDeptTree()
      }
      await loadEcho()
    }
    load().finally(() => {
      loading.value = false
    })
  }
})

const handleSave = async () => {
  if (!props.row) {
    ElMessage.warning('缺少用户数据')
    return
  }
  saving.value = true
  try {
    if (props.mode === 'role') {
      await assignUserRoles({ userId: props.row.id, roleIds: selectedRoleIds.value })
      ElMessage.success('角色分配成功')
    } else {
      // 分配部门直接复用修改接口（PUT /system/user/{id}），仅提交 id + username + deptId
      const deptId = (deptTreeRef.value?.getCurrentKey() as string | undefined) ?? null
      await updateUser({
        id: props.row.id,
        username: props.row.username,
        deptId,
      })
      ElMessage.success('部门分配成功')
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
  <el-dialog :model-value="props.visible"
    :title="`${props.mode === 'role' ? '分配角色' : '分配部门'} - ${props.row?.username ?? ''}`" width="520px"
    @close="handleCancel">
    <div v-loading="loading" class="assign-wrap">
      <!-- 分配角色：平级角色多选 -->
      <el-select v-if="props.mode === 'role'" v-model="selectedRoleIds" multiple filterable placeholder="请选择角色"
        style="width: 100%">
        <el-option v-for="role in roleOptions" :key="role.id" :label="role.name" :value="role.id" />
      </el-select>

      <!-- 分配部门：部门树单选 -->
      <template v-else>
        <div class="dept-tip">选择一个部门作为用户的所属部门；不选择则清除原部门。</div>
        <el-tree ref="deptTreeRef" :data="deptTree" :props="{ label: 'name', children: 'children' }" node-key="id"
          highlight-current default-expand-all />
      </template>
    </div>
    <template #footer>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      <el-button @click="handleCancel">取消</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.assign-wrap {
  min-height: 200px;

  .dept-tip {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }
}
</style>