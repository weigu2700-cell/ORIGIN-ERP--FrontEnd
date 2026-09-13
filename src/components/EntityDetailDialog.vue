<script setup lang="ts">
import { computed } from 'vue'

export interface DetailField {
  label: string
  value: unknown
  span?: number
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    row?: object | null
    fields?: DetailField[]
  }>(),
  {
    row: null,
    fields: () => [],
  },
)

const emit = defineEmits<{ (e: 'cancel'): void }>()
const displayFields = computed(() => props.fields.filter((field) => field.value !== undefined))
const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const handleClose = () => emit('cancel')
</script>

<template>
  <el-dialog :model-value="props.visible" :title="props.title" width="680px" align-center @close="handleClose">
    <el-descriptions v-if="props.row" :column="2" border>
      <el-descriptions-item
        v-for="field in displayFields"
        :key="field.label"
        :label="field.label"
        :span="field.span ?? 1"
      >
        {{ formatValue(field.value) }}
      </el-descriptions-item>
    </el-descriptions>
    <el-empty v-else description="暂无详情" />
    <template #footer><el-button @click="handleClose">关闭</el-button></template>
  </el-dialog>
</template>
