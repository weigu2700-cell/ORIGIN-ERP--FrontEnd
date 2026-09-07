<script setup lang="ts">
type BusinessStatusValue = string | number | null

interface BusinessStatusOption {
  label: string
  value: Exclude<BusinessStatusValue, null>
  tone?: string
}

const props = withDefaults(defineProps<{
  modelValue: BusinessStatusValue
  businessType: 'master' | 'sales' | 'production'
  options: BusinessStatusOption[]
  allLabel?: string
  emptyValue?: BusinessStatusValue
}>(), {
  allLabel: '全部',
  emptyValue: null,
})

const emit = defineEmits<{
  (e: 'change', value: BusinessStatusValue): void
}>()

const selectStatus = (value: BusinessStatusValue) => {
  if (props.modelValue === value) return
  emit('change', value)
}
</script>

<template>
  <div class="business-status-filter" :class="`business-status-filter--${businessType}`">
    <span class="business-status-filter__label">
      {{ businessType === 'master' ? '资料状态' : businessType === 'sales' ? '单据进度' : '生产进度' }}
    </span>
    <div class="business-status-filter__options" role="group" aria-label="状态快捷筛选">
      <button
        type="button"
        class="business-status-filter__option"
        :class="{ 'is-active': modelValue === null || modelValue === '' }"
        :aria-pressed="modelValue === null || modelValue === ''"
        @click="selectStatus(emptyValue)"
      >
        {{ allLabel }}
      </button>
      <button
        v-for="option in options"
        :key="String(option.value)"
        type="button"
        class="business-status-filter__option"
        :class="[`is-${option.tone ?? 'default'}`, { 'is-active': modelValue === option.value }]"
        :aria-pressed="modelValue === option.value"
        @click="selectStatus(option.value)"
      >
        <span class="business-status-filter__dot" aria-hidden="true" />
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.business-status-filter {
  --business-color: #475569;
  --business-soft: #f1f5f9;
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.business-status-filter--master {
  --business-color: #0f766e;
  --business-soft: #f0fdfa;
}

.business-status-filter--sales {
  --business-color: #9a5b13;
  --business-soft: #fff8eb;
}

.business-status-filter--production {
  --business-color: #1d4f73;
  --business-soft: #f0f7fb;
}

.business-status-filter__label {
  flex: none;
  color: #64748b;
  font-size: 13px;
}

.business-status-filter__options {
  display: flex;
  align-items: center;
  overflow-x: auto;
  border: 1px solid #d8dee6;
  border-radius: 6px;
  background: #fff;
}

.business-status-filter__option {
  display: inline-flex;
  align-items: center;
  flex: none;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-right: 1px solid #e5e9ef;
  background: #fff;
  color: #475569;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}

.business-status-filter__option:last-child {
  border-right: 0;
}

.business-status-filter__option:hover {
  background: #f8fafc;
  color: #1e293b;
}

.business-status-filter__option:focus-visible {
  position: relative;
  outline: 2px solid var(--business-color);
  outline-offset: -2px;
}

.business-status-filter__option.is-active {
  background: var(--business-soft);
  color: var(--business-color);
  box-shadow: inset 0 -2px var(--business-color);
  font-weight: 600;
}

.business-status-filter__dot {
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: #94a3b8;
}

.business-status-filter__option.is-success .business-status-filter__dot {
  background: #26966f;
}

.business-status-filter__option.is-warning .business-status-filter__dot {
  background: #d18a27;
}

.business-status-filter__option.is-danger .business-status-filter__dot {
  background: #c2413b;
}

@media (max-width: 1100px) {
  .business-status-filter__label {
    display: none;
  }
}
</style>
