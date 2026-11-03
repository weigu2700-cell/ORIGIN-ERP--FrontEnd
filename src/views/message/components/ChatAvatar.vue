<script setup lang="ts">
import { computed } from 'vue'
import { Bell, UserFilled } from '@element-plus/icons-vue'
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
    <el-icon v-if="kind === 'group'"><UserFilled /></el-icon>
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
</style>
