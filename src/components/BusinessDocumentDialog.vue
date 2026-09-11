<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    documentNo?: string | null
    statusLabel?: string
    statusType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
    loading?: boolean
    width?: string
  }>(),
  {
    documentNo: '',
    statusLabel: '',
    statusType: 'info',
    loading: false,
    width: '960px',
  },
)

const emit = defineEmits<{ (e: 'cancel'): void }>()
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    :width="props.width"
    class="business-document-dialog"
    align-center
    destroy-on-close
    @close="emit('cancel')"
  >
    <template #header>
      <div class="document-heading">
        <div>
          <span class="document-kicker">{{ props.title }}</span>
          <h2>{{ props.documentNo || '单据详情' }}</h2>
        </div>
        <el-tag v-if="props.statusLabel" :type="props.statusType" effect="light" round>
          {{ props.statusLabel }}
        </el-tag>
      </div>
    </template>

    <div v-loading="props.loading" class="document-content">
      <template v-if="$slots.default">
        <section v-if="$slots.summary" class="document-summary">
          <slot name="summary" />
        </section>
        <slot />
      </template>
      <el-empty v-else description="暂无详情" />
    </div>

    <template #footer>
      <slot name="footer">
        <el-button @click="emit('cancel')">关闭</el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<style scoped>
.document-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-right: 30px;
}

.document-kicker {
  display: block;
  margin-bottom: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  letter-spacing: 0.08em;
}

h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 22px;
  font-weight: 650;
  line-height: 1.35;
}

.document-content {
  min-height: 180px;
}

.document-summary {
  margin-bottom: 18px;
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

:deep(.summary-grid) {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 24px;
}

:deep(.summary-item) {
  min-width: 0;
}

:deep(.summary-item--wide) {
  grid-column: span 2;
}

:deep(.summary-label) {
  display: block;
  margin-bottom: 5px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

:deep(.summary-value) {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

:deep(.document-section) {
  margin-top: 20px;
}

:deep(.document-section-title) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 10px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

:deep(.document-total) {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 10px;
  margin-top: 14px;
  color: var(--el-text-color-secondary);
}

:deep(.document-total strong) {
  color: var(--el-color-danger);
  font-size: 22px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 760px) {
  :deep(.summary-grid) {
    grid-template-columns: 1fr;
  }

  :deep(.summary-item--wide) {
    grid-column: auto;
  }
}
</style>
