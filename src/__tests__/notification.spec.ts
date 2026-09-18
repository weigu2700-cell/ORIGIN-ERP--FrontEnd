import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import NotificationCenter from '@/views/eip/notification/notificationList/index.vue'
import { getPageNotification } from '@/api/eip/notification'

vi.mock('@/api/eip/notification', () => ({
  getPageNotification: vi.fn<(...args: unknown[]) => unknown>(),
}))

const notificationStore = reactive({
  notificationList: [],
  unreadCount: 2,
  revision: 0,
  hasUnread: true,
  markOneRead: vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue(undefined),
  markAllRead: vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue(undefined),
})

vi.mock('@/stores/notification', () => ({
  default: vi.fn<() => typeof notificationStore>(() => notificationStore),
}))

const records = [
  {
    id: '1',
    type: 1,
    title: '订单已确认',
    content: '销售订单 SO-001 已确认。',
    businessNo: 'SO-001',
    isRead: false,
    createTime: '2026-09-17T08:00:00',
  },
  {
    id: '2',
    type: 0,
    title: '欢迎使用',
    content: '系统通知',
    isRead: true,
    createTime: '2026-09-16T08:00:00',
  },
]

const page = (items = records, total = items.length) => ({ records: items, total, size: 10, current: 1, pages: 1 })

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notificationStore.unreadCount = 2
    notificationStore.hasUnread = true
    notificationStore.revision = 0
    vi.mocked(getPageNotification).mockResolvedValue(page())
  })

  it('加载首页并在全部、未读、已读筛选间切换', async () => {
    const wrapper = mount(NotificationCenter)
    await flushPromises()

    expect(getPageNotification).toHaveBeenCalledWith({ pageNum: 1, pageSize: 10, isRead: null })
    expect(wrapper.text()).toContain('订单已确认')
    expect(wrapper.text()).toContain('2 条未读')

    await wrapper.get('.filter-tab:nth-child(2)').trigger('click')
    await flushPromises()
    expect(getPageNotification).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 10, isRead: false })

    await wrapper.get('.filter-tab:nth-child(3)').trigger('click')
    await flushPromises()
    expect(getPageNotification).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 10, isRead: true })
  })

  it('通过本地分页切换页码和每页条数', async () => {
    vi.mocked(getPageNotification).mockResolvedValue(page(records, 25))
    const wrapper = mount(NotificationCenter)
    await flushPromises()

    const pageButtons = wrapper.findAll('.pg-btn')
    await pageButtons.find((button) => button.text() === '2')?.trigger('click')
    await flushPromises()
    expect(getPageNotification).toHaveBeenLastCalledWith({ pageNum: 2, pageSize: 10, isRead: null })

    await wrapper.get('.pg-size').setValue('20')
    await flushPromises()
    expect(getPageNotification).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 20, isRead: null })
  })

  it('标记单条或全部通知为已读并刷新当前页', async () => {
    const wrapper = mount(NotificationCenter)
    await flushPromises()
    const initialCalls = vi.mocked(getPageNotification).mock.calls.length

    await wrapper.get('.notification-status el-button').trigger('click')
    await flushPromises()
    expect(notificationStore.markOneRead).toHaveBeenCalledWith('1')
    expect(vi.mocked(getPageNotification).mock.calls.length).toBeGreaterThan(initialCalls)

    const allRead = wrapper.findAll('el-button').find((button) => button.text().includes('全部已读'))
    await allRead?.trigger('click')
    await flushPromises()
    expect(notificationStore.markAllRead).toHaveBeenCalledTimes(1)
  })
})
