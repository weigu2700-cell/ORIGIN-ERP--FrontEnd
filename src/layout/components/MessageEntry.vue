<script setup lang="ts">
import { ChatDotRound } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'

defineOptions({ name: 'MessageEntry' })
const chat = useChatStore()
const router = useRouter()
</script>

<template>
  <el-badge :value="chat.unreadTotal" :max="99" :hidden="chat.unreadTotal === 0" class="message-entry">
    <el-button class="header-icon-button" text circle aria-label="消息" @click="router.push({ name: 'message' })">
      <el-icon><ChatDotRound /></el-icon>
    </el-button>
  </el-badge>
</template>
