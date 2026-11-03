<script setup lang="ts">
import { computed } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'

defineOptions({ name: 'MessageEntry' })
const chat = useChatStore()
const router = useRouter()
const badgeText = computed(() => (chat.unreadTotal > 99 ? '99+' : String(chat.unreadTotal)))
</script>

<template>
  <!-- 角标与通知入口同一套写法：页头行高较大，el-badge 会被撑高而飘到页头顶部。 -->
  <span class="message-trigger">
    <el-button class="header-icon-button" text circle aria-label="消息" @click="router.push({ name: 'message' })">
      <el-icon><ChatDotRound /></el-icon>
    </el-button>
    <span v-if="chat.unreadTotal > 0" class="message-badge" aria-hidden="true">{{ badgeText }}</span>
  </span>
</template>

<style scoped>
.message-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.message-badge {
  position: absolute;
  z-index: 1;
  top: -2px;
  right: -5px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  box-sizing: border-box;
  border-radius: 9px;
  border: 2px solid var(--panel-background);
  background: var(--el-color-danger);
  color: #fff;
  text-align: center;
  line-height: 13px;
  font-size: 10px;
  font-weight: 700;
  pointer-events: none;
}
</style>
