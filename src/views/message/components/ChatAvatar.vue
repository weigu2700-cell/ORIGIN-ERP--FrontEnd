<script setup lang="ts">
import { computed } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { avatarColor, initials } from '../utils'

const props = withDefaults(
  defineProps<{
    kind?: 'user' | 'group' | 'system'
    name?: string
    userId?: string
    size?: number
    dissolved?: boolean
  }>(),
  { kind: 'user', name: '', userId: '', size: 40, dissolved: false },
)
const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.round(props.size * 0.38)}px`,
  borderRadius: `${Math.round(props.size * 0.28)}px`,
  background:
    props.kind === 'user' ? avatarColor(props.userId || props.name) : 'linear-gradient(135deg,#3c7c9c,#18384b)',
  filter: props.dissolved ? 'grayscale(1)' : undefined,
  opacity: props.dissolved ? 0.6 : 1,
}))
</script>

<template>
  <span class="chat-avatar" :style="style" :aria-label="name">
    <svg v-if="kind === 'group'" class="group-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <path d="M16 6.2a3.2 3.2 0 0 1 0 5.6M18 14a6 6 0 0 1 3 5" />
    </svg>
    <el-icon v-else-if="kind === 'system'"><Bell /></el-icon>
    <template v-else>{{ initials(name) }}</template>
  </span>
</template>

<style scoped>
.chat-avatar {
  display: inline-grid;
  place-items: center;
  flex: none;
  color: #fff;
  font-weight: 700;
}
.group-icon {
  width: 55%;
  height: 55%;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
