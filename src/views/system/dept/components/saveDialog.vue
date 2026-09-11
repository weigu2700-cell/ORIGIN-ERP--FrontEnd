<script setup lang="ts">

import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { CircleClose, Search } from "@element-plus/icons-vue";
import type { DeptAdd } from "@/types/system/dept.ts";
import ParentDeptSelector from "@/views/system/dept/components/parentDeptSelector.vue";
import BaseSaveDialog from "@/components/BaseSaveDialog.vue";

type EditRow = DeptAdd & { parentName?: string }

const props = defineProps<{
  visible: boolean
  title?: string
  mode?: 'add' | 'edit'
  row?: EditRow | null
}>()
const emit = defineEmits(['submit', 'cancel'])

const formRef = ref<FormInstance>()
const parentSelectorVisible = ref(false)
const parentName = ref('')

const form = reactive<DeptAdd>({
  id: undefined,
  name: '',
  code: '',
  parentId: null,
  sort: 0
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }]
}

const openParentSelector = () => {
  parentSelectorVisible.value = true
}

const handleParentSelect = (dept: { id: string, name: string }) => {
  form.parentId = dept.id
  parentName.value = dept.name
}

const clearParent = () => {
  form.parentId = null
  parentName.value = ''
}

const resetForm = () => {
  const isEdit = props.mode === 'edit' && !!props.row
  form.id = isEdit ? props.row?.id : undefined
  form.name = isEdit ? props.row?.name ?? '' : ''
  form.code = isEdit ? props.row?.code ?? '' : ''
  form.parentId = isEdit ? props.row?.parentId ?? null : null
  form.sort = isEdit ? props.row?.sort ?? 0 : 0
  parentName.value = isEdit ? props.row?.parentName ?? '' : ''
  formRef.value?.clearValidate()
}

watch(() => props.visible, (val) => {
  if (val) resetForm()
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
  <BaseSaveDialog :visible="props.visible" :title="props.title ?? (props.mode === 'edit' ? '修改部门' : '新增部门')"
    width="600px" @cancel="handleCancel" @submit="handleSubmit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入部门名称" clearable></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门编码" prop="code">
            <el-input v-model="form.code" placeholder="请输入部门编码" clearable></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="上级部门" prop="parentId">
            <el-input :model-value="parentName" readonly placeholder="点击选择上级部门" @click="openParentSelector">
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
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :min="0" :max="9999" controls-position="right"
              style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <ParentDeptSelector v-model:visible="parentSelectorVisible" @select="handleParentSelect" />
  </BaseSaveDialog>
</template>

<style scoped>
.field-icon {
  cursor: pointer;
}
</style>