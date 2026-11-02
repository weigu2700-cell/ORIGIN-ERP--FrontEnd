import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, nextTick, type VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { ElNotification, type NotificationOptions } from 'element-plus'
import useNotificationStore from '@/stores/notification'
import { connectWebSocket, disconnectWebSocket } from '@/utils/websocket'
import { setToken } from '@/utils/auth'

vi.mock('element-plus', () => ({ ElNotification: vi.fn() }))
vi.mock('@/api/eip/notification', () => ({
  getPageNotification: vi.fn().mockResolvedValue({ records: [] }),
  getUnreadCount: vi.fn().mockResolvedValue(0),
  remarkRead: vi.fn(),
  remarkAllRead: vi.fn(),
}))

class FakeWebSocket {
  static OPEN = 1
  static CONNECTING = 0
  static instances: FakeWebSocket[] = []
  readyState = FakeWebSocket.CONNECTING
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: (() => void) | null = null
  close = vi.fn(() => this.onclose?.())

  constructor(_url: string) {
    FakeWebSocket.instances.push(this)
  }

  receive(id: string) {
    this.onmessage?.({
      data: JSON.stringify({
        id,
        type: 3,
        title: `待审批采购订单 ${id}`,
        content: '',
        isRead: false,
        createTime: '2026-11-02T10:00:00',
      }),
    } as MessageEvent)
  }
}

const toasts: { options: NotificationOptions; close: () => void }[] = []

const latestSocket = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1]!

// Render the actual message callback so the count must update reactively.
const renderToast = (options: NotificationOptions) =>
  mount(
    defineComponent({
      setup: () => () => (options.message as () => VNode)(),
    }),
  )

describe('WebSocket notification bursts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    localStorage.clear()
    setToken('test-token')
    toasts.length = 0
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.mocked(ElNotification).mockImplementation((params) => {
      const options = params as NotificationOptions
      const close = vi.fn(() => options.onClose?.({} as VNode))
      toasts.push({ options, close })
      return { close }
    })
  })

  afterEach(() => {
    disconnectWebSocket()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('24 different task notifications produce one live summary and 24 unread items', async () => {
    connectWebSocket()
    latestSocket().receive('1')
    const wrapper = renderToast(toasts[0]!.options)
    expect(wrapper.text()).toContain('待审批采购订单 1')

    for (let id = 2; id <= 24; id++) latestSocket().receive(String(id))
    await nextTick()

    expect(ElNotification).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toBe('收到 24 条新通知，请在通知中心查看')
    const store = useNotificationStore()
    expect(store.unreadCount).toBe(24)
    expect(store.seenIds).toHaveLength(24)
    expect(store.notificationList.map((item) => item.id)).toEqual(['24', '23', '22', '21', '20', '19'])
    wrapper.unmount()
  })

  it('repeated IDs do not increase the toast or unread count', () => {
    connectWebSocket()
    latestSocket().receive('1')
    latestSocket().receive('1')
    const wrapper = renderToast(toasts[0]!.options)
    expect(wrapper.text()).toContain('待审批采购订单 1')
    expect(useNotificationStore().unreadCount).toBe(1)
    expect(ElNotification).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('a new notification after closing the summary starts a new count', () => {
    connectWebSocket()
    latestSocket().receive('1')
    toasts[0]!.close()
    latestSocket().receive('2')
    expect(ElNotification).toHaveBeenCalledTimes(2)
    const wrapper = renderToast(toasts[1]!.options)
    expect(wrapper.text()).toBe('待审批采购订单 2')
    wrapper.unmount()
  })

  it('disconnect closes the popup and ignores the old connection after account change', () => {
    connectWebSocket()
    const oldSocket = latestSocket()
    oldSocket.receive('1')
    disconnectWebSocket()
    expect(toasts[0]!.close).toHaveBeenCalledOnce()
    useNotificationStore().reset()
    setToken('another-account')
    connectWebSocket()
    oldSocket.receive('stale')
    latestSocket().receive('2')
    expect(useNotificationStore().unreadCount).toBe(1)
    expect(ElNotification).toHaveBeenCalledTimes(2)
    const wrapper = renderToast(toasts[1]!.options)
    expect(wrapper.text()).toBe('待审批采购订单 2')
    wrapper.unmount()
  })

  it('repeated connect calls keep one connection and invalid messages do not show a popup', () => {
    connectWebSocket()
    connectWebSocket()
    expect(FakeWebSocket.instances).toHaveLength(1)
    latestSocket().onmessage?.({ data: '{}' } as MessageEvent)
    expect(ElNotification).not.toHaveBeenCalled()
    expect(useNotificationStore().unreadCount).toBe(0)
  })
})
