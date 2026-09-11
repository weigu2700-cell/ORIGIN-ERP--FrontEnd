<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import EntityDetailDialog from '@/components/EntityDetailDialog.vue'
import { getDetailPurchaseOrder } from '@/api/purchase/purchaseOrder'
import type { PurchaseOrderVo } from '@/types/purchase/purchaseOrder'
import { formatDate, formatDecimal } from '@/composables/useFormat'

const props = defineProps<{ visible: boolean; orderId?: string }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const detail = ref<PurchaseOrderVo | null>(null)
const statusMap: Record<string, string> = { DRAFT: '草稿', APPROVED: '已审批', SHIPPED: '已发货', RECEIVED: '已收货', CLOSED: '已关闭' }
const fields = computed(() => detail.value ? [
  { label: '采购订单号', value: detail.value.purchaseOrderNo }, { label: '状态', value: statusMap[detail.value.status] ?? detail.value.status },
  { label: '采购需求单号', value: detail.value.purchaseDemandNo }, { label: '供应商', value: detail.value.supplierName },
  { label: '物料编码', value: detail.value.materialCode }, { label: '物料名称', value: detail.value.materialName },
  { label: '计划数量', value: formatDecimal.default(detail.value.plannedQuantity, 4) }, { label: '到货数量', value: formatDecimal.default(detail.value.completeQuantity, 4) },
  { label: '采购单价', value: formatDecimal.default(detail.value.unitPrice, 4) }, { label: '订单金额', value: formatDecimal.thousand(detail.value.totalAmount, 2) },
  { label: '订单日期', value: formatDate.DateTime(detail.value.orderDate) }, { label: '预计交货', value: formatDate.DateTime(detail.value.expectedDeliveryDate) },
  { label: '实际交货', value: formatDate.DateTime(detail.value.actualDeliveryDate), span: 2 },
] : [])

watch(() => [props.visible, props.orderId] as const, async ([visible, id]) => {
  if (!visible || !id) { detail.value = null; return }
  try { detail.value = await getDetailPurchaseOrder(id) }
  catch { ElMessage.error('获取采购订单详情失败') }
}, { immediate: true })
</script>

<template><EntityDetailDialog :visible="visible" title="采购订单详情" :row="detail" :fields="fields" @cancel="emit('cancel')" /></template>
