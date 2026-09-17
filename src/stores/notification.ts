import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getPageNotification, getUnreadCount, remarkAllRead, remarkRead } from '@/api/eip/notification'
import type { NotificationItem } from '@/types/eip/notification'

const RECENT_LIMIT = 6

const useNotificationStore = defineStore('notification', () => {
  const notificationList = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const revision = ref(0)

  const hasUnread = computed(() => unreadCount.value > 0)
  const badgeText = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))

  async function fetchUnreadCount() {
    unreadCount.value = Math.max(0, Number(await getUnreadCount()) || 0)
  }

  async function fetchRecent() {
    loading.value = true
    try {
      const result = await getPageNotification({ pageNum: 1, pageSize: RECENT_LIMIT, isRead: null })
      notificationList.value = result.records.slice(0, RECENT_LIMIT)
    } finally {
      loading.value = false
    }
  }

  async function initialize() {
    await Promise.all([fetchUnreadCount(), fetchRecent()])
  }

  function receiveNotification(item: NotificationItem) {
    const notification = { ...item, id: String(item.id) }
    if (notificationList.value.some((current) => current.id === notification.id)) return false

    notificationList.value = [notification, ...notificationList.value].slice(0, RECENT_LIMIT)
    if (!notification.isRead) unreadCount.value += 1
    revision.value += 1
    return true
  }

  async function markOneRead(notificationId: string) {
    const id = String(notificationId)
    await remarkRead(id)
    notificationList.value = notificationList.value.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  async function markAllRead() {
    await remarkAllRead()
    notificationList.value = notificationList.value.map((item) => ({ ...item, isRead: true }))
    unreadCount.value = 0
  }

  function reset() {
    notificationList.value = []
    unreadCount.value = 0
    loading.value = false
  }

  return {
    notificationList,
    unreadCount,
    loading,
    revision,
    hasUnread,
    badgeText,
    initialize,
    receiveNotification,
    markOneRead,
    markAllRead,
    reset,
  }
})

export default useNotificationStore
