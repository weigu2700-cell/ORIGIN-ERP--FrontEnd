import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AiWorkspace from '@/views/ai/index.vue'
import { archiveConversation, getConversationList, getMessageList } from '@/api/ai/ai'
import { ElMessageBox } from 'element-plus'

vi.mock('@/api/ai/ai', () => ({
  addConversation: vi.fn(),
  archiveConversation: vi.fn(),
  getConversationList: vi.fn(),
  getMessageList: vi.fn(),
  sendMessage: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn() },
  ElMessageBox: { confirm: vi.fn() },
}))

const conversation = {
  id: '9007199254740993',
  title: '库存查询',
  status: 0 as const,
  createTime: '2026-09-20 10:00:00',
  updateTime: '2026-09-20 10:00:00',
}

describe('AI 会话归档', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getConversationList)
      .mockResolvedValueOnce([{ ...conversation }])
      .mockResolvedValue([{ ...conversation, status: 1 }])
    vi.mocked(getMessageList).mockResolvedValue([])
    vi.mocked(archiveConversation).mockResolvedValue({ conversationId: conversation.id })
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(undefined as never)
  })

  it('确认后归档会话，并在已归档分组保留可查看的记录', async () => {
    const wrapper = mount(AiWorkspace)
    await flushPromises()

    await wrapper.get('.archive-button').trigger('click')
    await flushPromises()

    expect(ElMessageBox.confirm).toHaveBeenCalled()
    expect(archiveConversation).toHaveBeenCalledWith(conversation.id)
    expect(wrapper.find('.conversation-group.archived-group').text()).toContain('库存查询')
    expect(wrapper.find('.conversation-group:not(.archived-group)').exists()).toBe(false)
  })
})
