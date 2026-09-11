<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type { PostOrPutSalesOrder, PostOrPutSalesOrderItem, SalesOrderVo } from '@/types/sales/salesOrder';
import CustomerRefer from '@/refer/CustomerRefer.vue';
import MaterialRefer from '@/refer/MaterialRefer.vue';
import WarehouseRefer from '@/refer/WarehouseRefer.vue';
import BaseSaveDialog from '@/components/BaseSaveDialog.vue';

const props = defineProps<{
  visible: boolean
  title?: string
  mode?: 'add' | 'edit'
  row?: SalesOrderVo | null
}>()

const emit = defineEmits<{
  (e: 'submit', data: PostOrPutSalesOrder): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()

const form = reactive<PostOrPutSalesOrder>({
  customerId: '',
  orderDate: '',
  deliveryDate: '',
  remark: '',
  items: []
})

const rules: FormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  orderDate: [{ required: true, message: '请选择订单日期', trigger: 'change' }],
  deliveryDate: [{ required: true, message: '请选择交货日期', trigger: 'change' }]
}

const addItem = () => {
  form.items.push({
    materialId: 0,
    warehouseId: 0,
    quantity: 0,
    unitPrice: 0
  })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const calculateAmount = (item: PostOrPutSalesOrderItem) => {
  return item.quantity * item.unitPrice
}

const handleCustomerChange = (v: string | number | null) => {
  form.customerId = v == null ? '' : String(v)
  formRef.value?.validateField('customerId').catch(() => { })
}

const handleMaterialChange = (index: number, v: string | number | null) => {
  if (form.items[index]) {
    form.items[index].materialId = v == null ? 0 : Number(v)
  }
}

const handleWarehouseChange = (index: number, v: string | number | null) => {
  if (form.items[index]) {
    form.items[index].warehouseId = v == null ? 0 : Number(v)
  }
}

const resetForm = () => {
  const isEdit = props.mode === 'edit' && !!props.row
  form.customerId = isEdit ? props.row?.customerId ?? '' : ''
  form.orderDate = isEdit ? String(props.row?.orderDate ?? '') : ''
  form.deliveryDate = isEdit ? String(props.row?.deliveryDate ?? '') : ''
  form.remark = isEdit ? props.row?.remark ?? '' : ''
  form.items = isEdit
    ? (props.row?.items ?? []).map((item) => ({
      materialId: Number(item.materialId),
      warehouseId: Number(item.warehouseId),
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
    : []
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
  if (form.items.length === 0) {
    ElMessage.warning('请至少添加一个订单明细')
    return
  }
  emit('submit', { ...form })
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <BaseSaveDialog :visible="props.visible" :title="props.title ?? (props.mode === 'edit' ? '修改销售订单' : '新增销售订单')"
    width="1000px" @cancel="handleCancel" @submit="handleSubmit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="客户" prop="customerId">
            <CustomerRefer v-model="form.customerId" @update:model-value="handleCustomerChange" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="订单日期" prop="orderDate">
            <el-date-picker v-model="form.orderDate" type="datetime" placeholder="请选择订单日期" format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="交货日期" prop="deliveryDate">
            <el-date-picker v-model="form.deliveryDate" type="datetime" placeholder="请选择交货日期"
              format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>

      <el-divider>订单明细</el-divider>

      <el-button type="primary" size="small" @click="addItem">添加明细</el-button>
      <el-table :data="form.items" border style="margin-top: 10px">
        <el-table-column label="行号" width="60" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="物料" min-width="140">
          <template #default="{ row, $index }">
            <MaterialRefer v-model="row.materialId" @update:model-value="(v) => handleMaterialChange($index, v)" />
          </template>
        </el-table-column>
        <el-table-column label="仓库" min-width="140">
          <template #default="{ row, $index }">
            <WarehouseRefer v-model="row.warehouseId" @update:model-value="(v) => handleWarehouseChange($index, v)" />
          </template>
        </el-table-column>
        <el-table-column label="数量" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.quantity" :min="0" :precision="0" size="small" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="单价" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.unitPrice" :min="0" :precision="2" size="small" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="金额" width="140" align="right">
          <template #default="{ row }">
            {{ calculateAmount(row).toFixed(2) }}
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
