import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { imApi } from '@/api/im'
import { createChatSocket } from '@/utils/chatSocket'
import { uuid } from '@/utils/uuid'
import { useUserStore } from '@/stores/user'
import {
  isLocalMessage,
  type ChatMessage,
  type ConnectionState,
  type Contact,
  type Conversation,
  type GroupMember,
  type ImConfig,
  type ImEvent,
  type LocalMessage,
  type TimelineItem,
} from '@/types/im'

const PAGE = 30
const SEEN_LIMIT = 400

/** seq/eventSeq 是十进制字符串，按 BigInt 比较，避免浮点或字典序错误。 */
export const cmpSeq = (a: string, b: string) => {
  const x = BigInt(a || '0')
  const y = BigInt(b || '0')
  return x === y ? 0 : x > y ? 1 : -1
}

export interface ImError extends Error {
  code?: number
  error?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function sha256Hex(file: File) {
  // crypto.subtle 同样只在安全上下文可用；拿不到真实校验值就不能上传，不能用假值糊弄服务端。
  if (!crypto.subtle) throw new Error('当前页面地址不是安全上下文（需要 HTTPS 或 localhost），无法上传文件')
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

const isImageFile = (file: File) =>
  file.type.startsWith('image/') && ['jpg', 'jpeg', 'png', 'webp'].includes(extensionOf(file.name))

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Record<string, Conversation>>({})
  const timelines = ref<Record<string, TimelineItem[]>>({})
  const hasOlder = ref<Record<string, boolean>>({})
  const members = ref<Record<string, GroupMember[]>>({})
  const contactCache = ref<Record<string, Contact>>({})
  const activeId = ref<string | null>(null)
  const connection = ref<ConnectionState>('idle')
  const config = ref<ImConfig | null>(null)
  const ready = ref(false)
  const disabledReason = ref<string | null>(null)
  const snapshotUnread = ref(0)
  const revokedNotice = ref<string | null>(null)
  /** 实时连接长时间未建立：已改为定时 REST 补拉，界面提示原因而不是一直显示“重新连接”。 */
  const degraded = ref(false)
  let fallbackTimer: ReturnType<typeof setInterval> | null = null

  let cursor = '0'
  let session = 0
  let unsubscribe: (() => void) | null = null
  let socket: ReturnType<typeof createChatSocket> | null = null
  let syncing: Promise<void> | null = null
  const seen: string[] = []
  const buffer = new Map<string, ImEvent>()
  const uploadAborts = new Map<string, AbortController>()

  const myId = computed(() => useUserStore().userInfo.id ?? '')
  const list = computed(() =>
    Object.values(conversations.value).sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt ?? b.updatedAt).getTime() -
        new Date(a.lastMessage?.createdAt ?? a.updatedAt).getTime(),
    ),
  )
  const active = computed(() => (activeId.value ? (conversations.value[activeId.value] ?? null) : null))
  const unreadTotal = computed(() => {
    if (!ready.value) return snapshotUnread.value
    return list.value.filter((c) => !c.muted).reduce((n, c) => n + c.unreadCount, 0)
  })
  const nameOf = (userId: string | null | undefined) =>
    !userId ? '系统' : userId === myId.value ? '我' : (contactCache.value[userId]?.displayName ?? '同事')

  function remember(contactsToAdd: Contact[]) {
    for (const c of contactsToAdd) contactCache.value[c.userId] = c
  }

  function upsert(conv: Conversation) {
    const old = conversations.value[conv.id]
    // 版本较旧的快照不覆盖较新的本地状态。
    if (old && conv.version < old.version && conv.type === 'GROUP') return
    conversations.value[conv.id] = { ...old, ...conv }
  }

  function sortedMerge(id: string, incoming: ChatMessage[]) {
    const current = timelines.value[id] ?? []
    const server = current.filter((m): m is ChatMessage => !isLocalMessage(m))
    const locals = current.filter(isLocalMessage)
    const byId = new Map(server.map((m) => [m.id, m]))
    for (const m of incoming) byId.set(m.id, m)
    const clientIds = new Set(incoming.map((m) => m.clientMessageId))
    const merged = [...byId.values()].sort((a, b) => cmpSeq(a.seq, b.seq))
    // 已被服务端确认的本地待发消息从时间线中去掉。
    timelines.value[id] = [...merged, ...locals.filter((l) => !clientIds.has(l.clientMessageId))]
  }

  // —— 初始化与实时 ——
  async function bootstrap() {
    const mine = ++session
    try {
      disabledReason.value = null
      config.value = await imApi.config()
      let snap = await imApi.snapshot({ limit: 100 })
      const all = [...snap.records]
      while (snap.hasMore && snap.nextCursor) {
        snap = await imApi.snapshot({ snapshotToken: snap.snapshotToken, cursor: snap.nextCursor, limit: 100 })
        all.push(...snap.records)
      }
      if (mine !== session) return
      conversations.value = Object.fromEntries(all.map((c) => [c.id, c]))
      snapshotUnread.value = snap.totalUnreadCount
      cursor = snap.syncEventSeq
      ready.value = true
      await loadPeers()
      startRealtime(mine)
    } catch (error) {
      if (mine !== session) return
      const e = error as ImError
      disabledReason.value =
        e.error === 'IM_NOT_ENABLED' || e.code === 403
          ? '聊天功能尚未对你开放，请联系管理员'
          : (e.message ?? '聊天暂时不可用')
    }
  }

  async function loadPeers() {
    // 单聊展示对方姓名；先用联系人缓存补全头像与部门。
    try {
      remember((await imApi.contacts({ limit: 100 })).records)
    } catch {
      /* 联系人失败不影响会话 */
    }
  }

  function startRealtime(mine: number) {
    stopRealtime()
    if (imApi.subscribe) {
      connection.value = 'online'
      unsubscribe = imApi.subscribe((event) => mine === session && applyEvent(event))
      return
    }
    socket = createChatSocket(imApi, {
      onState: (state) => {
        if (mine !== session) return
        connection.value = state
        if (state === 'online') degraded.value = false
      },
      onReady: () => mine === session && void sync(),
      onEvent: (event) => mine === session && applyEvent(event),
      onTerminated: () => undefined,
    })
    socket.start()
    // 前台每 30 秒检查：WebSocket 没连上时仍用 REST 补拉事件，保证消息最终可见。
    fallbackTimer = setInterval(() => {
      if (mine !== session || connection.value === 'online') return
      degraded.value = true
      void sync()
    }, 30_000)
  }

  function stopRealtime() {
    if (fallbackTimer) clearInterval(fallbackTimer)
    fallbackTimer = null
    degraded.value = false
    unsubscribe?.()
    unsubscribe = null
    socket?.stop()
    socket = null
  }

  function remembered(id: string) {
    if (seen.includes(id)) return true
    seen.push(id)
    if (seen.length > SEEN_LIMIT) seen.splice(0, seen.length - SEEN_LIMIT)
    return false
  }

  /** 按 eventSeq 顺序推进：有缺口先缓存，再补拉，不直接把游标设成收到的最大值。 */
  function applyEvent(event: ImEvent) {
    if (cmpSeq(event.eventSeq, cursor) <= 0 || remembered(event.eventId)) return
    if (cmpSeq(event.eventSeq, String(BigInt(cursor) + 1n)) > 0) {
      buffer.set(event.eventSeq, event)
      void sync()
      return
    }
    handle(event)
    cursor = event.eventSeq
    drain()
  }

  function drain() {
    for (;;) {
      const next = buffer.get(String(BigInt(cursor) + 1n))
      if (!next) return
      buffer.delete(next.eventSeq)
      handle(next)
      cursor = next.eventSeq
    }
  }

  function sync() {
    if (syncing) return syncing
    const mine = session
    syncing = (async () => {
      try {
        for (;;) {
          const page = await imApi.syncEvents(cursor)
          if (mine !== session) return
          for (const e of page.records) {
            if (cmpSeq(e.eventSeq, cursor) <= 0 || remembered(e.eventId)) continue
            handle(e)
            cursor = e.eventSeq
          }
          drain()
          if (!page.hasMore) return
        }
      } catch (error) {
        if ((error as ImError).code === 410) await bootstrap()
      } finally {
        syncing = null
      }
    })()
    return syncing
  }

  function handle(event: ImEvent) {
    const id = event.conversationId ?? undefined
    const payload = event.payload as Record<string, unknown>
    switch (event.type) {
      case 'MESSAGE.CREATED': {
        const message = payload.message as ChatMessage
        if (!message || !id) return
        if (conversations.value[id] && timelines.value[id]) sortedMerge(id, [message])
        if (!conversations.value[id])
          void imApi
            .conversation(id)
            .then(upsert)
            .catch(() => undefined)
        if (id === activeId.value && message.senderId !== myId.value) void markRead(id)
        return
      }
      case 'CONVERSATION.UPDATED': {
        const conv = payload.conversation as Conversation | undefined
        if (conv) {
          upsert(conv)
          // 正在查看的会话收到新消息后，快照里的未读数会把已读结果覆盖，需要再次上报。
          if (conv.id === activeId.value && (conversations.value[conv.id]?.unreadCount ?? 0) > 0) void markRead(conv.id)
        }
        return
      }
      case 'MEMBER.CHANGED':
        if (id) {
          delete members.value[id]
          if (id === activeId.value) void loadMembers(id)
        }
        return
      case 'CONVERSATION.REVOKED':
        if (id) {
          delete conversations.value[id]
          delete timelines.value[id]
          delete members.value[id]
          if (activeId.value === id) {
            activeId.value = null
            revokedNotice.value = '你已不在该会话中'
          }
        }
        return
      case 'READ.UPDATED': {
        const conv = id ? conversations.value[id] : undefined
        if (conv) {
          conv.lastReadSeq = String(payload.lastReadSeq ?? conv.lastReadSeq)
          conv.unreadCount = Number(payload.unreadCount ?? 0)
        }
        return
      }
      default:
        return
    }
  }

  // —— 会话与历史 ——
  async function open(id: string) {
    activeId.value = id
    revokedNotice.value = null
    if (!timelines.value[id]) {
      const page = await imApi.history(id, { limit: PAGE })
      sortedMerge(id, page.records)
      hasOlder.value[id] = page.hasMore
    }
    if (conversations.value[id]?.type === 'GROUP') void loadMembers(id)
    await markRead(id)
  }

  async function loadOlder(id: string) {
    const first = (timelines.value[id] ?? []).find((m): m is ChatMessage => !isLocalMessage(m))
    if (!first || !hasOlder.value[id]) return
    const page = await imApi.history(id, { beforeSeq: first.seq, limit: PAGE })
    sortedMerge(id, page.records)
    hasOlder.value[id] = page.hasMore
  }

  async function markRead(id: string) {
    const conv = conversations.value[id]
    if (!conv || conv.unreadCount === 0 || document.visibilityState === 'hidden') return
    const through = conv.lastSeq
    const result = await imApi.markRead(id, through).catch(() => null)
    if (result) {
      conv.lastReadSeq = result.lastReadSeq
      conv.unreadCount = result.unreadCount
    }
  }

  async function loadMembers(id: string) {
    const page = await imApi.members(id, {})
    members.value[id] = page.records
    remember(page.records)
    const conv = conversations.value[id]
    if (conv && page.groupVersion > conv.version) conv.version = page.groupVersion
  }

  // —— 发送 ——
  const localId = () => `local-${uuid()}`

  const patchLocal = (id: string, key: string, patch: Partial<LocalMessage>) => {
    const row = (timelines.value[id] ?? []).find((m) => isLocalMessage(m) && m.id === key) as LocalMessage | undefined
    if (row) Object.assign(row, patch)
  }

  const dropLocal = (id: string, key: string) => {
    timelines.value[id] = (timelines.value[id] ?? []).filter((m) => !(isLocalMessage(m) && m.id === key))
  }

  function pushLocal(id: string, init: Partial<LocalMessage>) {
    const local: LocalMessage = {
      id: localId(),
      seq: null,
      conversationId: id,
      senderId: myId.value,
      clientMessageId: uuid(),
      type: 'TEXT',
      text: null,
      file: null,
      system: null,
      createdAt: new Date().toISOString(),
      local: { state: 'sending' },
      ...init,
    }
    ;(timelines.value[id] ??= []).push(local)
    return timelines.value[id]!.find((m) => m.id === local.id) as LocalMessage
  }

  async function deliver(
    local: LocalMessage,
    body: { type: 'TEXT' | 'IMAGE' | 'FILE'; text?: string; fileId?: string },
  ) {
    const id = local.conversationId
    patchLocal(id, local.id, { local: { state: 'sending' } })
    try {
      const result = await imApi.sendMessage(id, { clientMessageId: local.clientMessageId, ...body })
      dropLocal(id, local.id)
      sortedMerge(id, [result.message])
      const conv = conversations.value[id]
      if (conv && cmpSeq(result.message.seq, conv.lastSeq) >= 0) {
        conv.lastSeq = result.message.seq
        conv.lastMessage = result.message
      }
    } catch (error) {
      const e = error as ImError
      // 结果未知（网络/超时）：先用原 clientMessageId 回查，未查到才标记失败待用户重试。
      if (!e.code) {
        const found = await imApi.messageByClientId(local.clientMessageId).catch(() => null)
        if (found) {
          dropLocal(id, local.id)
          sortedMerge(id, [found])
          return
        }
      }
      patchLocal(id, local.id, { local: { state: 'failed', reason: e.message } })
    }
  }

  function sendText(id: string, text: string) {
    const trimmed = text.trim()
    if (!trimmed) return Promise.resolve()
    const local = pushLocal(id, { text: trimmed })
    return deliver(local, { type: 'TEXT', text: trimmed })
  }

  function retry(id: string, key: string) {
    const local = (timelines.value[id] ?? []).find((m): m is LocalMessage => isLocalMessage(m) && m.id === key)
    if (!local || local.local.state !== 'failed') return Promise.resolve()
    if (local.type === 'TEXT') return deliver(local, { type: 'TEXT', text: local.text ?? '' })
    return Promise.resolve()
  }

  function discard(id: string, key: string) {
    dropLocal(id, key)
  }

  /** 返回错误文案表示未发起上传（本地预检失败）。 */
  function precheck(file: File): string | null {
    const cfg = config.value
    if (cfg && file.size > cfg.maxFileBytes) return `文件超过 ${Math.round(cfg.maxFileBytes / 1_000_000)} MB 上限`
    if (file.size === 0) return '文件为空'
    if (cfg && !cfg.allowedExtensions.includes(extensionOf(file.name)))
      return `不支持 .${extensionOf(file.name)} 类型的文件`
    return null
  }

  async function sendFile(id: string, file: File) {
    const problem = precheck(file)
    if (problem) throw Object.assign(new Error(problem), { code: 0 })
    const image = isImageFile(file)
    const local = pushLocal(id, {
      type: image ? 'IMAGE' : 'FILE',
      file: { id: '', name: file.name, size: file.size, mime: file.type || 'application/octet-stream' },
      local: { state: 'uploading', progress: 0 },
    })
    const controller = new AbortController()
    uploadAborts.set(local.id, controller)
    try {
      const reservation = await imApi.reserveUpload({
        clientUploadId: uuid(),
        conversationId: id,
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        sha256: await sha256Hex(file),
      })
      patchLocal(id, local.id, { uploadId: reservation.uploadId })
      await imApi.putFile(
        reservation,
        file,
        (progress) => patchLocal(id, local.id, { local: { state: 'uploading', progress } }),
        controller.signal,
      )
      patchLocal(id, local.id, { local: { state: 'verifying' } })
      await imApi.completeUpload(reservation.uploadId)
      let status = await imApi.uploadStatus(reservation.uploadId)
      for (const wait of [2000, 5000, 10_000, 10_000, 10_000, 10_000]) {
        if (status.status !== 'VERIFYING' && status.status !== 'INITIATED') break
        await sleep(wait)
        if (controller.signal.aborted) return
        status = await imApi.uploadStatus(reservation.uploadId)
      }
      if (status.status === 'READY' && status.file) {
        await deliver(local, { type: image ? 'IMAGE' : 'FILE', fileId: status.file.id })
      } else if (status.status === 'REJECTED' || status.status === 'EXPIRED') {
        patchLocal(id, local.id, { local: { state: 'rejected', reason: status.rejectionReason ?? '文件未通过检查' } })
      } else if (status.status !== 'CANCELLED') {
        patchLocal(id, local.id, { local: { state: 'failed', reason: '检查超时，请稍后重新发送' } })
      }
    } catch (error) {
      if (controller.signal.aborted) return
      patchLocal(id, local.id, { local: { state: 'failed', reason: (error as Error).message } })
    } finally {
      uploadAborts.delete(local.id)
    }
  }

  async function cancelUpload(id: string, key: string) {
    const local = (timelines.value[id] ?? []).find((m): m is LocalMessage => isLocalMessage(m) && m.id === key)
    uploadAborts.get(key)?.abort()
    uploadAborts.delete(key)
    dropLocal(id, key)
    if (local?.uploadId) await imApi.cancelUpload(local.uploadId).catch(() => undefined)
  }

  async function download(fileId: string, name: string) {
    const blob = await imApi.downloadFile(fileId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  // —— 创建会话与群管理 ——
  async function startDirect(peerUserId: string) {
    const conv = await imApi.createDirect(peerUserId)
    upsert({ ...conv, peerUserId })
    await open(conv.id)
    return conv.id
  }

  async function createGroup(name: string, memberIds: string[]) {
    const conv = await imApi.createGroup({ clientRequestId: uuid(), name, memberIds })
    upsert(conv)
    await open(conv.id)
    return conv.id
  }

  async function groupOp(
    id: string,
    run: (version: number) => Promise<Conversation | { conversationId: string; version: number }>,
  ) {
    const conv = conversations.value[id]
    if (!conv) return
    try {
      const result = await run(conv.version)
      if ('id' in result) upsert(result)
      delete members.value[id]
      if (activeId.value === id) await loadMembers(id).catch(() => undefined)
      return result
    } catch (error) {
      if ((error as ImError).error === 'VERSION_CONFLICT') {
        await imApi
          .conversation(id)
          .then(upsert)
          .catch(() => undefined)
        await loadMembers(id).catch(() => undefined)
      }
      throw error
    }
  }

  const rename = (id: string, name: string) => groupOp(id, (v) => imApi.renameGroup(id, name, v))

  const addMembers = (id: string, ids: string[]) => groupOp(id, (v) => imApi.addMembers(id, ids, v))

  const removeMember = (id: string, userId: string) => groupOp(id, (v) => imApi.removeMember(id, userId, v))

  const setRole = (id: string, userId: string, role: 'ADMIN' | 'MEMBER') =>
    groupOp(id, (v) => imApi.setRole(id, userId, role, v))

  const transfer = (id: string, newOwnerId: string) => groupOp(id, (v) => imApi.transfer(id, newOwnerId, v))

  const dissolve = (id: string) => groupOp(id, (v) => imApi.dissolve(id, v))

  async function leave(id: string) {
    const conv = conversations.value[id]
    if (!conv) return
    await imApi.leave(id, conv.version)
    delete conversations.value[id]
    delete timelines.value[id]
    delete members.value[id]
    if (activeId.value === id) activeId.value = null
  }

  async function setMuted(id: string, muted: boolean) {
    await imApi.setPreferences(id, muted)
    const conv = conversations.value[id]
    if (conv) conv.muted = muted
  }

  function reset() {
    session += 1
    stopRealtime()
    for (const controller of uploadAborts.values()) controller.abort()
    uploadAborts.clear()
    conversations.value = {}
    timelines.value = {}
    hasOlder.value = {}
    members.value = {}
    contactCache.value = {}
    activeId.value = null
    connection.value = 'idle'
    config.value = null
    ready.value = false
    disabledReason.value = null
    snapshotUnread.value = 0
    revokedNotice.value = null
    cursor = '0'
    seen.length = 0
    buffer.clear()
    syncing = null
  }

  return {
    degraded,
    conversations,
    timelines,
    hasOlder,
    members,
    contactCache,
    activeId,
    connection,
    config,
    ready,
    disabledReason,
    revokedNotice,
    myId,
    list,
    active,
    unreadTotal,
    nameOf,
    bootstrap,
    stopRealtime,
    reset,
    applyEvent,
    sync,
    open,
    loadOlder,
    markRead,
    loadMembers,
    sendText,
    retry,
    discard,
    sendFile,
    cancelUpload,
    download,
    precheck,
    startDirect,
    createGroup,
    rename,
    addMembers,
    removeMember,
    setRole,
    transfer,
    dissolve,
    leave,
    setMuted,
  }
})
