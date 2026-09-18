import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import NotificationDetail from '@/views/eip/notification/notificationDetail/detail.vue'
import { getNotificationDetail } from '@/api/eip/notification'

const back = vi.fn<(...args: unknown[]) => unknown>()
const push = vi.fn<(...args: unknown[]) => unknown>()
const markOneRead = vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue(undefined)

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '9007199254740993' } }),
  useRouter: () => ({ back, push }),
}))

vi.mock('@/api/eip/notification', () => ({
  getNotificationDetail: vi.fn<(...args: unknown[]) => unknown>(),
}))

vi.mock('@/stores/notification', () => ({
  default: () => ({ markOneRead }),
}))

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn<(...args: unknown[]) => unknown>(), error: vi.fn<(...args: unknown[]) => unknown>() },
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

  it('根据路由 ID 加载单条通知并渲染完整内容', async () => {
    const wrapper = mount(NotificationDetail)
    await flushPromises()

    expect(getNotificationDetail).toHaveBeenCalledWith('9007199254740993')
    expect(wrapper.text()).toContain('销售订单已确认')
    expect(wrapper.text()).toContain('销售订单 SO-001 已完成确认，请及时安排后续处理。')
    expect(wrapper.text()).toContain('SO-001')
    expect(wrapper.text()).toContain('未读')
  })

  it('在详情页将未读通知标记为已读', async () => {
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
