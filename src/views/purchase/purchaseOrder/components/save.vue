<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import BaseSaveDialog from '@/components/BaseSaveDialog.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import SupplierRefer from '@/refer/SupplierRefer.vue'
import PurchaseDemandRefer from '@/refer/PurchaseDemandRefer.vue'
import type { CreatePurchaseOrderRequest, PurchaseOrderVo, UpdatePurchaseOrderRequest } from '@/types/purchase/purchaseOrder'

const props = defineProps<{ visible: boolean; mode: 'add' | 'edit'; row?: PurchaseOrderVo | null }>()
const emit = defineEmits<{
  (e: 'submit', data: CreatePurchaseOrderRequest | UpdatePurchaseOrderRequest): void
  (e: 'cancel'): void
}>()
const formRef = ref<FormInstance>()
const form = reactive<CreatePurchaseOrderRequest>({
  purchaseDemandId: '', materialId: '', supplierId: '', plannedQuantity: 1, unitPrice: 0, expectedDeliveryDate: '',
})
const rules: FormRules = {
  purchaseDemandId: [{ required: true, message: '请选择采购需求', trigger: 'change' }],
  materialId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  plannedQuantity: [{ required: true, message: '请输入计划数量', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入采购单价', trigger: 'blur' }],
  expectedDeliveryDate: [{ required: true, message: '请选择预计交货日期', trigger: 'change' }],
}

watch(() => props.visible, visible => {
  if (!visible) return
  const row = props.mode === 'edit' ? props.row : null
  Object.assign(form, {
    purchaseDemandId: row?.purchaseDemandId ?? '', materialId: row?.materialId ?? '', supplierId: row?.supplierId ?? '',
    plannedQuantity: row?.plannedQuantity ?? 1, unitPrice: row?.unitPrice ?? 0,
    expectedDeliveryDate: row?.expectedDeliveryDate ?? '',
  })
  formRef.value?.clearValidate()
})

const selectDemand = (row: Record<string, unknown> | null) => {
  if (!row || props.mode === 'edit') return
  form.materialId = String(row.materialId ?? '')
  form.plannedQuantity = Number(row.purchaseQuantity ?? 1)
}
const submit = async () => {
  if (!await formRef.value?.validate().catch(() => false)) {
    ElMessage.warning('请完善必填项后再保存')
    return
  }
  if (props.mode === 'edit') {
    const { supplierId, unitPrice, plannedQuantity, expectedDeliveryDate } = form
    emit('submit', { supplierId, unitPrice, plannedQuantity, expectedDeliveryDate })
  } else emit('submit', { ...form })
}
</script>

<template>
  <BaseSaveDialog :visible="visible" :title="mode === 'edit' ? '编辑采购订单' : '新增采购订单'" width="760px"
    @cancel="emit('cancel')" @submit="submit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="18">
        <el-col :span="12"><el-form-item label="采购需求" prop="purchaseDemandId"><PurchaseDemandRefer
          v-model="form.purchaseDemandId" :display-text="row?.purchaseDemandNo" @change="selectDemand" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="物料" prop="materialId"><MaterialRefer v-model="form.materialId"
          :display-text="row?.materialName" /></el-form-item></el-col>
      </el-row>
      <el-row :gutter="18">
        <el-col :span="12"><el-form-item label="供应商" prop="supplierId"><SupplierRefer v-model="form.supplierId" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="预计交货" prop="expectedDeliveryDate"><el-date-picker
          v-model="form.expectedDeliveryDate" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" /></el-form-item></el-col>
      </el-row>
      <el-row :gutter="18">
        <el-col :span="12"><el-form-item label="计划数量" prop="plannedQuantity"><el-input-number
          v-model="form.plannedQuantity" :min="0.0001" :precision="4" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="采购单价" prop="unitPrice"><el-input-number
          v-model="form.unitPrice" :min="0" :precision="4" style="width: 100%" /></el-form-item></el-col>
      </el-row>
    </el-form>
  </BaseSaveDialog>
</template>
