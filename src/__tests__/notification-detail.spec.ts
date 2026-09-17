import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import NotificationDetail from '@/views/eip/notification/detail.vue'
import { getNotificationDetail } from '@/api/eip/notification'

const back = vi.fn()
const push = vi.fn()
const markOneRead = vi.fn().mockResolvedValue(undefined)

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '9007199254740993' } }),
  useRouter: () => ({ back, push }),
}))

vi.mock('@/api/eip/notification', () => ({
  getNotificationDetail: vi.fn(),
}))

vi.mock('@/stores/notification', () => ({
  default: () => ({ markOneRead }),
}))

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn() },
}))

const notification = {
  id: '9007199254740993',
  type: 1,
  title: '销售订单已确认',
  content: '销售订单 SO-001 已完成确认，请及时安排后续处理。',
  businessType: 'sales_order',
  businessNo: 'SO-001',
  isRead: false,
  createTime: '2026-09-17T08:00:00',
}

describe('NotificationDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNotificationDetail).mockResolvedValue({ ...notification })
  })

  it('loads one notification by route id and renders its full content', async () => {
    const wrapper = mount(NotificationDetail)
    await flushPromises()

    expect(getNotificationDetail).toHaveBeenCalledWith('9007199254740993')
    expect(wrapper.text()).toContain('销售订单已确认')
    expect(wrapper.text()).toContain('销售订单 SO-001 已完成确认，请及时安排后续处理。')
    expect(wrapper.text()).toContain('SO-001')
    expect(wrapper.text()).toContain('未读')
  })

  it('marks an unread notification as read from the detail page', async () => {
    const wrapper = mount(NotificationDetail)
    await flushPromises()

    const markReadButton = wrapper.findAll('el-button').find((button) => button.text().includes('标记已读'))
    await markReadButton?.trigger('click')
    await flushPromises()

    expect(markOneRead).toHaveBeenCalledWith('9007199254740993')
    expect(wrapper.text()).toContain('已读')
    expect(wrapper.text()).not.toContain('标记已读')
  })
})
