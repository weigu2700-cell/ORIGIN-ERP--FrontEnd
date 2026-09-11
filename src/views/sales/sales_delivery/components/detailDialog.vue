<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import BusinessDocumentDialog from '@/components/BusinessDocumentDialog.vue'
import type { SalesDeliveryVo } from '@/types/sales/salesDelivery'
import { getDetailSalesDelivery } from '@/api/sales/salesDelivery'
import { formatDate, formatDecimal } from '@/composables/useFormat'

const props = defineProps<{ visible: boolean; deliveryId?: string | null }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const loading = ref(false)
const detail = ref<SalesDeliveryVo | null>(null)
const statusMap = {
  DRAFT: { label: '草稿', type: 'info' },
  CONFIRMED: { label: '已确认', type: 'primary' },
  COMPLETED: { label: '已完成出库', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' },
} as const
const statusMeta = computed(() =>
  detail.value ? statusMap[detail.value.status] : { label: '', type: 'info' as const },
)

const loadDetail = async (id: string) => {
  try {
    loading.value = true
    detail.value = await getDetailSalesDelivery(id)
  } catch {
    ElMessage.error('获取发货单详情失败')
  } finally {
    loading.value = false
  }
}
watch(
  () => [props.visible, props.deliveryId] as const,
  ([visible, id]) => {
    if (visible && id) loadDetail(id)
    else detail.value = null
  },
  { immediate: true },
)
</script>

<template>
  <BusinessDocumentDialog
    :visible="visible"
    title="销售发货单"
    :document-no="detail?.deliveryNo"
    :status-label="statusMeta.label"
    :status-type="statusMeta.type"
    :loading="loading"
    width="1000px"
    @cancel="emit('cancel')"
  >
    <template v-if="detail" #summary>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">来源销售订单</span>
          <span class="summary-value">{{ detail.salesOrderNo }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">客户</span>
          <span class="summary-value">{{ detail.customerName }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">计划发货时间</span>
          <span class="summary-value">{{ formatDate.DateTime(detail.deliveryDate) }}</span>
        </div>
        <div class="summary-item summary-item--wide">
          <span class="summary-label">备注</span>
          <span class="summary-value">{{ detail.remark || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">明细行数</span>
          <span class="summary-value">{{ detail.items?.length ?? 0 }} 行</span>
        </div>
      </div>
    </template>
    <section v-if="detail" class="document-section">
      <h3 class="document-section-title">发货明细</h3>
      <el-table :data="detail.items ?? []" border>
        <el-table-column label="行号" prop="lineNo" width="70" align="center" />
        <el-table-column label="物料编码" prop="materialCode" width="150" />
        <el-table-column label="物料名称" prop="materialName" min-width="200" />
        <el-table-column label="出库仓库" prop="warehouseName" min-width="150" />
        <el-table-column label="发货数量" width="130" align="right">
          <template #default="{ row }">{{ formatDecimal.default(row.quantity, 4) }}</template>
        </el-table-column>
      </el-table>
    </section>
  </BusinessDocumentDialog>
</template>
