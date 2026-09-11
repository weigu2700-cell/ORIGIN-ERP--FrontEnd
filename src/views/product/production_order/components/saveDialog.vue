<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type { ProductionOrderAdd, ProductionOrderVo } from '@/types/product/productionOrder';
import MaterialRefer from '@/refer/MaterialRefer.vue';
import ProductionDemandRefer from '@/refer/ProductionDemandRefer.vue';
import BaseSaveDialog from '@/components/BaseSaveDialog.vue';

const props = defineProps<{
  visible: boolean
  title?: string
  mode?: 'add' | 'edit'
  row?: ProductionOrderVo | null
}>()

const emit = defineEmits<{
  (e: 'submit', data: ProductionOrderAdd): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()

const form = reactive<ProductionOrderAdd>({
  productionDemandId: '',
  materialId: '',
  plannedQuantity: 0,
  plannedStartTime: '',
  plannedEndTime: '',
  remark: ''
})

const rules: FormRules = {
  productionDemandId: [{ required: false, message: '请选择生产需求', trigger: 'change' }],
  materialId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  plannedQuantity: [{ required: true, message: '请输入计划数量', trigger: 'blur' }],
  plannedStartTime: [{ required: true, message: '请选择计划开始时间', trigger: 'change' }],
  plannedEndTime: [{ required: true, message: '请选择计划结束时间', trigger: 'change' }]
}

const handleDemandChange = (v: string | number | null) => {
  form.productionDemandId = v == null ? '' : String(v)
  formRef.value?.validateField('productionDemandId').catch(() => { })
}

const handleMaterialChange = (v: string | number | null) => {
  form.materialId = v == null ? '' : String(v)
  formRef.value?.validateField('materialId').catch(() => { })
}

const resetForm = () => {
  const isEdit = props.mode === 'edit' && !!props.row
  form.productionDemandId = isEdit ? String(props.row?.productionDemandId ?? '') : ''
  form.materialId = isEdit ? String(props.row?.materialId ?? '') : ''
  form.plannedQuantity = isEdit ? props.row?.plannedQuantity ?? 0 : 0
  form.plannedStartTime = isEdit ? String(props.row?.plannedStartTime ?? '') : ''
  form.plannedEndTime = isEdit ? String(props.row?.plannedEndTime ?? '') : ''
  form.remark = isEdit ? props.row?.remark ?? '' : ''
  formRef.value?.clearValidate()
}

watch(() => props.visible, (val) => {
  if (val) resetForm()
})

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请完善必填项后再保存')
    return
  }
  emit('submit', { ...form })
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <BaseSaveDialog :visible="props.visible" :title="props.title ?? (props.mode === 'edit' ? '修改生产订单' : '新增生产订单')"
    width="800px" @cancel="handleCancel" @submit="handleSubmit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="生产需求" prop="productionDemandId">
            <ProductionDemandRefer v-model="form.productionDemandId" @update:model-value="handleDemandChange" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物料" prop="materialId">
            <MaterialRefer v-model="form.materialId" @update:model-value="handleMaterialChange" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="计划数量" prop="plannedQuantity">
            <el-input-number v-model="form.plannedQuantity" :min="0" :precision="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="计划开始时间" prop="plannedStartTime">
            <el-date-picker v-model="form.plannedStartTime" type="datetime" placeholder="请选择计划开始时间"
              format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="计划结束时间" prop="plannedEndTime">
            <el-date-picker v-model="form.plannedEndTime" type="datetime" placeholder="请选择计划结束时间"
              format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </BaseSaveDialog>
</template>

<style scoped></style>