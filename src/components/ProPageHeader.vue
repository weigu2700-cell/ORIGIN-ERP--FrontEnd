<script setup lang="ts">
export interface ProPageHeaderCard {
  label: string
  value: string | number
  count: number | string
  hint?: string
  tone?: 'primary' | 'info' | 'warning' | 'success' | 'danger'
}

const props = withDefaults(defineProps<{
  title: string
  description?: string
  summary?: string
  cards?: ProPageHeaderCard[]
  modelValue?: string | number
}>(), {
  description: '',
  summary: '',
  cards: () => [],
  modelValue: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

const selectCard = (value: string | number) => {
  const nextValue = props.modelValue === value ? '' : value
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}
</script>

<template>
  <header class="page-header">
    <div class="heading">
      <div class="heading-content">
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
      <span v-if="summary" class="result-count">{{ summary }}</span>
      <div v-if="$slots.actions" class="header-actions">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="cards.length" class="status-cards" role="group" :aria-label="`${title}快捷筛选`">
      <button v-for="item in cards" :key="item.value" type="button" class="status-card"
        :class="[`is-${item.tone ?? 'primary'}`, { 'is-active': modelValue === item.value }]"
        :aria-pressed="modelValue === item.value"
        :aria-label="`${item.label}，${item.count} ${item.hint ?? ''}，${modelValue === item.value ? '点击取消筛选' : '点击筛选'}`"
        @click="selectCard(item.value)">
        <span class="card-label"><i aria-hidden="true" />{{ item.label }}</span>
        <span class="card-value">
          {{ typeof item.count === 'number' ? item.count.toLocaleString() : item.count }}
          <span v-if="item.hint">{{ item.hint }}</span>
        </span>
      </button>
    </div>
    <div v-if="$slots.search || $slots.toolbar" class="control-row">
      <div v-if="$slots.search" class="search-section">
        <slot name="search" />
      </div>
      <div v-if="$slots.toolbar" class="toolbar-section">
        <slot name="toolbar" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  --page-header-background: #e2e8f0;
  --page-header-card-background: rgb(255 255 255 / 42%);
  --page-header-control-background: rgb(255 255 255 / 55%);
  --page-header-border: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--page-header-border);
  border-radius: 7px;
  background: var(--page-header-background);
  box-shadow: 0 1px 2px rgb(15 23 42 / 5%);
}

.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.result-count {
  padding: 4px 8px;
  border-radius: 4px;
  background: rgb(255 255 255 / 38%);
  color: var(--text-secondary);
  font-size: 13px;
}

.result-count strong {
  color: var(--el-text-color-primary, #303133);
  font-variant-numeric: tabular-nums;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}

.status-card {
  --status-color: var(--el-color-warning, #e6a23c);
  --status-background: color-mix(in srgb, var(--status-color) 9%, var(--page-header-card-background));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 54px;
  padding: 9px 12px;
  border: 1px solid rgb(148 163 184 / 38%);
  border-radius: 6px;
  background: var(--page-header-card-background);
  color: var(--el-text-color-primary, #303133);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color .15s ease, background-color .15s ease;
}

.is-success {
  --status-color: var(--el-color-success, #67c23a);
}

.is-danger {
  --status-color: var(--el-color-danger, #f56c6c);
}

.status-card:hover,
.status-card.is-active {
  border-color: var(--status-color);
  background: var(--status-background);
}

.status-card:focus-visible {
  outline: 2px solid var(--status-color);
  outline-offset: 2px;
}

.card-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.card-label i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--status-color);
}

.card-value {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.card-value span {
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  font-weight: 400;
}

@media (max-width: 600px) {
  .page-header {
    padding: 14px;
  }

  .status-cards {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .status-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
  }
}

.heading-content {
  flex: 1;
  min-width: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.search-section,
.toolbar-section {
  min-width: 0;
}

.control-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--page-header-border);
}

.search-section {
  flex: 0 1 auto;
}

.toolbar-section {
  flex: 0 0 auto;
  padding-left: 12px;
  border-left: 1px solid #94a3b8;
}

.search-section :deep(.pro-search),
.toolbar-section :deep(.pro-toolbar-container) {
  padding: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  height: auto;
  flex-wrap: wrap;
}

.toolbar-section :deep(.pro-toolbar-container) {
  width: auto;
  min-height: 0;
}

.search-section :deep(.pro-search) {
  width: auto;
}

.search-section :deep(.el-input__wrapper),
.search-section :deep(.el-select__wrapper) {
  background: var(--page-header-control-background);
}

.search-section :deep(.el-button),
.toolbar-section :deep(.pro-toolbar-btn) {
  height: 32px;
  border: 1px solid #b8c3cf;
  border-radius: 6px;
  background: transparent;
  color: #344054;
  box-shadow: none;
}

.search-section :deep(.el-button:hover),
.toolbar-section :deep(.pro-toolbar-btn:hover) {
  border-color: #8493a3;
  background: rgb(255 255 255 / 45%);
  color: #1f2937;
}

.search-section :deep(.el-button--primary),
.toolbar-section :deep(.pro-toolbar-btn--add) {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.search-section :deep(.el-button--primary:hover),
.toolbar-section :deep(.pro-toolbar-btn--add:hover) {
  border-color: var(--el-color-primary-dark-2);
  background: var(--el-color-primary-dark-2);
  color: #fff;
}

.is-info {
  --status-color: var(--el-color-info, #909399);
}

.is-primary {
  --status-color: var(--el-color-primary, #409eff);
}

:global(html.dark) .page-header {
  --page-header-background: #292f38;
  --page-header-card-background: rgb(255 255 255 / 4%);
  --page-header-control-background: rgb(255 255 255 / 6%);
  --page-header-border: #3f4854;
}
</style>