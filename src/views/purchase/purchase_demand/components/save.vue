<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import BaseSaveDialog from '@/components/BaseSaveDialog.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import type { PurchaseDemandAdd } from '@/types/purchase/purchaseDemand'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'submit', data: PurchaseDemandAdd): void
  (e: 'cancel'): void
}>()
const formRef = ref<FormInstance>()
const form = reactive<PurchaseDemandAdd>({
  materialId: '', sourceType: 'OTHER', sourceNo: '', purchaseQuantity: 1,
})
const rules: FormRules = {
  materialId: [{ required: true, message: '请选择物料', trigger: 'change' }],
  sourceType: [{ required: true, message: '请选择来源类型', trigger: 'change' }],
  sourceNo: [{ required: true, message: '请输入来源单号', trigger: 'blur' }],
  purchaseQuantity: [{ required: true, message: '请输入采购数量', trigger: 'blur' }],
}

watch(() => props.visible, visible => {
  if (!visible) return
  Object.assign(form, { materialId: '', sourceType: 'OTHER', sourceNo: '', purchaseQuantity: 1 })
  formRef.value?.clearValidate()
})

const submit = async () => {
  if (!await formRef.value?.validate().catch(() => false)) {
    ElMessage.warning('请完善必填项后再保存')
    return
  }
  emit('submit', { ...form })
}
</script>

<template>
  <BaseSaveDialog :visible="visible" title="新增采购需求" width="640px" @cancel="emit('cancel')" @submit="submit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="物料" prop="materialId">
        <MaterialRefer v-model="form.materialId" />
      </el-form-item>
      <el-form-item label="来源类型" prop="sourceType">
        <el-select v-model="form.sourceType" style="width: 100%">
          <el-option label="生产订单" value="PRODUCTION_ORDER" />
          <el-option label="其他" value="OTHER" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源单号" prop="sourceNo">
        <el-input v-model="form.sourceNo" placeholder="请输入来源单号" />
      </el-form-item>
      <el-form-item label="采购数量" prop="purchaseQuantity">
        <el-input-number v-model="form.purchaseQuantity" :min="0.0001" :precision="4" style="width: 100%" />
      </el-form-item>
    </el-form>
  </BaseSaveDialog>
</template>