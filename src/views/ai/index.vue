<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowUp, ChatDotRound, CollectionTag, Plus, Refresh, VideoPause } from '@element-plus/icons-vue'
import {
  addConversation,
  archiveConversation,
  getConversationList,
  getMessageList,
  sendMessageStream,
} from '@/api/ai/ai'
import type { AiConversationList, AiMessageView } from '@/types/ai/ai'
import { renderAiMarkdown } from '@/utils/renderAiMarkdown'

const conversations = ref<AiConversationList>([])
const messages = ref<AiMessageView[]>([])
const selectedId = ref('')
const draft = ref('')
const listLoading = ref(false)
const messagesLoading = ref(false)
const creating = ref(false)
const sending = ref(false)
const sendingConversationId = ref('')
const archivingId = ref('')
const listError = ref(false)
const messagesError = ref(false)
const messageListRef = ref<HTMLElement>()
let requestSequence = 0
let streamController: AbortController | null = null

const selected = computed(() => conversations.value.find((item) => item.id === selectedId.value))
const activeConversations = computed(() => conversations.value.filter((item) => item.status === 0))
const archivedConversations = computed(() => conversations.value.filter((item) => item.status === 1))
const selectedIsArchived = computed(() => selected.value?.status === 1)
const canSend = computed(
  () =>
    Boolean(draft.value.trim()) &&
    !sending.value &&
    !creating.value &&
    !listLoading.value &&
    !messagesLoading.value &&
    !messagesError.value &&
    !selectedIsArchived.value,
)

const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(date)
}

const scrollBottom = async () => {
  await nextTick()
  if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight
}

const loadMessages = async (id: string) => {
  const sequence = ++requestSequence
  messagesLoading.value = true
  messagesError.value = false
  let loaded = false

  try {
    const result = await getMessageList(id)
    if (sequence === requestSequence && selectedId.value === id) {
      // 历史消息均为已完成状态，补全视图层需要的 status 字段。
      messages.value = result.map((message) => ({ ...message, status: 'completed' as const }))
      loaded = true
    }
  } catch {
    if (sequence === requestSequence && selectedId.value === id) messagesError.value = true
  } finally {
    if (sequence === requestSequence) {
      messagesLoading.value = false
      // 等消息替换加载态并完成 DOM 更新，再定位到最新一条。
      if (loaded && selectedId.value === id) await scrollBottom()
    }
  }
}

const selectConversation = (id: string) => {
  if (id === selectedId.value && !messagesError.value) return
  stopStreaming()
  selectedId.value = id
  messages.value = []
  void loadMessages(id)
}

const archiveSelectedConversation = async (id: string) => {
  if (archivingId.value || (sending.value && sendingConversationId.value === id)) return

  try {
    await ElMessageBox.confirm('归档后暂不支持恢复，仍要归档这个会话吗？', '归档会话', {
      type: 'warning',
      confirmButtonText: '确认归档',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  archivingId.value = id
  try {
    await archiveConversation(id)
    const archived = conversations.value.find((item) => item.id === id)
    if (archived) archived.status = 1
    ElMessage.success('会话已归档')
    const wasSelected = selectedId.value === id
    await loadConversations(false)
    if (wasSelected) {
      const nextConversation = activeConversations.value[0]
      if (nextConversation) selectConversation(nextConversation.id)
      else {
        selectedId.value = ''
        messages.value = []
      }
    }
  } catch {
    ElMessage.error('归档失败，请稍后重试')
  } finally {
    archivingId.value = ''
  }
}

const loadConversations = async (selectFirst = true) => {
  listLoading.value = true
  listError.value = false

  try {
    const result = await getConversationList()
    conversations.value = [...result].sort(
      (a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime(),
    )

    if (!conversations.value.length) {
      selectedId.value = ''
      messages.value = []
    } else if (selectFirst && !conversations.value.some((item) => item.id === selectedId.value)) {
      selectConversation(activeConversations.value[0]?.id || conversations.value[0]!.id)
    }
  } catch {
    listError.value = true
  } finally {
    listLoading.value = false
  }
}

const createConversation = async (skipMessageLoad = false) => {
  if (creating.value) return
  creating.value = true

  try {
    const result = await addConversation()
    await loadConversations(false)

    const id = String(result.conversationId)
    if (conversations.value.some((item) => item.id === id)) {
      if (skipMessageLoad) {
        ++requestSequence
        selectedId.value = id
        messages.value = []
        messagesLoading.value = false
        messagesError.value = false
      } else {
        selectConversation(id)
      }
    } else {
      selectedId.value = id
      messages.value = []
    }
  } catch {
    ElMessage.error('新建会话失败，请稍后重试')
  } finally {
    creating.value = false
  }
}

const handleSend = async () => {
  const content = draft.value.trim()
  if (
    !content ||
    sending.value ||
    creating.value ||
    listLoading.value ||
    messagesLoading.value ||
    messagesError.value ||
    selectedIsArchived.value
  )
    return

  if (!selectedId.value) await createConversation(true)
  const id = selectedId.value
  if (!id) return

  draft.value = ''
  const now = new Date().toISOString()
  const localMessageId = `local-user-${Date.now()}`
  messages.value.push({
    id: localMessageId,
    conversationId: id,
    role: 'user',
    content,
    createTime: now,
    updateTime: now,
    deleted: 0,
    status: 'completed',
  })

  // 先插入空的助手消息，流式分片到达时直接追加到它的 content 上。
  const assistantMessageId = `local-assistant-${Date.now()}`
  messages.value.push({
    id: assistantMessageId,
    conversationId: id,
    role: 'assistant',
    content: '',
    createTime: now,
    updateTime: now,
    deleted: 0,
    status: 'streaming',
  })
  await scrollBottom()

  sending.value = true
  sendingConversationId.value = id
  streamController = new AbortController()

  try {
    await sendMessageStream(
      { conversationId: id, message: content },
      {
        onChunk: (chunk) => {
          if (selectedId.value !== id) return

          // 按后端返回的 type 决定前端动作。
          switch (chunk.type) {
            case 'CONTENT': {
              const target = messages.value.find((message) => message.id === assistantMessageId)
              if (!target) return
              target.content += chunk.content
              void scrollBottom()
              break
            }
            case 'TITLE': {
              // 标题由后端在流中下发，直接本地更新，无需再请求会话列表。
              const conversation = conversations.value.find((item) => item.id === id)
              if (conversation && chunk.content) conversation.title = chunk.content
              break
            }
            case 'ERROR': {
              const target = messages.value.find((message) => message.id === assistantMessageId)
              if (!target) return
              target.status = 'error'
              target.errorMessage = chunk.content
              void scrollBottom()
              break
            }
          }
        },
      },
      streamController.signal,
    )

    // 流正常结束，标记助手消息为已完成。
    const target = messages.value.find((message) => message.id === assistantMessageId)
    if (target && target.status === 'streaming') target.status = 'completed'
  } catch (error) {
    // 中断或失败时保留已生成内容，并标记对应状态。
    if (selectedId.value === id) {
      const target = messages.value.find((message) => message.id === assistantMessageId)

      if ((error as Error)?.name === 'AbortError') {
        if (target) target.status = 'cancelled'
      } else if (target && !target.content) {
        // 没有任何内容时移除占位消息，并把输入内容还给用户。
        messages.value = messages.value.filter((message) => message.id !== assistantMessageId)
        draft.value = content
      } else if (target) {
        target.status = 'error'
        target.errorMessage = (error as Error)?.message || '生成失败'
      }
    }
  } finally {
    sending.value = false
    sendingConversationId.value = ''
    streamController = null
  }
}

/** 中断当前流式请求，已生成的内容保留在界面上。 */
const stopStreaming = () => {
  streamController?.abort()
  streamController = null
  sending.value = false
  sendingConversationId.value = ''
}

onMounted(() => void loadConversations())
onBeforeUnmount(() => streamController?.abort())
</script>

<template>
  <div class="ai-workspace round">
    <aside class="sidebar round">
      <div class="sidebar-brand">
        <div>
          <small>ORIGIN AI</small>
          <strong>对话工作区</strong>
        </div>
      </div>
      <el-button class="new-button" :loading="creating" @click="createConversation()">
        <el-icon>
          <Plus />
        </el-icon>
        新建会话
      </el-button>
      <div class="list-heading">
        <span>最近会话</span>
        <el-button text circle :loading="listLoading" aria-label="刷新会话" @click="loadConversations(false)">
          <el-icon>
            <Refresh />
          </el-icon>
        </el-button>
      </div>
      <div class="conversation-list">
        <div v-if="listLoading && !conversations.length" class="skeleton"><i v-for="n in 4" :key="n" /></div>
        <template v-else>
          <div v-if="activeConversations.length" class="conversation-group">
            <div class="group-label">进行中</div>
            <div v-for="item in activeConversations" :key="item.id" class="conversation-row">
              <button
                class="conversation"
                :class="{ active: item.id === selectedId }"
                @click="selectConversation(item.id)"
              >
                <el-icon>
                  <ChatDotRound />
                </el-icon>
                <span>{{ item.title || '未命名会话' }}</span>
                <time>{{ formatDate(item.updateTime) }}</time>
              </button>
              <el-button
                class="archive-button"
                text
                circle
                :loading="archivingId === item.id"
                :disabled="sending && sendingConversationId === item.id"
                aria-label="归档会话"
                @click="archiveSelectedConversation(item.id)"
              >
                <el-icon>
                  <CollectionTag />
                </el-icon>
              </el-button>
            </div>
          </div>
          <div v-if="archivedConversations.length" class="conversation-group archived-group">
            <div class="group-label">已归档</div>
            <button
              v-for="item in archivedConversations"
              :key="item.id"
              class="conversation archived"
              :class="{ active: item.id === selectedId }"
              @click="selectConversation(item.id)"
            >
              <el-icon>
                <CollectionTag />
              </el-icon>
              <span>{{ item.title || '未命名会话' }}</span>
              <time>{{ formatDate(item.updateTime) }}</time>
            </button>
          </div>
        </template>
        <div v-if="listError" class="state">
          加载失败
          <el-button text @click="loadConversations()">重试</el-button>
        </div>
        <div v-else-if="!listLoading && !conversations.length" class="state">还没有会话</div>
      </div>
    </aside>
    <main class="chat-panel round">
      <section ref="messageListRef" class="message-scroll">
        <div v-if="messagesLoading" class="loading-dots">
          <i />
          <i />
          <i />
        </div>
        <div v-else-if="messagesError" class="empty">
          <h2>消息加载失败</h2>
          <p>请重试，或者切换到其他会话。</p>
          <el-button type="primary" plain @click="loadMessages(selectedId)">重新加载</el-button>
        </div>
        <div v-else-if="!messages.length" class="empty">
          <h1>今天想一起完成什么？</h1>
        </div>
        <template v-else>
          <article v-for="message in messages" :key="message.id" class="message" :class="message.role">
            <div class="bubble">
              <p v-if="message.role === 'user'">{{ message.content }}</p>
              <template v-else>
                <div v-if="message.content" class="markdown-body" v-html="renderAiMarkdown(message.content)" />

                <div v-if="message.status === 'streaming' && !message.content" class="typing">
                  <i />
                  <i />
                  <i />
                </div>

                <div v-if="message.status === 'error'" class="message-status error">
                  {{ message.errorMessage }}
                </div>

                <div v-else-if="message.status === 'cancelled'" class="message-status">已停止生成</div>
              </template>
            </div>
          </article>
        </template>
      </section>
      <footer class="composer-wrap">
        <div v-if="selectedIsArchived" class="archived-notice">这个会话已归档，仅供查看。请新建会话继续交流。</div>
        <div class="composer" :class="{ disabled: sending || selectedIsArchived }">
          <el-input
            v-model="draft"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 6 }"
            resize="none"
            :disabled="sending || selectedIsArchived"
            placeholder="描述你想完成的事…"
            @keydown.enter.exact.prevent="handleSend"
          />
          <div>
            <span>{{ selectedIsArchived ? '已归档会话不可发送' : '' }}</span>
            <el-button
              v-if="sending && sendingConversationId === selectedId"
              type="primary"
              circle
              aria-label="停止生成"
              @click="stopStreaming"
            >
              <el-icon>
                <VideoPause />
              </el-icon>
            </el-button>
            <el-button v-else type="primary" circle :disabled="!canSend" aria-label="发送消息" @click="handleSend">
              <el-icon>
                <ArrowUp />
              </el-icon>
            </el-button>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.ai-workspace {
  --border: color-mix(in srgb, var(--el-border-color) 72%, transparent);
  --muted: var(--el-text-color-secondary);
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 15px;
  height: 100%;
  min-height: 560px;
  overflow: hidden;
  color: var(--el-text-color-primary);
  background: var(--page-background);
}

.sidebar {
  display: flex;
  flex-direction: column;
  padding: 22px 14px 14px;
  border: 1px solid var(--border-color);
  background: var(--panel-background);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  padding: 3px 8px 22px;
}

.sidebar-brand small {
  display: block;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.sidebar-brand strong {
  display: block;
  margin-top: 1px;
  font-size: 15px;
}

.new-button {
  justify-content: flex-start;
  width: 100%;
  height: 38px;
  color: var(--el-text-color-primary);
  border-color: var(--border);
  background: var(--el-bg-color);
}

.new-button .el-icon {
  margin-right: 8px;
}

.new-button:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24px 7px 8px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 650;
}

.list-heading .el-button {
  width: 26px;
  height: 26px;
  color: var(--muted);
}

.conversation-list {
  flex: 1;
  overflow: auto;
}

.conversation-group + .conversation-group {
  margin-top: 18px;
}

.group-label {
  padding: 0 9px 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.conversation {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 8px 9px;
  color: var(--el-text-color-regular);
  text-align: left;
  border: 0;
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
}

.conversation-row {
  display: flex;
  align-items: center;
}

.conversation-row .conversation {
  flex: 1;
  min-width: 0;
}

.conversation:hover {
  background: var(--el-fill-color);
}

.conversation.active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.conversation span {
  flex: 1;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation time {
  color: var(--muted);
  font-size: 10px;
}

.conversation.archived {
  color: var(--el-text-color-secondary);
}

.conversation.archived .el-icon {
  color: var(--el-text-color-placeholder);
}

.archive-button {
  display: inline-flex;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  margin: 0 2px 0 0;
  color: var(--muted);
  opacity: 0.62;
}

.conversation-row:hover .archive-button,
.conversation-row:focus-within .archive-button {
  opacity: 1;
}

.archive-button:hover {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
}

:global(html.dark) .new-button:hover,
:global(html.dark) .conversation.active {
  color: var(--el-color-primary-light-3);
  background: color-mix(in srgb, var(--el-color-primary) 20%, var(--panel-background));
}

:global(html.dark) .archive-button:hover {
  color: #e6b566;
  background: color-mix(in srgb, #e6b566 16%, var(--panel-background));
}

.state {
  padding: 18px 8px;
  color: var(--muted);
  font-size: 12px;
  text-align: center;
}

.skeleton i {
  display: block;
  height: 34px;
  margin: 4px 2px;
  border-radius: 7px;
  background: var(--el-fill-color);
  animation: pulse 1.3s infinite;
}

.chat-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-width: 0;
  max-width: 100%;
  min-height: 0;
  border: 1px solid var(--border-color);
  background: var(--page-background);
}

.message-scroll {
  width: min(100%, 800px);
  margin: 0 auto;
  padding: 42px clamp(18px, 4vw, 42px) 28px;
  overflow: auto;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  text-align: center;
}

.empty h1,
.empty h2 {
  margin: 0;
  font-size: 23px;
  font-weight: 650;
}

.empty h2 {
  font-size: 18px;
}

.empty p {
  max-width: 390px;
  margin: 10px 0 18px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.empty small {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.message {
  display: flex;
  width: 100%;
  max-width: 800px;
  margin: 0 auto 18px;
}

.message.user {
  justify-content: flex-end;
}

.bubble {
  max-width: min(100%, 800px);
  padding: 10px 14px 11px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 52%, transparent);
  border-radius: 14px 14px 14px 4px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.message.user .bubble {
  border-color: var(--el-color-primary);
  border-radius: 14px 14px 4px 14px;
  background: var(--el-color-primary);
  color: #fff;
}

.message.user .bubble p {
  margin: 0;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.markdown-body {
  min-width: 0;
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.markdown-body :deep(:first-child) {
  margin-top: 0;
}

.markdown-body :deep(:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(blockquote),
.markdown-body :deep(pre),
.markdown-body :deep(table),
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(hr) {
  margin: 0 0 0.75em;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  font-weight: 700;
  line-height: 1.35;
}

.markdown-body :deep(h1) {
  font-size: 1.25em;
}

.markdown-body :deep(h2) {
  font-size: 1.12em;
}

.markdown-body :deep(h3) {
  font-size: 1em;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.45em;
}

.markdown-body :deep(li + li) {
  margin-top: 0.25em;
}

.markdown-body :deep(blockquote) {
  padding-left: 0.9em;
  color: var(--el-text-color-secondary);
  border-left: 3px solid var(--el-border-color);
}

.markdown-body :deep(a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.markdown-body :deep(code) {
  padding: 0.12em 0.35em;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-text-color-primary) 9%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.88em;
}

.markdown-body :deep(pre) {
  max-width: 100%;
  padding: 12px 14px;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 66%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-fill-color-darker) 58%, var(--el-bg-color));
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: 0.86em;
  white-space: pre;
}

.markdown-body :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 6px 10px;
  border: 1px solid var(--el-border-color);
  text-align: left;
  white-space: nowrap;
}

.markdown-body :deep(th) {
  background: color-mix(in srgb, var(--el-fill-color) 70%, transparent);
  font-weight: 650;
}

.loading-dots,
.typing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 100%;
}

.typing {
  justify-content: flex-start;
  min-height: auto;
  padding-top: 4px;
}

.loading-dots i,
.typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-secondary);
  animation: dot 1s infinite;
}

.loading-dots i:nth-child(2),
.typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.loading-dots i:nth-child(3),
.typing i:nth-child(3) {
  animation-delay: 0.3s;
}

.message-status {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.message-status.error {
  color: var(--el-color-danger);
}

.composer-wrap {
  padding: 0 clamp(18px, 5vw, 70px) 24px;
}

.archived-notice {
  width: min(100%, 800px);
  margin: 0 auto 8px;
  color: var(--muted);
  font-size: 12px;
  text-align: center;
}

.composer {
  width: min(100%, 800px);
  margin: 0 auto;
  padding: 11px 13px 9px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
}

.composer:focus-within {
  border-color: var(--el-color-primary-light-5);
  box-shadow:
    0 8px 24px rgb(15 23 42 / 8%),
    0 0 0 3px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.composer.disabled {
  opacity: 0.78;
}

.composer :deep(.el-textarea__inner) {
  padding: 2px 2px 8px;
  color: var(--el-text-color-primary);
  border: 0;
  box-shadow: none;
  background: transparent;
  font-size: 14px;
  line-height: 1.6;
}

.composer > div:last-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

.composer .el-button {
  width: 30px;
  height: 30px;
}

@keyframes dot {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 700px) {
  .ai-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    max-height: 220px;
    padding: 12px;
  }

  .sidebar-brand {
    padding-bottom: 12px;
  }

  .list-heading {
    margin: 12px 7px 4px;
  }

  .message-scroll {
    padding-top: 24px;
  }

  .bubble {
    max-width: 86%;
  }

  .composer-wrap {
    padding: 0 12px 12px;
  }

  .composer > div:last-child span {
    font-size: 9px;
  }
}
</style>
