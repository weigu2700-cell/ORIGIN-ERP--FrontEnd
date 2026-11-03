<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Loading, WarnTriangleFilled, ArrowDown } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { isLocalMessage, type TimelineItem } from '@/types/im'
import ChatAvatar from './ChatAvatar.vue'
import MessageItem from './MessageItem.vue'
import MessageComposer from './MessageComposer.vue'
import { buildRows, errorText, isGroup } from '../utils'

defineProps<{ infoOpen: boolean }>()
const emit = defineEmits<{ toggleInfo: [] }>()

const chat = useChatStore()
const scroller = ref<HTMLElement>()
const loadingOlder = ref(false)
const stuck = ref(true)
const hasNew = ref(false)
const entryUnread = ref<string | null>(null)
const preview = ref<{ url: string; name: string } | null>(null)

const conv = computed(() => chat.active)
const items = computed<TimelineItem[]>(() => (conv.value ? (chat.timelines[conv.value.id] ?? []) : []))
const rows = computed(() => buildRows(items.value, entryUnread.value))
const readonlyReason = computed(() => (conv.value?.status === 'DISSOLVED' ? '该群已解散，仅可查看历史消息' : ''))
const subtitle = computed(() => {
  const c = conv.value
  if (!c) return ''
  if (c.type === 'GROUP') return `${c.memberCount} 人${c.muted ? ' · 已静音' : ''}`
  return chat.contactCache[c.peerUserId ?? '']?.departmentName ?? ''
})
const banner = computed(() => {
  if (chat.connection === 'offline')
    return {
      type: 'error' as const,
      text: '网络已断开，新消息将在恢复连接后自动补拉；发送中的消息会标记失败，可重试。',
    }
  if (chat.degraded && chat.connection !== 'online')
    return {
      type: 'warning' as const,
      text: '实时连接暂时无法建立，消息每 30 秒自动刷新。若一直如此，请确认后端已允许当前页面地址（IM_WEB_ORIGIN）。',
    }
  if (chat.connection === 'reconnecting' || chat.connection === 'connecting')
    return { type: 'warning' as const, text: '正在重新连接…已发送的内容不会丢失。' }
  return null
})

const nearBottom = () => {
  const el = scroller.value
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

const toBottom = async () => {
  await nextTick()
  const el = scroller.value
  if (el) el.scrollTop = el.scrollHeight
  hasNew.value = false
  stuck.value = true
}

function onScroll() {
  stuck.value = nearBottom()
  if (stuck.value) hasNew.value = false
  if ((scroller.value?.scrollTop ?? 1) < 40) void older()
}

async function older() {
  const c = conv.value
  if (!c || loadingOlder.value || !chat.hasOlder[c.id]) return
  const el = scroller.value
  const before = el?.scrollHeight ?? 0
  loadingOlder.value = true
  try {
    await chat.loadOlder(c.id)
    await nextTick()
    if (el) el.scrollTop = el.scrollHeight - before
  } finally {
    loadingOlder.value = false
  }
}

watch(
  () => conv.value?.id,
  async (id) => {
    if (!id) return
    // 进入会话时记住第一条未读，用于“以下为新消息”分割线。
    const c = chat.conversations[id]
    entryUnread.value = c && c.unreadCount > 0 ? String(BigInt(c.lastReadSeq) + 1n) : null
    await toBottom()
  },
  { immediate: true },
)
watch(
  () => items.value.length,
  async (n, old) => {
    if (n <= (old ?? 0)) return
    const last = items.value[n - 1]
    if (stuck.value || (last && isLocalMessage(last))) await toBottom()
    else hasNew.value = true
  },
)

async function send(text: string) {
  if (!conv.value) return
  try {
    await chat.sendText(conv.value.id, text)
  } catch (error) {
    // 发送前的本地错误（例如浏览器不支持的 API）也要让用户看到，而不是静默丢失输入。
    ElMessage.error(errorText(error))
  }
}

async function sendFiles(files: File[]) {
  const c = conv.value
  if (!c) return
  for (const file of files) {
    try {
      await chat.sendFile(c.id, file)
    } catch (error) {
      ElMessage.error(errorText(error))
    }
  }
}

async function download(fileId: string | undefined, name: string) {
  if (!fileId) return
  try {
    await chat.download(fileId, name)
  } catch (error) {
    ElMessage.error(errorText(error))
  }
}

async function showImage(fileId: string | undefined, name: string) {
  if (!fileId) return
  try {
    const blob = await (await import('@/api/im')).imApi.downloadFile(fileId)
    if (preview.value) URL.revokeObjectURL(preview.value.url)
    preview.value = { url: URL.createObjectURL(blob), name }
  } catch (error) {
    ElMessage.error(errorText(error))
  }
}

function closePreview() {
  if (preview.value) URL.revokeObjectURL(preview.value.url)
  preview.value = null
}
onBeforeUnmount(closePreview)
</script>

<template>
  <section class="chat-main">
    <template v-if="conv">
      <el-alert v-if="banner" :type="banner.type" :closable="false" show-icon :title="banner.text" class="net-banner" />
      <header class="head">
        <ChatAvatar
          :kind="isGroup(conv) ? 'group' : 'user'"
          :name="conv.name"
          :user-id="conv.peerUserId ?? ''"
          :size="38"
          :dissolved="conv.status === 'DISSOLVED'"
        />
        <div class="ttl">
          <b>
            {{ conv.name }}
            <el-tag v-if="conv.status === 'DISSOLVED'" size="small" type="info" effect="plain">已解散</el-tag>
          </b>
          <small>{{ subtitle }}</small>
        </div>
        <el-tooltip :content="isGroup(conv) ? '群信息' : '会话信息'" placement="bottom">
          <el-button
            text
            circle
            :type="infoOpen ? 'primary' : undefined"
            :icon="InfoFilled"
            aria-label="会话信息"
            @click="emit('toggleInfo')"
          />
        </el-tooltip>
      </header>
      <div ref="scroller" class="scroll" @scroll.passive="onScroll">
        <div v-if="chat.hasOlder[conv.id]" class="older">
          <el-button text type="primary" :loading="loadingOlder" @click="older">查看更早的消息</el-button>
        </div>
        <div v-else-if="items.length" class="older end">没有更早的消息了</div>
        <template v-for="row in rows" :key="row.key">
          <div v-if="row.kind === 'day'" class="day">
            <span>{{ row.label }}</span>
          </div>
          <div v-else-if="row.kind === 'unread'" class="unread-line">以下为新消息</div>
          <MessageItem
            v-else-if="row.item"
            :item="row.item"
            :mine="row.item.senderId === chat.myId"
            :show-name="isGroup(conv)"
            :sender-name="chat.nameOf(row.item.senderId)"
            :sender-id="row.item.senderId"
            @retry="chat.retry(conv.id, row.item.id)"
            @discard="chat.discard(conv.id, row.item.id)"
            @cancel="chat.cancelUpload(conv.id, row.item.id)"
            @download="download(row.item.file?.id, row.item.file?.name ?? '文件')"
            @preview="showImage(row.item.file?.id, row.item.file?.name ?? '图片')"
          />
        </template>
        <div v-if="!items.length" class="empty-chat">
          <el-icon><Loading /></el-icon>
          还没有消息，发送第一条吧
        </div>
      </div>
      <transition name="pill">
        <button v-if="hasNew" class="new-pill" type="button" @click="toBottom">
          <el-icon><ArrowDown /></el-icon>
          有新消息
        </button>
      </transition>
      <MessageComposer
        :key="conv.id"
        :readonly-reason="readonlyReason"
        :max-chars="chat.config?.textMaxChars ?? 4000"
        :max-file-mb="Math.round((chat.config?.maxFileBytes ?? 50_000_000) / 1_000_000)"
        :offline="chat.connection === 'offline'"
        @send="send"
        @files="sendFiles"
      />
      <el-dialog :model-value="!!preview" :title="preview?.name" width="720px" align-center @close="closePreview">
        <img v-if="preview" :src="preview.url" :alt="preview.name" class="preview-img" />
      </el-dialog>
    </template>
    <div v-else class="empty">
      <el-icon class="empty-icon">
        <WarnTriangleFilled v-if="chat.revokedNotice" />
        <InfoFilled v-else />
      </el-icon>
      <b>{{ chat.revokedNotice ?? '选择一个会话开始聊天' }}</b>
      <span>或点击左侧「+」发起单聊、创建群聊</span>
    </div>
  </section>
</template>

<style scoped>
.chat-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--page-background);
  position: relative;
  height: 100%;
}
.head {
  height: 60px;
  flex: none;
  background: var(--panel-background);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
}
.ttl {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.ttl b {
  font-size: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--text-primary);
}
.ttl small {
  color: var(--text-secondary);
  font-size: 12px;
}
.scroll {
  flex: 1;
  overflow: auto;
  padding: 8px 24px 16px;
  min-height: 0;
}
.older {
  text-align: center;
  margin: 6px 0;
  color: var(--text-secondary);
  font-size: 12px;
}
.day {
  display: flex;
  justify-content: center;
  margin: 14px 0 8px;
}
.day span {
  background: rgb(36 91 120 / 10%);
  color: var(--text-secondary);
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}
.unread-line {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-primary);
  font-size: 12px;
  margin: 12px 0;
}
.unread-line::before,
.unread-line::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgb(36 91 120 / 25%);
}
.empty-chat {
  display: flex;
  gap: 6px;
  justify-content: center;
  color: var(--text-secondary);
  padding: 40px;
}
.empty {
  margin: auto;
  display: grid;
  gap: 8px;
  text-align: center;
  color: var(--text-secondary);
  justify-items: center;
}
.empty-icon {
  font-size: 40px;
  color: var(--color-primary);
}
.empty b {
  color: var(--text-primary);
  font-size: 16px;
}
.new-pill {
  position: absolute;
  right: 28px;
  bottom: 150px;
  border: 0;
  border-radius: 16px;
  background: var(--color-primary);
  color: #fff;
  padding: 6px 14px;
  cursor: pointer;
  display: flex;
  gap: 4px;
  align-items: center;
  box-shadow: 0 4px 12px rgb(0 0 0 / 18%);
}
.pill-enter-active,
.pill-leave-active {
  transition: opacity 0.15s;
}
.pill-enter-from,
.pill-leave-to {
  opacity: 0;
}
.preview-img {
  max-width: 100%;
  max-height: 70vh;
  display: block;
  margin: 0 auto;
}
.net-banner {
  border-radius: 0;
}
</style>
