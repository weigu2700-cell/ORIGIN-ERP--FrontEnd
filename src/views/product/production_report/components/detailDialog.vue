<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import BusinessDocumentDialog from '@/components/BusinessDocumentDialog.vue'
import { ProductionReportStatus } from '@/constants/enumCode'
import { getDetailProductionReport } from '@/api/product/productionReport'
import type { ProductionReport } from '@/types/product/productionReport'
import { formatDate, formatDecimal } from '@/composables/useFormat'

const props = defineProps<{ visible: boolean; reportId?: string }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const detail = ref<ProductionReport>()
const loading = ref(false)
watch(
  () => [props.visible, props.reportId] as const,
  async ([visible, id]) => {
    if (!visible || !id) {
      detail.value = undefined
      return
    }
    try {
      loading.value = true
      detail.value = await getDetailProductionReport(id)
    } catch {
      ElMessage.error('获取生产报工详情失败')
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
    title="生产报工单"
    :document-no="detail?.productionReportNo"
    :status-label="ProductionReportStatus.labelOf(detail?.status)"
    :loading="loading"
    @cancel="emit('cancel')"
  >
    <template v-if="detail" #summary>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">生产订单</span>
          <span class="summary-value">{{ detail.productionOrderNo || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">报工人</span>
          <span class="summary-value">{{ detail.reportUserName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">物料</span>
          <span class="summary-value">{{ detail.materialName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">报工时间</span>
          <span class="summary-value">{{ formatDate.DateTime(detail.reportTime) }}</span>
        </div>
      </div>
    </template>
    <el-descriptions v-if="detail" :column="3" border>
      <el-descriptions-item label="报工数量">
        {{ formatDecimal.default(detail.reportQuantity, 4) }}
      </el-descriptions-item>
      <el-descriptions-item label="合格数量">
        {{ formatDecimal.default(detail.qualifiedQuantity, 4) }}
      </el-descriptions-item>
      <el-descriptions-item label="报废数量">
        {{ formatDecimal.default(detail.scrappedQuantity, 4) }}
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="3">{{ detail.remark || '-' }}</el-descriptions-item>
    </el-descriptions>
  </BusinessDocumentDialog>
</template>
