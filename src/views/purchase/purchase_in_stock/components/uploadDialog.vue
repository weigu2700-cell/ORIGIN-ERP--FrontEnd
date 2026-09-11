<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import WarehouseRefer from '@/refer/WarehouseRefer.vue'
import type { PurchaseInStock, PurchaseInStockUpload } from '@/types/purchase/purchaseInStock'

const props = defineProps<{ visible: boolean; row?: PurchaseInStock | null }>()
const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', data: PurchaseInStockUpload): void
}>()
const formRef = ref<FormInstance>()
const form = reactive<PurchaseInStockUpload>({ storageLocation: '' })
const rules: FormRules<PurchaseInStockUpload> = {
  warehouseId: [{ required: true, message: '请选择上架仓库', trigger: 'change' }],
  storageLocation: [{ required: true, message: '请输入库位', trigger: 'blur' }],
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    Object.assign(form, {
      warehouseId: props.row?.warehouseId ?? null,
      storageLocation: props.row?.storageLocation ?? '',
      batchNo: props.row?.batchNo ?? '',
      productionDate: props.row?.productionDate ?? '',
      expiryDate: props.row?.expiryDate ?? '',
    })
    formRef.value?.clearValidate()
  },
)

const submit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...form })
}
</script>

<template>
  <el-dialog :model-value="visible" title="采购入库上架" width="620px" align-center @close="emit('cancel')">
    <el-alert title="上架后将增加实际库存，并通知相关缺料领料单。" type="info" :closable="false" show-icon />
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="upload-form">
      <el-form-item label="入库单号"><el-input :model-value="row?.purchaseInStockNo" disabled /></el-form-item>
      <el-form-item label="物料">
        <el-input :model-value="`${row?.materialCode ?? ''} ${row?.materialName ?? ''}`.trim()" disabled />
      </el-form-item>
      <el-form-item label="上架仓库" prop="warehouseId"><WarehouseRefer v-model="form.warehouseId" /></el-form-item>
      <el-form-item label="库位" prop="storageLocation">
        <el-input v-model="form.storageLocation" placeholder="如 A-01-03" clearable />
      </el-form-item>
      <el-form-item label="批次号">
        <el-input v-model="form.batchNo" placeholder="请输入入库批次" clearable />
      </el-form-item>
      <el-form-item label="生产日期">
        <el-date-picker v-model="form.productionDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
      </el-form-item>
      <el-form-item label="有效期至">
        <el-date-picker v-model="form.expiryDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button type="primary" @click="submit">确认上架</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.upload-form {
  margin-top: 20px;
}
.upload-form :deep(.el-input),
.upload-form :deep(.el-date-editor) {
  width: 100%;
}
</style>
