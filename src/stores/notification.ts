import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getPageNotification, getUnreadCount, remarkAllRead, remarkRead } from '@/api/eip/notification'
import type { NotificationItem } from '@/types/eip/notification'

const RECENT_LIMIT = 6
const SEEN_ID_LIMIT = 120

const useNotificationStore = defineStore('notification', () => {
  const notificationList = ref<NotificationItem[]>([])
  const seenIds = ref<string[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const revision = ref(0)
  let initializePromise: Promise<void> | null = null
  let sessionVersion = 0

  const hasUnread = computed(() => unreadCount.value > 0)
  const badgeText = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))

  function rememberId(id: string) {
    if (seenIds.value.includes(id)) return
    seenIds.value.push(id)
    if (seenIds.value.length > SEEN_ID_LIMIT) seenIds.value.splice(0, seenIds.value.length - SEEN_ID_LIMIT)
  }

  function normalizeNotification(value: unknown): NotificationItem | null {
    if (!value || typeof value !== 'object') return null
    const item = value as Partial<NotificationItem>
    const id =
      typeof item.id === 'string'
        ? item.id.trim()
        : typeof item.id === 'number' && Number.isFinite(item.id)
          ? String(item.id)
          : ''
    if (!id || typeof item.type !== 'number' || !Number.isInteger(item.type)) return null
    const type = item.type
    if (typeof item.isRead !== 'boolean' || typeof item.createTime !== 'string') return null
    if (!item.createTime || Number.isNaN(new Date(item.createTime.replace(' ', 'T')).getTime())) return null
    return {
      ...item,
      id,
      type,
      title: typeof item.title === 'string' ? item.title : '',
      content: typeof item.content === 'string' ? item.content : '',
      createTime: item.createTime,
    } as NotificationItem
  }

  function mergeRecent(records: unknown[], version: number) {
    if (version !== sessionVersion) return
    const merged: NotificationItem[] = []
    const ids = new Set<string>()
    for (const item of [...notificationList.value, ...records.map(normalizeNotification)]) {
      if (!item || ids.has(item.id)) continue
      ids.add(item.id)
      merged.push(item)
      rememberId(item.id)
      if (merged.length === RECENT_LIMIT) break
    }
    notificationList.value = merged
  }

  async function syncUnreadCount(version: number) {
    const baseline = unreadCount.value
    const result = await getUnreadCount()
    if (version !== sessionVersion) return
    // 保留请求期间 WebSocket/read 操作相对本地基线产生的变化。
    unreadCount.value = Math.max(0, (Number(result) || 0) + unreadCount.value - baseline)
  }

  async function syncRecent(version: number) {
    const initialIds = new Set(notificationList.value.map((item) => item.id))
    const result = await getPageNotification({ pageNum: 1, pageSize: RECENT_LIMIT, isRead: null })
    if (version !== sessionVersion) return
    const current = notificationList.value
    // 只把请求期间新收到的 WS 消息置于 REST 结果之前，避免补拉覆盖实时消息。
    const liveMessages = current.filter((item) => !initialIds.has(item.id))
    notificationList.value = []
    mergeRecent([...liveMessages, ...(result.records ?? []), ...current], version)
  }

  async function fetchUnreadCount() {
    await syncUnreadCount(sessionVersion)
  }

  async function fetchRecent() {
    await syncRecent(sessionVersion)
  }

  function initialize() {
    if (initializePromise) return initializePromise
    const version = sessionVersion
    const pending = (async () => {
      loading.value = true
      try {
        await Promise.all([syncUnreadCount(version), syncRecent(version)])
      } finally {
        if (version === sessionVersion) loading.value = false
      }
    })()
    initializePromise = pending
    pending.then(
      () => {
        if (initializePromise === pending) initializePromise = null
      },
      () => {
        if (initializePromise === pending) initializePromise = null
      },
    )
    return pending
  }

  function receiveNotification(item: unknown) {
    const notification = normalizeNotification(item)
    if (!notification || seenIds.value.includes(notification.id)) return false

    rememberId(notification.id)
    notificationList.value = [notification, ...notificationList.value].slice(0, RECENT_LIMIT)
    if (!notification.isRead) unreadCount.value += 1
    revision.value += 1
    return true
  }

  async function markOneRead(notificationId: string) {
    const id = String(notificationId)
    await remarkRead(id)
    const current = notificationList.value.find((item) => item.id === id)
    let changed = false
    notificationList.value = notificationList.value.map((item) => {
      if (item.id !== id || item.isRead) return item
      changed = true
      return { ...item, isRead: true, readTime: new Date().toISOString() }
    })
    if (changed || !current) unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  async function markAllRead() {
    await remarkAllRead()
    notificationList.value = notificationList.value.map((item) => ({ ...item, isRead: true }))
    unreadCount.value = 0
  }

  function reset() {
    sessionVersion += 1
    initializePromise = null
    notificationList.value = []
    seenIds.value = []
    unreadCount.value = 0
    loading.value = false
    revision.value = 0
  }

  return {
    notificationList,
    recent: notificationList,
    seenIds,
    unreadCount,
    loading,
    revision,
    hasUnread,
    badgeText,
    initialize,
    fetchUnreadCount,
    fetchRecent,
    receiveNotification,
    markOneRead,
    markAllRead,
    reset,
  }
})

export default useNotificationStore
