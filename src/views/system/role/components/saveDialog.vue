<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { RoleSaveRequest } from '@/types/system/role.ts'
import { EnableStatus } from '@/constants/enumCode'
import BaseSaveDialog from '@/components/BaseSaveDialog.vue'

type EditRow = RoleSaveRequest

const props = defineProps<{
  visible: boolean
  title?: string
  mode?: 'add' | 'edit'
  row?: EditRow | null
}>()
const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', form: EditRow): void
}>()

const formRef = ref<FormInstance>()

const form = reactive<EditRow>({
  id: undefined,
  name: '',
  code: '',
  status: EnableStatus.ENABLE,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const resetForm = () => {
  const isEdit = props.mode === 'edit' && !!props.row
  form.id = isEdit ? props.row?.id : undefined
  form.name = isEdit ? (props.row?.name ?? '') : ''
  form.code = isEdit ? (props.row?.code ?? '') : ''
  form.status = isEdit ? (props.row?.status ?? EnableStatus.ENABLE) : EnableStatus.ENABLE
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
    :title="props.title ?? (props.mode === 'edit' ? '修改角色' : '新增角色')"
    width="500px"
    @cancel="handleCancel"
    @submit="handleSubmit"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入角色名称" clearable />
      </el-form-item>
      <el-form-item label="角色编码" prop="code">
        <el-input v-model="form.code" placeholder="请输入角色编码" clearable />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
          <el-option label="启用" :value="EnableStatus.ENABLE" />
          <el-option label="禁用" :value="EnableStatus.DISABLE" />
        </el-select>
      </el-form-item>
    </el-form>
  </BaseSaveDialog>
</template>
