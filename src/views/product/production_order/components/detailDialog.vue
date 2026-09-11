<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import BusinessDocumentDialog from '@/components/BusinessDocumentDialog.vue'
import type { ProductionOrderVo } from '@/types/product/productionOrder'
import { getDetailProductionOrder } from '@/api/product/productionOrder'
import { formatDate, formatDecimal } from '@/composables/useFormat'

const props = defineProps<{ visible: boolean; orderId?: string | null }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const loading = ref(false)
const detail = ref<ProductionOrderVo | null>(null)

const statusMap = {
  0: { label: '草稿', type: 'info' },
  1: { label: '已下达', type: 'primary' },
  2: { label: '生产中', type: 'warning' },
  3: { label: '已完成', type: 'success' },
  4: { label: '已取消', type: 'danger' },
} as const
const statusMeta = computed(
  () =>
    statusMap[detail.value?.status as keyof typeof statusMap] ?? {
      label: '未知',
      type: 'info' as const,
    },
)
const progress = computed(
  () => (({ 0: 0, 1: 1, 2: 2, 3: 4, 4: 0 }) as const)[detail.value?.status as 0 | 1 | 2 | 3 | 4] ?? 0,
)

const loadDetail = async (id: string) => {
  try {
    loading.value = true
    detail.value = await getDetailProductionOrder(id)
  } catch {
    ElMessage.error('获取生产订单详情失败')
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
    title="生产订单"
    :document-no="detail?.productionOrderNo"
    :status-label="statusMeta.label"
    :status-type="statusMeta.type"
    :loading="loading"
    @cancel="emit('cancel')"
  >
    <template v-if="detail" #summary>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">来源需求</span>
          <span class="summary-value">{{ detail.productionDemandNo || '手工创建' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">计划开始</span>
          <span class="summary-value">
            {{ detail.plannedStartTime ? formatDate.DateTime(detail.plannedStartTime) : '-' }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">计划结束</span>
          <span class="summary-value">
            {{ detail.plannedEndTime ? formatDate.DateTime(detail.plannedEndTime) : '-' }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">实际开始</span>
          <span class="summary-value">
            {{ detail.actualStartTime ? formatDate.DateTime(detail.actualStartTime) : '尚未开始' }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">实际结束</span>
          <span class="summary-value">
            {{ detail.actualEndTime ? formatDate.DateTime(detail.actualEndTime) : '尚未完成' }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">备注</span>
          <span class="summary-value">{{ detail.remark || '-' }}</span>
        </div>
      </div>
    </template>

    <template v-if="detail">
      <section class="document-section production-progress">
        <h3 class="document-section-title">执行进度</h3>
        <el-steps :active="progress" finish-status="success" align-center>
          <el-step title="订单创建" />
          <el-step title="已下达" />
          <el-step title="生产中" />
          <el-step title="完工" />
        </el-steps>
      </section>
      <section class="document-section">
        <h3 class="document-section-title">生产明细</h3>
        <el-table :data="[detail]" border>
          <el-table-column label="物料编码" prop="materialCode" width="160" />
          <el-table-column label="物料名称" prop="materialName" min-width="220" />
          <el-table-column label="计划数量" align="right" width="140">
            <template #default>{{ formatDecimal.default(detail.plannedQuantity, 4) }}</template>
          </el-table-column>
          <el-table-column label="完工数量" align="right" width="140">
            <template #default>{{ formatDecimal.default(detail.completedQuantity, 4) }}</template>
          </el-table-column>
          <el-table-column label="完成率" align="right" width="120">
            <template #default>
              {{
                detail.plannedQuantity
                  ? `${Math.min(100, (Number(detail.completedQuantity ?? 0) / Number(detail.plannedQuantity)) * 100).toFixed(1)}%`
                  : '-'
              }}
            </template>
          </el-table-column>
        </el-table>
      </section>
    </template>
  </BusinessDocumentDialog>
</template>

<style scoped>
.production-progress {
  padding: 8px 8px 18px;
}
</style>
