<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import FactoryRefer from '@/refer/FactoryRefer.vue'
import type {
  WarehouseCreateRequest,
  WarehouseType,
  WarehouseUpdateRequest,
  WarehouseVO,
} from '@/types/master/warehouse.ts'
import { EnableStatus, WarehouseType as WarehouseTypeCode } from '@/constants/enumCode'
import BaseSaveDialog from '@/components/BaseSaveDialog.vue'

const props = defineProps<{
  visible: boolean
  title?: string
  mode?: 'add' | 'edit'
  row?: WarehouseVO | null
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', form: WarehouseCreateRequest | WarehouseUpdateRequest): void
}>()

const formRef = ref<FormInstance>()

const typeOptions: { label: string; value: WarehouseType }[] = [
  { label: '成品仓', value: WarehouseTypeCode.FINISHED },
  { label: '原料仓', value: WarehouseTypeCode.MATERIAL },
  { label: '半成品仓', value: WarehouseTypeCode.SEMI_FINISHED },
  { label: '废品仓', value: WarehouseTypeCode.SCRAP },
  { label: '其他', value: WarehouseTypeCode.OTHER },
]

const form = reactive<WarehouseCreateRequest>({
  name: '',
  type: WarehouseTypeCode.FINISHED,
  factoryId: '',
  status: EnableStatus.ENABLE,
  address: '',
  remark: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择仓库类型', trigger: 'change' }],
  factoryId: [{ required: true, message: '请选择所属工厂', trigger: 'change' }],
}

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    if (props.mode === 'edit' && props.row) {
      form.name = props.row.name
      form.type = props.row.type ?? WarehouseTypeCode.FINISHED
      form.factoryId = props.row.factoryId ?? ''
      form.address = props.row.address ?? ''
      form.remark = props.row.remark ?? ''
    } else {
      form.name = ''
      form.type = WarehouseTypeCode.FINISHED
      form.factoryId = ''
      form.status = EnableStatus.ENABLE
      form.address = ''
      form.remark = ''
    }
    formRef.value?.clearValidate()
  },
)

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完善必填项后再保存')
    return
  }
  if (props.mode === 'edit') {
    // 后端 WarehouseUpdateDTO 只支持 name/address/remark
    const updateForm: WarehouseUpdateRequest = {
      name: form.name,
      address: form.address,
      remark: form.remark,
    }
    emit('submit', updateForm)
  } else {
    emit('submit', { ...form })
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <BaseSaveDialog :visible="props.visible" :title="title" width="480px" @cancel="handleCancel" @submit="handleSubmit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="仓库名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入仓库名称" clearable />
      </el-form-item>
      <!-- 编辑模式下后端不支持修改仓库类型/所属工厂，仅新增展示 -->
      <template v-if="mode === 'add'">
        <el-form-item label="仓库类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择仓库类型" style="width: 100%">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属工厂" prop="factoryId">
          <FactoryRefer v-model="form.factoryId" />
        </el-form-item>
      </template>
      <el-form-item label="仓库地址" prop="address">
        <el-input v-model="form.address" placeholder="请输入仓库地址" clearable />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
  </BaseSaveDialog>
</template>

<style scoped></style>
