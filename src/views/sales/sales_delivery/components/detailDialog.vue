<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SalesDeliveryVo } from '@/types/sales/salesDelivery';
import { getDetailSalesDelivery } from '@/api/sales/salesDelivery';
import { ElMessage } from 'element-plus';
import { formatDecimal } from '@/composables/useFormat';

const props = defineProps<{
  visible: boolean
  deliveryId?: string | null
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
}>()

const loading = ref(false)
const detail = ref<SalesDeliveryVo | null>(null)

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  CONFIRMED: { label: '已确认', type: 'success' },
  COMPLETED: { label: '已完成', type: 'warning' },
  CANCELLED: { label: '已取消', type: 'danger' }
}

const loadDetail = async (id: string) => {
  try {
    loading.value = true
    detail.value = await getDetailSalesDelivery(id)
  } catch {
    ElMessage.error('获取交货单详情失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val && props.deliveryId) {
    loadDetail(props.deliveryId)
  } else {
    detail.value = null
  }
})

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <el-dialog :model-value="props.visible" title="交货单详情" width="900px" @close="handleCancel" v-loading="loading">
    <template v-if="detail">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="交货单号">{{ detail.deliveryNo }}</el-descriptions-item>
        <el-descriptions-item label="销售订单号">{{ detail.salesOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ detail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="交货日期">{{ detail.deliveryDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[detail.status]?.type ?? 'info'">
            {{ statusMap[detail.status]?.label ?? '未知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>交货明细</el-divider>

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
      </el-table>
    </template>

    <template #footer>
      <el-button @click="handleCancel">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped></style>