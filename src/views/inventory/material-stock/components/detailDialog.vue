<script setup lang="ts">
import EntityDetailDialog, { type DetailField } from '@/components/EntityDetailDialog.vue'
import type { MaterialStockVO } from '@/types/inventory/materialStock'
import { computed } from 'vue'
import { formatDecimal } from '@/composables/useFormat'
const props = defineProps<{ visible: boolean; row?: MaterialStockVO | null }>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const fields = computed<DetailField[]>(() => props.row ? [
  { label: '物料编码', value: props.row.materialCode }, { label: '物料名称', value: props.row.materialName },
  { label: '仓库', value: props.row.warehouseName }, { label: '在库量', value: formatDecimal.default(props.row.onHand, 0) },
  { label: '预留量', value: formatDecimal.default(props.row.reserved, 0) }, { label: '可用量', value: formatDecimal.default(props.row.available, 0) },
] : [])
</script>
<template>
  <EntityDetailDialog :visible="props.visible" title="库存详情" :row="props.row" :fields="fields"
    @cancel="emit('cancel')" />
</template>