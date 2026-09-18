import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import useNotificationStore from '@/stores/notification'
import { getPageNotification, getUnreadCount, remarkAllRead, remarkRead } from '@/api/eip/notification'
import type { NotificationItem } from '@/types/eip/notification'

vi.mock('@/api/eip/notification', () => ({
  getPageNotification: vi.fn(),
  getUnreadCount: vi.fn(),
  remarkRead: vi.fn(),
  remarkAllRead: vi.fn(),
}))

const createNotification = (id: string, isRead = false): NotificationItem => ({
  id,
  type: 1,
  title: `通知 ${id}`,
  content: `通知内容 ${id}`,
  isRead,
  createTime: '2026-09-17T08:00:00',
})

describe('notification store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(getUnreadCount).mockResolvedValue(0)
    vi.mocked(getPageNotification).mockResolvedValue({
      records: [],
      total: 0,
      size: 6,
      current: 1,
      pages: 0,
    })
    vi.mocked(remarkRead).mockResolvedValue(undefined)
    vi.mocked(remarkAllRead).mockResolvedValue(undefined)
  })

  it('去重 WebSocket 消息并仅保留最近六条', () => {
    const store = useNotificationStore()

    for (let index = 1; index <= 7; index += 1) {
      expect(store.receiveNotification(createNotification(String(index)))).toBe(true)
    }
    expect(store.receiveNotification(createNotification('7'))).toBe(false)

    expect(store.notificationList).toHaveLength(6)
    expect(store.notificationList.map((item) => item.id)).toEqual(['7', '6', '5', '4', '3', '2'])
    expect(store.unreadCount).toBe(7)
    expect(store.revision).toBe(7)
  })

  it('标记通知已读后更新本地未读数', async () => {
    const store = useNotificationStore()
    store.receiveNotification(createNotification('9007199254740993'))
    store.unreadCount = 125
    expect(store.badgeText).toBe('99+')

    await store.markOneRead('9007199254740993')

    expect(remarkRead).toHaveBeenCalledWith('9007199254740993')
    expect(store.notificationList[0]?.isRead).toBe(true)
    expect(store.unreadCount).toBe(124)
  })

  it('重置时清除用户通知状态', () => {
    const store = useNotificationStore()
    store.receiveNotification(createNotification('1'))

    store.reset()

    expect(store.notificationList).toEqual([])
    expect(store.unreadCount).toBe(0)
  })
})
