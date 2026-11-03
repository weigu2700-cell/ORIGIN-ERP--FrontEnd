<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import ConversationList from './components/ConversationList.vue'
import ChatPane from './components/ChatPane.vue'
import GroupInfoPanel from './components/GroupInfoPanel.vue'
import ContactPickerDialog from './components/ContactPickerDialog.vue'
import { errorText } from './utils'

defineOptions({ name: 'MessagePage' })

const chat = useChatStore()
const route = useRoute()
const infoOpen = ref(false)
const picker = ref<{ open: boolean; mode: 'direct' | 'group' | 'add' }>({ open: false, mode: 'direct' })

const routeId = computed(() => (typeof route.params.conversationId === 'string' ? route.params.conversationId : ''))

async function select(id: string) {
  // 切换会话不改地址栏：布局以 fullPath 作为页面 key，改路由会整页重建并丢失滚动与输入状态。
  try {
    await chat.open(id)
  } catch (error) {
    ElMessage.error(errorText(error))
  }
}

function openPicker(mode: 'direct' | 'group' | 'add') {
  picker.value = { open: true, mode }
}

onMounted(() => {
  if (!chat.ready && !chat.disabledReason) void chat.bootstrap()
})
watch(
  [() => chat.ready, routeId],
  ([ready, id]) => {
    if (ready && id && chat.conversations[id] && chat.activeId !== id) void select(id)
  },
  { immediate: true },
)
</script>

<template>
  <div class="message-page" :class="{ 'with-info': infoOpen && chat.active }">
    <ConversationList @select="select" @new-direct="openPicker('direct')" @new-group="openPicker('group')" />
    <ChatPane :info-open="infoOpen" @toggle-info="infoOpen = !infoOpen" />
    <GroupInfoPanel v-if="infoOpen && chat.active" @add-member="openPicker('add')" @left="infoOpen = false" />
    <ContactPickerDialog
      v-model="picker.open"
      :mode="picker.mode"
      :conversation-id="chat.activeId ?? undefined"
      @created="select"
    />
  </div>
</template>

<style scoped>
.message-page {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  height: 100%;
  min-height: 480px;
  background: var(--panel-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}
.message-page.with-info {
  grid-template-columns: 320px minmax(0, 1fr) 300px;
}
</style>
