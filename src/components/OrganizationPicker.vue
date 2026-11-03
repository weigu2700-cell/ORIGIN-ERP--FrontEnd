<script setup lang="ts">
import { computed } from 'vue'
import { useOrganizationStore } from '@/stores/organization'
const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ change: [] }>()
const organizations = useOrganizationStore()
const options = computed(() => {
  const entries =
    organizations.configuration?.mode === 'single'
      ? [organizations.configuration.organization]
      : [organizations.resolved, ...organizations.recent]
  return entries.filter(
    (entry, index, values) => entry && values.findIndex((value) => value?.code === entry.code) === index,
  )
})
async function select(code: string) {
  emit('change')
  organizations.choose(code || '')
  if (code) {
    try {
      await organizations.verify(code)
    } catch {
      /* 错误在字段旁显示，可重新选择。 */
    }
  }
}
</script>
<template>
  <div class="organization-picker">
    <label id="organization-label">登录组织</label>
    <el-select
      :model-value="organizations.selectedCode"
      aria-labelledby="organization-label"
      placeholder="选择最近组织，或输入组织编码"
      filterable
      allow-create
      default-first-option
      :clearable="organizations.configuration?.mode === 'multi'"
      :loading="organizations.loading"
      :disabled="props.disabled || organizations.initializing || organizations.configuration?.mode === 'single'"
      @change="select"
    >
      <el-option
        v-for="organization in options"
        :key="organization!.code"
        :label="organization!.name"
        :value="organization!.code"
      >
        <span>{{ organization!.name }}</span>
        <small>{{ organization!.code }}</small>
      </el-option>
    </el-select>
    <p v-if="organizations.loading" class="hint" role="status">正在核验组织…</p>
    <p v-else-if="organizations.error" class="error" role="alert">
      {{ organizations.error }}
      <button type="button" @click="organizations.initialize()">重试</button>
    </p>
    <p v-else-if="organizations.resolved" class="hint">
      {{ organizations.resolved.name }} · {{ organizations.resolved.code }}
    </p>
    <p v-else class="hint">首次使用请输入管理员提供的组织编码</p>
  </div>
</template>
<style scoped>
.organization-picker {
  margin-bottom: 22px;
}
label {
  display: block;
  margin-bottom: 9px;
  color: #334b5a;
  font-size: 13px;
  font-weight: 600;
}
.el-select {
  width: 100%;
}
:deep(.el-select__wrapper) {
  min-height: 46px;
}
small {
  margin-left: 16px;
  color: var(--el-text-color-secondary);
}
p {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.hint {
  color: #6f7f89;
}
.error {
  color: #b63737;
}
button {
  min-height: 32px;
  margin-left: 8px;
  color: #245b78;
  background: none;
  border: 0;
  text-decoration: underline;
  cursor: pointer;
}
</style>
