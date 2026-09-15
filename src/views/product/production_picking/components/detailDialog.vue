<script setup lang="ts">
import { computed } from 'vue'
import BusinessDocumentDialog from '@/components/BusinessDocumentDialog.vue'
import type { ProductionPicking } from '@/types/product/productionPicking'
import { formatDate, formatDecimal } from '@/composables/useFormat'
import { ProductionPickingStatus } from '@/constants/enumCode'

const props = defineProps<{ visible: boolean; row?: ProductionPicking | null }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()

const statusMeta = computed(
  () =>
    ({
      label: ProductionPickingStatus.labelOf(props.row?.status),
      type:
        props.row?.status === ProductionPickingStatus.PICKED
          ? 'success'
          : props.row?.status === ProductionPickingStatus.APPROVED
            ? 'warning'
            : props.row?.status === ProductionPickingStatus.CANCELLED
              ? 'danger'
              : 'info',
    }) as const,
)
</script>

<template>
  <BusinessDocumentDialog
    :visible="visible"
    title="生产领料单"
    :document-no="row?.pickingNo"
    :status-label="statusMeta.label"
    :status-type="statusMeta.type"
    @cancel="emit('cancel')"
  >
    <template v-if="row" #summary>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">生产订单</span>
          <span class="summary-value">{{ row.productionOrderNo || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">采购需求</span>
          <span class="summary-value">{{ row.purchaseDemandNo || '库存领料' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">领料时间</span>
          <span class="summary-value">{{ row.pickingTime ? formatDate.DateTime(row.pickingTime) : '尚未领料' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">仓库</span>
          <span class="summary-value">{{ row.warehouseName || '待指定' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">创建时间</span>
          <span class="summary-value">{{ row.createTime ? formatDate.DateTime(row.createTime) : '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">更新时间</span>
          <span class="summary-value">{{ row.updateTime ? formatDate.DateTime(row.updateTime) : '-' }}</span>
        </div>
      </div>
    </template>
    <section v-if="row" class="document-section">
      <h3 class="document-section-title">领料明细</h3>
      <el-table :data="[row]" border>
        <el-table-column label="物料编码" prop="materialCode" width="220" />
        <el-table-column label="物料名称" prop="materialName" min-width="180" />
        <el-table-column label="领料仓库" min-width="150">
          <template #default>{{ row.warehouseName || '待指定' }}</template>
        </el-table-column>
        <el-table-column label="计划数量" align="right" width="120">
          <template #default>{{ formatDecimal.default(row.plannedQuantity, 4) }}</template>
        </el-table-column>
        <el-table-column label="实际数量" align="right" width="120">
          <template #default>{{ formatDecimal.default(row.actualQuantity, 4) }}</template>
        </el-table-column>
      </el-table>
    </section>
  </BusinessDocumentDialog>
</template>
