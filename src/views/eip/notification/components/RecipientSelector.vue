<script setup lang="ts">
import { computed, reactive } from 'vue'
import ReferPicker from '@/components/ReferPicker.vue'
import { getPageDeptList } from '@/api/system/dept'
import { getPagePermissionList } from '@/api/system/permission'
import { getPageRoleList } from '@/api/system/role'
import { getPageUserList } from '@/api/system/user'
import type { RecipientSelector } from '@/types/eip/notification'

defineOptions({ name: 'RecipientSelector' })

const createRecipientSelector = (): RecipientSelector => ({
  userIds: [],
  roleCodes: [],
  permissionCodes: [],
  departmentIds: [],
  allActiveUsers: false,
  includeChildDepartments: false,
  includeAdministrators: false,
})

const model = defineModel<RecipientSelector>({
  default: () => ({
    userIds: [],
    roleCodes: [],
    permissionCodes: [],
    departmentIds: [],
    allActiveUsers: false,
    includeChildDepartments: false,
    includeAdministrators: false,
  }),
})

type SearchType = 'USER' | 'ROLE' | 'PERMISSION' | 'DEPARTMENT'
const searchTypes: SearchType[] = ['USER', 'ROLE', 'PERMISSION', 'DEPARTMENT']
const fields: Record<SearchType, keyof RecipientSelector> = {
  USER: 'userIds',
  ROLE: 'roleCodes',
  PERMISSION: 'permissionCodes',
  DEPARTMENT: 'departmentIds',
}

const labelKeys: Record<SearchType, string> = {
  USER: 'realName',
  ROLE: 'name',
  PERMISSION: 'name',
  DEPARTMENT: 'name',
}
const selectedLabels = reactive<Record<SearchType, Record<string, string>>>({
  USER: {},
  ROLE: {},
  PERMISSION: {},
  DEPARTMENT: {},
})

const patch = <K extends keyof RecipientSelector>(key: K, value: RecipientSelector[K]) => {
  model.value = { ...createRecipientSelector(), ...model.value, [key]: value }
}

const selected = (type: SearchType) =>
  computed<string[]>({
    get: () => (model.value[fields[type]] as string[] | undefined) ?? [],
    set: (value) => patch(fields[type], value),
  })

const selectedValues = Object.fromEntries(searchTypes.map((type) => [type, selected(type)])) as Record<
  SearchType,
  ReturnType<typeof selected>
>

const selectedSummary = (type: SearchType) => {
  const values = selectedValues[type].value
  if (!values.length) return ''
  const labels = values.map((value) => selectedLabels[type][value]).filter(Boolean)
  return values.length === 1 && labels.length ? labels[0] : `已选择 ${values.length} 项`
}

const page = (params: Record<string, unknown>) => ({
  page: Number(params.pageNum) || 1,
  pageSize: Number(params.pageSize) || 10,
})

const userFetcher = (params: Record<string, unknown>) =>
  getPageUserList({ ...page(params), realName: String(params.realName || '') || null })

const roleFetcher = (params: Record<string, unknown>) =>
  getPageRoleList({ ...page(params), name: String(params.name || '') || null })

const permissionFetcher = (params: Record<string, unknown>) =>
  getPagePermissionList({ ...page(params), name: String(params.name || '') || null })

const departmentFetcher = (params: Record<string, unknown>) =>
  getPageDeptList({ ...page(params), name: String(params.name || '') || null })

const appendReference = (type: SearchType, row: Record<string, unknown> | null) => {
  if (!row) {
    patch(fields[type], [])
    selectedLabels[type] = {}
    return
  }
  const value = String(type === 'ROLE' || type === 'PERMISSION' ? row.code : row.id)
  if (!value || value === 'undefined') return
  const label = String(row[labelKeys[type]] ?? row.name ?? row.realName ?? '')
  if (label) selectedLabels[type][value] = label
  const values = selectedValues[type].value
  patch(fields[type], values.includes(value) ? values : [...values, value])
}

const allActiveUsers = computed({
  get: () => model.value.allActiveUsers,
  set: (value: boolean) => patch('allActiveUsers', value),
})
const includeAdministrators = computed({
  get: () => model.value.includeAdministrators,
  set: (value: boolean) => patch('includeAdministrators', value),
})
const includeChildDepartments = computed({
  get: () => model.value.includeChildDepartments,
  set: (value: boolean) => patch('includeChildDepartments', value),
})
</script>

<template>
  <div class="recipient-selector">
    <div class="recipient-switches">
      <el-switch v-model="allActiveUsers" active-text="全部启用用户" />
      <el-switch v-model="includeAdministrators" active-text="包含管理员" />
      <el-switch
        v-model="includeChildDepartments"
        active-text="包含部门下级"
        :disabled="allActiveUsers || !selectedValues.DEPARTMENT.value.length"
      />
    </div>

    <div class="recipient-fields">
      <ReferPicker
        :model-value="selectedValues.USER.value.length ? 'selected' : null"
        :display-text="selectedSummary('USER')"
        title="用户参照"
        placeholder="选择用户"
        label-key="realName"
        search-field="realName"
        search-placeholder="请输入姓名"
        :columns="[
          { prop: 'realName', label: '姓名', minWidth: 120 },
          { prop: 'username', label: '账号', minWidth: 130 },
        ]"
        :fetcher="userFetcher"
        :disabled="allActiveUsers"
        @change="appendReference('USER', $event)"
      />
      <ReferPicker
        :model-value="selectedValues.ROLE.value.length ? 'selected' : null"
        :display-text="selectedSummary('ROLE')"
        title="角色参照"
        placeholder="选择角色"
        label-key="name"
        search-placeholder="请输入角色名称"
        :columns="[
          { prop: 'name', label: '角色名称', minWidth: 130 },
          { prop: 'code', label: '角色编码', minWidth: 150 },
        ]"
        :fetcher="roleFetcher"
        :disabled="allActiveUsers"
        @change="appendReference('ROLE', $event)"
      />
      <ReferPicker
        :model-value="selectedValues.PERMISSION.value.length ? 'selected' : null"
        :display-text="selectedSummary('PERMISSION')"
        title="权限参照"
        placeholder="选择权限"
        label-key="name"
        search-placeholder="请输入权限名称"
        :columns="[
          { prop: 'name', label: '权限名称', minWidth: 130 },
          { prop: 'code', label: '权限编码', minWidth: 180 },
        ]"
        :fetcher="permissionFetcher"
        :disabled="allActiveUsers"
        @change="appendReference('PERMISSION', $event)"
      />
      <ReferPicker
        :model-value="selectedValues.DEPARTMENT.value.length ? 'selected' : null"
        :display-text="selectedSummary('DEPARTMENT')"
        title="部门参照"
        placeholder="选择部门"
        label-key="name"
        search-placeholder="请输入部门名称"
        :columns="[
          { prop: 'name', label: '部门名称', minWidth: 130 },
          { prop: 'code', label: '部门编码', minWidth: 150 },
        ]"
        :fetcher="departmentFetcher"
        :disabled="allActiveUsers"
        @change="appendReference('DEPARTMENT', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.recipient-selector {
  display: grid;
  gap: 12px;
}

.recipient-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.recipient-fields {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 720px) {
  .recipient-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
