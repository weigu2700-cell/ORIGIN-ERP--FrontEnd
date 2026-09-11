<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import BusinessDocumentDialog from '@/components/BusinessDocumentDialog.vue'
import { getDetailPurchaseOrder } from '@/api/purchase/purchaseOrder'
import type { PurchaseOrderVo } from '@/types/purchase/purchaseOrder'
import { formatDate, formatDecimal } from '@/composables/useFormat'

defineOptions({ name: 'PurchaseOrderDetail' })

const props = defineProps<{ visible: boolean; orderId?: string }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const detail = ref<PurchaseOrderVo | null>(null)
const loading = ref(false)
const statusMap = {
  DRAFT: { label: '草稿', type: 'info' },
  APPROVED: { label: '已审批', type: 'primary' },
  SHIPPED: { label: '已发货', type: 'warning' },
  RECEIVED: { label: '已收货', type: 'success' },
  CLOSED: { label: '已关闭', type: 'danger' },
} as const
const statusMeta = computed(() =>
  detail.value
    ? (statusMap[detail.value.status as keyof typeof statusMap] ?? {
        label: detail.value.status,
        type: 'info' as const,
      })
    : { label: '', type: 'info' as const },
)
const arrivalRate = computed(() => {
  if (!detail.value?.plannedQuantity) return '-'
  return `${Math.min(100, (Number(detail.value.completeQuantity ?? 0) / Number(detail.value.plannedQuantity)) * 100).toFixed(1)}%`
})

watch(
  () => [props.visible, props.orderId] as const,
  async ([visible, id]) => {
    if (!visible || !id) {
      detail.value = null
      return
    }
    try {
      loading.value = true
      detail.value = await getDetailPurchaseOrder(id)
    } catch {
      ElMessage.error('获取采购订单详情失败')
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <BusinessDocumentDialog
    :visible="visible"
    title="采购订单"
    :document-no="detail?.purchaseOrderNo"
    :status-label="statusMeta.label"
    :status-type="statusMeta.type"
    :loading="loading"
    @cancel="emit('cancel')"
  >
    <template v-if="detail" #summary>
      <div class="summary-grid">
        <div class="summary-item summary-item--wide">
          <span class="summary-label">供应商</span>
          <span class="summary-value">
            {{ detail.supplierName || '待补全' }}
            <small v-if="detail.supplierCode">（{{ detail.supplierCode }}）</small>
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">订单金额</span>
          <span class="summary-value amount">¥ {{ formatDecimal.thousand(detail.totalAmount, 2) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">来源采购需求</span>
          <span class="summary-value">{{ detail.purchaseDemandNo || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">下单日期</span>
          <span class="summary-value">{{ detail.orderDate ? formatDate.DateTime(detail.orderDate) : '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">预计交货</span>
          <span class="summary-value">
            {{ detail.expectedDeliveryDate ? formatDate.DateTime(detail.expectedDeliveryDate) : '待补全' }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">实际交货</span>
          <span class="summary-value">
            {{ detail.actualDeliveryDate ? formatDate.DateTime(detail.actualDeliveryDate) : '尚未交货' }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">到货进度</span>
          <span class="summary-value">{{ arrivalRate }}</span>
        </div>
      </div>
    </template>
    <section v-if="detail" class="document-section">
      <h3 class="document-section-title">采购明细</h3>
      <el-table :data="[detail]" border>
        <el-table-column label="物料编码" prop="materialCode" width="155" />
        <el-table-column label="物料名称" prop="materialName" min-width="200" />
        <el-table-column label="计划数量" width="115" align="right">
          <template #default>{{ formatDecimal.default(detail.plannedQuantity, 4) }}</template>
        </el-table-column>
        <el-table-column label="到货数量" width="115" align="right">
          <template #default>{{ formatDecimal.default(detail.completeQuantity, 4) }}</template>
        </el-table-column>
        <el-table-column label="采购单价" width="120" align="right">
          <template #default>¥ {{ formatDecimal.default(detail.unitPrice, 2) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="135" align="right">
          <template #default>¥ {{ formatDecimal.thousand(detail.totalAmount, 2) }}</template>
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
.summary-value small {
  color: var(--el-text-color-secondary);
}
</style>
