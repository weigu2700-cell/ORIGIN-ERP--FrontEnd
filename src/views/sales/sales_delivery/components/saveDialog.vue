<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type { PostSaleDelivery, PostSaleDeliveryItem } from '@/types/sales/salesDelivery';
import SalesOrderRefer from '@/refer/SalesOrderRefer.vue';
import WarehouseRefer from '@/refer/WarehouseRefer.vue';
import MaterialRefer from '@/refer/MaterialRefer.vue';
import BaseSaveDialog from '@/components/BaseSaveDialog.vue';

const props = defineProps<{
  visible: boolean
  title?: string
  mode?: 'add' | 'edit'
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', form: PostSaleDelivery): void
}>()

const formRef = ref<FormInstance>()

const form = reactive<PostSaleDelivery>({
  salesOrderId: 0,
  deliveryDate: '',
  items: [],
  remark: ''
})

const rules: FormRules = {
  salesOrderId: [{ required: true, message: '请选择销售订单', trigger: 'change' }],
  deliveryDate: [{ required: true, message: '请选择交货日期', trigger: 'change' }]
}

const addItem = () => {
  form.items.push({
    salesOrderItemId: 0,
    quantity: 0
  })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const handleSalesOrderChange = (value: string | number | null) => {
  form.salesOrderId = Number(value ?? 0)
}

const handleSubmit = () => {
  formRef.value?.validate((valid) => {
    if (!valid) return
    emit('submit', { ...form })
  })
}

const handleCancel = () => {
  emit('cancel')
}

watch(() => props.visible, (val) => {
  if (!val) return
  if (props.mode === 'add') {
    form.salesOrderId = 0
    form.deliveryDate = ''
    form.items = []
    form.remark = ''
  }
  formRef.value?.clearValidate()
})
</script>

<template>
  <BaseSaveDialog :visible="props.visible" :title="props.title ?? '新增销售交货单'" width="900px" @cancel="handleCancel"
    @submit="handleSubmit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="销售订单" prop="salesOrderId">
            <SalesOrderRefer v-model="form.salesOrderId" @update:model-value="handleSalesOrderChange" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="交货日期" prop="deliveryDate">
            <el-date-picker v-model="form.deliveryDate" type="datetime" placeholder="请选择交货日期"
              format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>

      <el-divider>交货明细</el-divider>

      <el-button type="primary" size="small" @click="addItem">添加明细</el-button>
      <el-table :data="form.items" border style="margin-top: 10px">
        <el-table-column label="行号" width="60" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="物料" min-width="140">
          <template #default="{ row }">
            <MaterialRefer v-model="row.materialId" />
          </template>
        </el-table-column>
        <el-table-column label="仓库" min-width="140">
          <template #default="{ row }">
            <WarehouseRefer v-model="row.warehouseId" />
          </template>
        </el-table-column>
        <el-table-column label="数量" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.quantity" :min="0" :precision="0" size="small" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ $index }">
            <el-button type="danger" size="small" @click="removeItem($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
  </BaseSaveDialog>
</template>

<style scoped></style>
