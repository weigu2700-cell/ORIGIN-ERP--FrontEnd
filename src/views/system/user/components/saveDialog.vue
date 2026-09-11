<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { CircleClose, Search } from "@element-plus/icons-vue";
import type { UserAdd } from "@/types/system/user.ts";
import ParentDeptSelector from "@/views/system/dept/components/parentDeptSelector.vue";
import BaseSaveDialog from "@/components/BaseSaveDialog.vue";

type EditRow = UserAdd & { id?: string, deptName?: string }

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
const deptSelectorVisible = ref(false)
const deptName = ref('')
// TODO: 接入角色列表接口后填充 roleOptions
const roleOptions = ref<{ roleId: string, roleName: string }[]>([])

const form = reactive<EditRow>({
  id: undefined,
  username: '',
  password: '',
  realName: '',
  deptId: null,
  roleIds: null
})

const validatePassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (props.mode === 'add' && !value) {
    callback(new Error('请输入密码'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择所属部门', trigger: 'change' }]
}

const openDeptSelector = () => {
  deptSelectorVisible.value = true
}

const handleDeptSelect = (dept: { id: string, name: string }) => {
  form.deptId = dept.id
  deptName.value = dept.name
}

const clearDept = () => {
  form.deptId = null
  deptName.value = ''
}

const resetForm = () => {
  const isEdit = props.mode === 'edit' && !!props.row
  form.id = isEdit ? props.row?.id : undefined
  form.username = isEdit ? props.row?.username ?? '' : ''
  form.password = ''
  form.realName = isEdit ? props.row?.realName ?? '' : ''
  form.deptId = isEdit ? props.row?.deptId ?? null : null
  form.roleIds = isEdit ? props.row?.roleIds ?? null : null
  deptName.value = isEdit ? props.row?.deptName ?? '' : ''
  formRef.value?.clearValidate()
}

watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
  }
})

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
  <BaseSaveDialog :visible="props.visible" :title="props.title ?? (props.mode === 'edit' ? '修改用户' : '新增用户')"
    width="600px" @cancel="handleCancel" @submit="handleSubmit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="form.realName" placeholder="请输入真实姓名" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password
              :placeholder="props.mode === 'edit' ? '留空则不修改' : '请输入密码'" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属部门" prop="deptId">
            <el-input :model-value="deptName" readonly placeholder="点击选择所属部门" @click="openDeptSelector">
              <template #suffix>
                <el-icon v-if="form.deptId" class="field-icon" @click.stop="clearDept">
                  <CircleClose />
                </el-icon>
                <el-icon v-else class="field-icon" @click.stop="openDeptSelector">
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="角色" prop="roleIds">
            <el-select v-model="form.roleIds" multiple clearable placeholder="请选择角色" style="width: 100%">
              <el-option v-for="role in roleOptions" :key="role.roleId" :label="role.roleName" :value="role.roleId" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <!-- 预留：手机号、邮箱等扩展字段 -->
        </el-col>
      </el-row>
    </el-form>
    <ParentDeptSelector v-model:visible="deptSelectorVisible" @select="handleDeptSelect" />
  </BaseSaveDialog>
</template>

<style scoped>
.field-icon {
  cursor: pointer;
}
</style>