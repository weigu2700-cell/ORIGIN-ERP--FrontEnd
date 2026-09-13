<script setup lang="ts">
import EntityDetailDialog, { type DetailField } from '@/components/EntityDetailDialog.vue'
import type { SupplierVO } from '@/types/master/supplier'
import { computed } from 'vue'
import { SupplierStatus } from '@/constants/enumCode'

const props = defineProps<{
  visible: boolean
  row?: SupplierVO | null
}>()
const emit = defineEmits<{ (e: 'cancel'): void }>()
const fields = computed<DetailField[]>(() =>
  props.row
    ? [
        { label: '供应商名称', value: props.row.name },
        { label: '供应商编码', value: props.row.code },
        { label: '简称', value: props.row.shortName },
        { label: '联系人', value: props.row.contactName },
        { label: '联系电话', value: props.row.phone },
        { label: '邮箱', value: props.row.email },
        { label: '状态', value: SupplierStatus.labelOf(props.row.status) },
        { label: '地址', value: props.row.address, span: 2 },
        { label: '备注', value: props.row.remark, span: 2 },
      ]
    : [],
)
</script>
<template>
  <EntityDetailDialog
    :visible="props.visible"
    title="供应商详情"
    :row="props.row"
    :fields="fields"
    @cancel="emit('cancel')"
  />
</template>
