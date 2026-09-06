<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ProductionDemandVo } from '@/types/product/productionDemand';
import { getDetailProductionDemand } from '@/api/product/productionDemand';
import { ElMessage } from 'element-plus';
import { formatDecimal } from '@/composables/useFormat';

const props = defineProps<{
  visible: boolean
  demandId?: string | null
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
}>()

const loading = ref(false)
const detail = ref<ProductionDemandVo | null>(null)

const sourceTypeMap: Record<string, string> = {
  SALES_ORDER: '销售订单',
  FORECAST: '预测',
  MANUAL: '手工创建'
}

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  PENDING: { label: '待处理', type: 'info' },
  IN_PROGRESS: { label: '处理中', type: 'warning' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' }
}

const loadDetail = async (id: string) => {
  try {
    loading.value = true
    detail.value = await getDetailProductionDemand(id)
  } catch {
    ElMessage.error('获取生产需求详情失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val && props.demandId) {
    loadDetail(props.demandId)
  } else {
    detail.value = null
  }
})

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <el-dialog :model-value="props.visible" title="生产需求详情" width="700px" @close="handleCancel" v-loading="loading">
    <template v-if="detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="需求单号">{{ detail.demandNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[detail.status]?.type ?? 'info'">
            {{ statusMap[detail.status]?.label ?? '未知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="物料编码">{{ detail.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ detail.materialName }}</el-descriptions-item>
        <el-descriptions-item label="数量">
          {{ formatDecimal.default(detail.quantity, 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="来源类型">
          {{ sourceTypeMap[detail.sourceType] ?? detail.sourceType }}
        </el-descriptions-item>
        <el-descriptions-item label="来源单号" :span="2">{{ detail.sourceNo || '-' }}</el-descriptions-item>
      </el-descriptions>
    </template>

    <template #footer>
      <el-button @click="handleCancel">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped></style>