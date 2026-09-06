<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ProductionOrderVo } from '@/types/product/productionOrder';
import { getDetailProductionOrder } from '@/api/product/productionOrder';
import { ElMessage } from 'element-plus';
import { formatDate, formatDecimal } from '@/composables/useFormat';

const props = defineProps<{
  visible: boolean
  orderId?: string | null
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
}>()

const loading = ref(false)
const detail = ref<ProductionOrderVo | null>(null)

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  PENDING: { label: '待下达', type: 'info' },
  RELEASED: { label: '已下达', type: 'success' },
  IN_PROGRESS: { label: '生产中', type: 'warning' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' }
}

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
  <el-dialog :model-value="props.visible" title="生产订单详情" width="800px" @close="handleCancel" v-loading="loading">
    <template v-if="detail">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="生产订单号">{{ detail.productionOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="需求单号">{{ detail.productionDemandNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[detail.status]?.type ?? 'info'">
            {{ statusMap[detail.status]?.label ?? '未知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="物料编码">{{ detail.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ detail.materialName }}</el-descriptions-item>
        <el-descriptions-item label="计划数量">
          {{ formatDecimal.default(detail.plannedQuantity, 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="实际数量">
          {{ detail.actualQuantity ? formatDecimal.default(detail.actualQuantity, 0) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="计划开始时间">
          {{ formatDate.DateTime(detail.plannedStartTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="计划结束时间">
          {{ formatDate.DateTime(detail.plannedEndTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="实际开始时间">
          {{ detail.actualStartTime ? formatDate.DateTime(detail.actualStartTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="实际结束时间">
          {{ detail.actualEndTime ? formatDate.DateTime(detail.actualEndTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </template>

    <template #footer>
      <el-button @click="handleCancel">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped></style>