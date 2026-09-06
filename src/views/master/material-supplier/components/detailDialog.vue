<script setup lang="ts">
import EntityDetailDialog, { type DetailField } from '@/components/EntityDetailDialog.vue'
import type { MaterialSupplierVO } from '@/types/master/materialSupplier'
import { computed } from 'vue'
import { formatDecimal } from '@/composables/useFormat'
const props = defineProps<{ visible: boolean; row?: MaterialSupplierVO | null }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const fields = computed<DetailField[]>(() => props.row ? [
  { label: '关联编码', value: props.row.materialSupplierCode }, { label: '物料名称', value: props.row.materialName },
  { label: '供应商', value: props.row.supplierName }, { label: '采购价', value: formatDecimal.default(props.row.purchasePrice, 2) },
  { label: '交期（天）', value: props.row.leadTimeDays }, { label: '最小采购量', value: props.row.minOrderQty },
  { label: '优选', value: props.row.preferred === 1 ? '优选' : '普通' }, { label: '状态', value: props.row.status === 1 ? '有效' : '无效' },
  { label: '备注', value: props.row.remark, span: 2 },
] : [])
</script>
<template>
  <EntityDetailDialog :visible="props.visible" title="物料供应关系详情" :row="props.row" :fields="fields"
    @cancel="emit('cancel')" />
</template>