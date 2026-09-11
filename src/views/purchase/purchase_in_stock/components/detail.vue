<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import BusinessDocumentDialog from '@/components/BusinessDocumentDialog.vue'
import { getDetailPurchaseInStock } from '@/api/purchase/purchaseInStock'
import type { PurchaseInStock } from '@/types/purchase/purchaseInStock'
import { formatDate, formatDecimal } from '@/composables/useFormat'

defineOptions({ name: 'PurchaseInStockDetail' })

const props = defineProps<{ visible: boolean; recordId?: string }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const detail = ref<PurchaseInStock | null>(null)
const loading = ref(false)
const statusMap = {
  DRAFT: { label: '草稿', type: 'info' },
  APPROVED: { label: '已审核', type: 'warning' },
  UPLOADED: { label: '已上架', type: 'success' },
} as const
const statusMeta = computed(() =>
  detail.value
    ? (statusMap[detail.value.status] ?? { label: detail.value.status, type: 'info' as const })
    : { label: '', type: 'info' as const },
)
const inTypeMap: Record<string, string> = {
  PURCHASE_NORMAL: '采购入库',
  PURCHASE_RETURN: '采购退货',
  PURCHASE_GIFT: '赠品入库',
}

watch(
  () => [props.visible, props.recordId] as const,
  async ([visible, id]) => {
    if (!visible || !id) {
      detail.value = null
      return
    }
    try {
      loading.value = true
      detail.value = await getDetailPurchaseInStock(id)
    } catch {
      ElMessage.error('获取采购入库单详情失败')
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
    title="采购入库单"
    :document-no="detail?.purchaseInStockNo"
    :status-label="statusMeta.label"
    :status-type="statusMeta.type"
    :loading="loading"
    @cancel="emit('cancel')"
  >
    <template v-if="detail" #summary>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">来源采购订单</span>
          <span class="summary-value">{{ detail.purchaseOrderNo }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">供应商</span>
          <span class="summary-value">{{ detail.supplierName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">入库类型</span>
          <span class="summary-value">{{ inTypeMap[detail.inType] ?? detail.inType }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">仓库 / 库位</span>
          <span class="summary-value">
            {{ detail.warehouseName || '待指定' }} / {{ detail.storageLocation || '待指定' }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">批次号</span>
          <span class="summary-value">{{ detail.batchNo || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">实际入库时间</span>
          <span class="summary-value">{{ detail.inDate ? formatDate.DateTime(detail.inDate) : '尚未上架' }}</span>
        </div>
        <div class="summary-item summary-item--wide">
          <span class="summary-label">备注</span>
          <span class="summary-value">{{ detail.remark || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">操作员</span>
          <span class="summary-value">{{ detail.operator || '-' }}</span>
        </div>
      </div>
    </template>
    <section v-if="detail" class="document-section">
      <h3 class="document-section-title">入库明细</h3>
      <el-table :data="[detail]" border>
        <el-table-column label="物料编码" prop="materialCode" width="150" />
        <el-table-column label="物料名称" prop="materialName" min-width="190" />
        <el-table-column label="入库数量" width="115" align="right">
          <template #default>{{ formatDecimal.default(detail.inQuantity, 4) }}</template>
        </el-table-column>
        <el-table-column label="单价" width="115" align="right">
          <template #default>¥ {{ formatDecimal.default(detail.unitPrice, 2) }}</template>
        </el-table-column>
        <el-table-column label="总金额" width="130" align="right">
          <template #default>¥ {{ formatDecimal.thousand(detail.totalAmount, 2) }}</template>
        </el-table-column>
        <el-table-column label="生产日期" width="170">
          <template #default>{{ detail.productionDate ? formatDate.DateTime(detail.productionDate) : '-' }}</template>
        </el-table-column>
        <el-table-column label="有效期至" width="170">
          <template #default>{{ detail.expiryDate ? formatDate.DateTime(detail.expiryDate) : '-' }}</template>
        </el-table-column>
      </el-table>
      <div class="document-total">
        <span>入库金额</span>
        <strong>¥ {{ formatDecimal.thousand(detail.totalAmount, 2) }}</strong>
      </div>
    </section>
  </BusinessDocumentDialog>
</template>
