<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { CircleClose, Search } from '@element-plus/icons-vue'
import type { PermissionSaveRequest } from '@/types/system/permission.ts'
import { EnableStatus, PermissionType } from '@/constants/enumCode'
import ParentPermissionSelector from '@/views/system/permission/components/parentPermissionSelector.vue'
import BaseSaveDialog from '@/components/BaseSaveDialog.vue'

type EditRow = PermissionSaveRequest & { parentName?: string }

const props = defineProps<{
  visible: boolean
  title?: string
  mode?: 'add' | 'edit'
  row?: EditRow | null
}>()
const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', form: PermissionSaveRequest): void
}>()

const formRef = ref<FormInstance>()
const parentSelectorVisible = ref(false)
const parentName = ref('')

const form = reactive<PermissionSaveRequest>({
  id: undefined,
  name: '',
  code: '',
  type: PermissionType.MENU,
  parentId: null,
  sort: 0,
  status: EnableStatus.ENABLE,
  remark: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const openParentSelector = () => {
  parentSelectorVisible.value = true
}

const handleParentSelect = (permission: { id: string; name: string }) => {
  form.parentId = permission.id
  parentName.value = permission.name
}

const clearParent = () => {
  form.parentId = null
  parentName.value = ''
}

const resetForm = () => {
  const isEdit = props.mode === 'edit' && !!props.row
  form.id = isEdit ? props.row?.id : undefined
  form.name = isEdit ? (props.row?.name ?? '') : ''
  form.code = isEdit ? (props.row?.code ?? '') : ''
  form.type = isEdit ? (props.row?.type ?? PermissionType.MENU) : PermissionType.MENU
  form.parentId = isEdit ? (props.row?.parentId ?? null) : null
  form.sort = isEdit ? (props.row?.sort ?? 0) : 0
  form.status = isEdit ? (props.row?.status ?? EnableStatus.ENABLE) : EnableStatus.ENABLE
  form.remark = isEdit ? (props.row?.remark ?? '') : ''
  parentName.value = isEdit ? (props.row?.parentName ?? '') : ''
  formRef.value?.clearValidate()
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
    }
  },
)

const handleSubmit = () => {
  formRef.value?.validate((valid) => {
    if (!valid) return
    emit('submit', { ...form })
  })
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <BaseSaveDialog
    :visible="props.visible"
    :title="props.title ?? (props.mode === 'edit' ? '修改权限' : '新增权限')"
    width="500px"
    @cancel="handleCancel"
    @submit="handleSubmit"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="权限名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入权限名称" clearable />
      </el-form-item>
      <el-form-item label="权限编码" prop="code">
        <el-input v-model="form.code" placeholder="请输入权限编码" clearable />
      </el-form-item>
      <el-form-item label="权限类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择权限类型" style="width: 100%">
          <el-option label="菜单" :value="PermissionType.MENU" />
          <el-option label="按钮" :value="PermissionType.BUTTON" />
        </el-select>
      </el-form-item>
      <el-form-item label="父级权限" prop="parentId">
        <el-input :model-value="parentName" readonly placeholder="点击选择父级权限" @click="openParentSelector">
          <template #suffix>
            <el-icon v-if="form.parentId" class="field-icon" @click.stop="clearParent">
              <CircleClose />
            </el-icon>
            <el-icon v-else class="field-icon" @click.stop="openParentSelector">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="props.mode !== 'edit'" label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="0" :max="9999" style="width: 100%" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
          <el-option label="启用" :value="EnableStatus.ENABLE" />
          <el-option label="禁用" :value="EnableStatus.DISABLE" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" clearable />
      </el-form-item>
    </el-form>
    <ParentPermissionSelector v-model:visible="parentSelectorVisible" @select="handleParentSelect" />
  </BaseSaveDialog>
</template>

<style scoped>
.field-icon {
  cursor: pointer;
}
</style>
