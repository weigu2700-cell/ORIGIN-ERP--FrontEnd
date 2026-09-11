<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SalesOrderVo } from '@/types/sales/salesOrder';
import { getDetailSalesOrder } from '@/api/sales/salesOrder';
import { ElMessage } from 'element-plus';
import { formatDecimal } from '@/composables/useFormat';

const props = defineProps<{
  visible: boolean
  orderId?: string | null
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
}>()

const loading = ref(false)
const detail = ref<SalesOrderVo | null>(null)

const statusMap: Record<number, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  0: { label: '草稿', type: 'info' },
  1: { label: '已确认', type: 'success' },
  2: { label: '已完成', type: 'warning' },
  3: { label: '已取消', type: 'danger' }
}

const loadDetail = async (id: string) => {
  try {
    loading.value = true
    detail.value = await getDetailSalesOrder(id)
  } catch {
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val && props.orderId) {
    loadDetail(props.orderId)
  } else {
    detail.value = null
  }
})

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <el-dialog :model-value="props.visible" title="订单详情" width="900px" @close="handleCancel" v-loading="loading">
    <template v-if="detail">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ detail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="订单日期">{{ detail.orderDate }}</el-descriptions-item>
        <el-descriptions-item label="交货日期">{{ detail.deliveryDate }}</el-descriptions-item>
        <el-descriptions-item label="总金额">{{ formatDecimal.thousand(detail.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[detail.status]?.type ?? 'info'">
            {{ statusMap[detail.status]?.label ?? '未知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>订单明细</el-divider>

      <el-table :data="detail.items" border>
        <el-table-column label="行号" prop="lineNo" width="60" align="center" />
        <el-table-column label="物料编码" prop="materialCode" width="120" />
        <el-table-column label="物料名称" prop="materialName" min-width="140" />
        <el-table-column label="仓库" prop="warehouseName" min-width="120" />
        <el-table-column label="数量" prop="quantity" width="100" align="right">
          <template #default="{ row }">
            {{ formatDecimal.default(row.quantity, 0) }}
          </template>
        </el-table-column>
        <el-table-column label="单价" prop="unitPrice" width="100" align="right">
          <template #default="{ row }">
            {{ formatDecimal.default(row.unitPrice) }}
          </template>
        </el-table-column>
        <el-table-column label="金额" prop="amount" width="100" align="right">
          <template #default="{ row }">
            {{ formatDecimal.thousand(row.amount) }}
          </template>
        </el-table-column>
      </el-table>
    </template>

    <template #footer>
      <el-button @click="handleCancel">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped></style>