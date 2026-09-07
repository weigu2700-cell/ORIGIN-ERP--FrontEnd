<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'
import { getDetailPurchaseDemand } from '@/api/purchase/purchaseDemand'
import type { PurchaseDemandVo } from '@/types/purchase/purchaseDemand'
import { formatDate, formatDecimal } from '@/composables/useFormat'

const props = defineProps<{ visible: boolean; demandId?: string }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const detail = ref<PurchaseDemandVo | null>(null)

const statusMap: Record<string, string> = { DRAFT: '草稿', APPROVED: '已审批', CLOSED: '已关闭' }
const sourceMap: Record<string, string> = { PRODUCTION_ORDER: '生产订单', OTHER: '其他' }
const fields = computed(() => detail.value ? [
  { label: '需求单号', value: detail.value.purchaseDemandNo },
  { label: '状态', value: statusMap[detail.value.status] ?? detail.value.status },
  { label: '物料 ID', value: detail.value.materialId },
  { label: '采购数量', value: formatDecimal.default(detail.value.purchaseQuantity, 0) },
  { label: '来源类型', value: sourceMap[detail.value.sourceType] ?? detail.value.sourceType },
  { label: '来源单号', value: detail.value.sourceNo },
  { label: '创建时间', value: formatDate.DateTime(detail.value.createTime) },
  { label: '更新时间', value: formatDate.DateTime(detail.value.updateTime) },
] : [])

watch(() => [props.visible, props.demandId] as const, async ([visible, id]) => {
  if (!visible || !id) {
    detail.value = null
    return
  }
  try {
    detail.value = await getDetailPurchaseDemand(id)
  } catch {
    ElMessage.error('获取采购需求详情失败')
  }
}, { immediate: true })
</script>

<template>
  <EntityDetailDialog :visible="visible" title="采购需求详情" :row="detail" :fields="fields"
    @cancel="emit('cancel')" />
</template>
