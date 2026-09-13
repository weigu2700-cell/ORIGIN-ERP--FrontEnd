<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import BaseSaveDialog from '@/components/BaseSaveDialog.vue'
import ProductionOrderRefer from '@/refer/ProductionOrderRefer.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import type { ProductionReportAdd } from '@/types/product/productionReport'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'cancel'): void; (e: 'submit', value: ProductionReportAdd): void }>()
const formRef = ref<FormInstance>()
const materialDisplayText = ref('')
const form = reactive<ProductionReportAdd>({
  productionOrderId: '',
  materialId: '',
  reportQuantity: 0,
  qualifiedQuantity: 0,
  scrappedQuantity: 0,
  reportTime: '',
  remark: '',
})
const rules: FormRules = {
  productionOrderId: [{ required: true, message: '请选择生产订单', trigger: 'change' }],
  materialId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  reportQuantity: [{ required: true, type: 'number', min: 0.0001, message: '报工数量必须大于 0', trigger: 'change' }],
  qualifiedQuantity: [{ required: true, type: 'number', min: 0, message: '请输入合格数量', trigger: 'change' }],
  scrappedQuantity: [{ required: true, type: 'number', min: 0, message: '请输入报废数量', trigger: 'change' }],
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    Object.assign(form, {
      productionOrderId: '',
      materialId: '',
      reportQuantity: 0,
      qualifiedQuantity: 0,
      scrappedQuantity: 0,
      reportTime: '',
      remark: '',
    })
    materialDisplayText.value = ''
    formRef.value?.clearValidate()
  },
)

const handleProductionOrderChange = (row: Record<string, unknown> | null) => {
  form.materialId = row?.materialId == null ? '' : String(row.materialId)
  const materialCode = row?.materialCode == null ? '' : String(row.materialCode)
  const materialName = row?.materialName == null ? '' : String(row.materialName)
  materialDisplayText.value = [materialCode, materialName].filter(Boolean).join(' - ')
  formRef.value?.clearValidate('materialId')
}

const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) return
  emit('submit', { ...form, reportTime: form.reportTime || undefined, remark: form.remark || undefined })
}
</script>

<template>
  <BaseSaveDialog :visible="visible" title="新增生产报工" width="680px" @cancel="emit('cancel')" @submit="submit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="生产订单" prop="productionOrderId">
            <ProductionOrderRefer v-model="form.productionOrderId" @change="handleProductionOrderChange" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物料" prop="materialId">
            <MaterialRefer v-model="form.materialId" :display-text="materialDisplayText" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="报工数量" prop="reportQuantity">
            <el-input-number v-model="form.reportQuantity" :min="0" :precision="4" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="合格数量" prop="qualifiedQuantity">
            <el-input-number v-model="form.qualifiedQuantity" :min="0" :precision="4" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="报废数量" prop="scrappedQuantity">
            <el-input-number v-model="form.scrappedQuantity" :min="0" :precision="4" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="报工时间">
        <el-date-picker
          v-model="form.reportTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
    </el-form>
  </BaseSaveDialog>
</template>
