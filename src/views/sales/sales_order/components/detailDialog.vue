<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import BusinessDocumentDialog from '@/components/BusinessDocumentDialog.vue'
import type { SalesOrderVo } from '@/types/sales/salesOrder'
import { getDetailSalesOrder } from '@/api/sales/salesOrder'
import { formatDate, formatDecimal } from '@/composables/useFormat'

const props = defineProps<{ visible: boolean; orderId?: string | null }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const loading = ref(false)
const detail = ref<SalesOrderVo | null>(null)
const statusMap = {
  DRAFT: { label: '草稿', type: 'info' },
  CONFIRMED: { label: '已确认', type: 'primary' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' },
} as const
const statusMeta = computed(() =>
  detail.value ? statusMap[detail.value.status] : { label: '', type: 'info' as const },
)

const loadDetail = async (id: string) => {
  try {
    loading.value = true
    detail.value = await getDetailSalesOrder(id)
  } catch {
    ElMessage.error('获取销售订单详情失败')
  } finally {
    loading.value = false
  }
}
watch(
  () => [props.visible, props.orderId] as const,
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
    title="销售订单"
    :document-no="detail?.orderNo"
    :status-label="statusMeta.label"
    :status-type="statusMeta.type"
    :loading="loading"
    width="1040px"
    @cancel="emit('cancel')"
  >
    <template v-if="detail" #summary>
      <div class="summary-grid">
        <div class="summary-item summary-item--wide">
          <span class="summary-label">客户</span>
          <span class="summary-value">{{ detail.customerName }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">订单金额</span>
          <span class="summary-value amount">¥ {{ formatDecimal.thousand(detail.totalAmount, 2) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">订单日期</span>
          <span class="summary-value">{{ formatDate.DateTime(detail.orderDate) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">要求交货日期</span>
          <span class="summary-value">{{ formatDate.DateTime(detail.deliveryDate) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">备注</span>
          <span class="summary-value">{{ detail.remark || '-' }}</span>
        </div>
      </div>
    </template>
    <section v-if="detail" class="document-section">
      <h3 class="document-section-title">
        <span>订单明细</span>
        <small>共 {{ detail.items?.length ?? 0 }} 行</small>
      </h3>
      <el-table :data="detail.items ?? []" border>
        <el-table-column label="行号" prop="lineNo" width="70" align="center" />
        <el-table-column label="物料编码" prop="materialCode" width="145" />
        <el-table-column label="物料名称" prop="materialName" min-width="180" />
        <el-table-column label="发货仓库" prop="warehouseName" min-width="140" />
        <el-table-column label="数量" width="110" align="right">
          <template #default="{ row }">{{ formatDecimal.default(row.quantity, 4) }}</template>
        </el-table-column>
        <el-table-column label="单价" width="120" align="right">
          <template #default="{ row }">¥ {{ formatDecimal.default(row.unitPrice, 2) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="130" align="right">
          <template #default="{ row }">¥ {{ formatDecimal.thousand(row.amount, 2) }}</template>
        </el-table-column>
      </el-table>
      <div class="document-total">
        <span>订单合计</span>
        <strong>¥ {{ formatDecimal.thousand(detail.totalAmount, 2) }}</strong>
      </div>
    </section>
  </BusinessDocumentDialog>
</template>

<style scoped>
.amount {
  color: var(--el-color-danger);
  font-size: 18px;
  font-weight: 650;
}
.document-section-title small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}
</style>
