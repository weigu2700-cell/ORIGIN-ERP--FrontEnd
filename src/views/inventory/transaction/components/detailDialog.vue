<script setup lang="ts">
import EntityDetailDialog, { type DetailField } from '@/components/EntityDetailDialog.vue'
import type { TransactionVO } from '@/types/inventory/transaction'
import { computed } from 'vue'
import { formatDecimal } from '@/composables/useFormat'
const props = defineProps<{ visible: boolean; row?: TransactionVO | null }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const fields = computed<DetailField[]>(() => props.row ? [
  { label: '仓库', value: props.row.warehouseName }, { label: '物料编码', value: props.row.materialCode },
  { label: '物料名称', value: props.row.materialName }, { label: '流水类型', value: props.row.transactionTypeName },
  { label: '业务类型', value: props.row.businessType }, { label: '业务单号', value: props.row.businessNo },
  { label: '数量', value: formatDecimal.default(props.row.quantity, 0) }, { label: '变动后库存', value: formatDecimal.default(props.row.afterOnHand, 0) },
  { label: '变动后预留', value: formatDecimal.default(props.row.afterReserved, 0) }, { label: '时间', value: props.row.createTime },
] : [])
</script>
<template>
  <EntityDetailDialog :visible="props.visible" title="库存流水详情" :row="props.row" :fields="fields"
    @cancel="emit('cancel')" />
</template>