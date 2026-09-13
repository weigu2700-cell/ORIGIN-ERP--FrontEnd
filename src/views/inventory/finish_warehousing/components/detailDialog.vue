<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import BusinessDocumentDialog from '@/components/BusinessDocumentDialog.vue'
import { FinishWarehousingStatus } from '@/constants/enumCode'
import { getDetailFinishWarehousing } from '@/api/inventory/finishWarehousing'
import type { FinishWarehousing } from '@/types/inventory/finishWarehousing'
import { formatDate, formatDecimal } from '@/composables/useFormat'

const props = defineProps<{ visible: boolean; warehousingId?: string }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const detail = ref<FinishWarehousing>()
const loading = ref(false)
watch(
  () => [props.visible, props.warehousingId] as const,
  async ([visible, id]) => {
    if (!visible || !id) {
      detail.value = undefined
      return
    }
    try {
      loading.value = true
      detail.value = await getDetailFinishWarehousing(id)
    } catch {
      ElMessage.error('获取成品入库详情失败')
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
    title="成品入库单"
    :document-no="detail?.warehousingNo"
    :status-label="FinishWarehousingStatus.labelOf(detail?.status)"
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
          <span class="summary-label">生产报工单</span>
          <span class="summary-value">{{ detail.productionReportNo || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">物料</span>
          <span class="summary-value">{{ detail.materialName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">入库仓库</span>
          <span class="summary-value">{{ detail.warehouseName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">入库人</span>
          <span class="summary-value">{{ detail.warehousingUserName || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">入库时间</span>
          <span class="summary-value">{{ formatDate.DateTime(detail.warehousingTime) }}</span>
        </div>
      </div>
    </template>
    <el-descriptions v-if="detail" :column="2" border>
      <el-descriptions-item label="入库数量">
        {{ formatDecimal.default(detail.warehousingQuantity, 4) }}
      </el-descriptions-item>
      <el-descriptions-item label="物料编码">{{ detail.materialCode || '-' }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
    </el-descriptions>
  </BusinessDocumentDialog>
</template>
