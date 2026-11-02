import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AiWorkspace from '@/views/ai/index.vue'
import { archiveConversation, getConversationList, getMessageList, sendMessageStream } from '@/api/ai/ai'
import { ElMessageBox } from 'element-plus'
import type { AiStreamHandlers } from '@/types/ai/ai'

vi.mock('@/api/ai/ai', () => ({
  addConversation: vi.fn(),
  archiveConversation: vi.fn(),
  getConversationList: vi.fn(),
  getMessageList: vi.fn(),
  sendMessageStream: vi.fn(),
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

describe('AI 会话定位', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getConversationList).mockResolvedValue([{ ...conversation }])
    vi.mocked(getMessageList).mockResolvedValue([
      {
        id: 'message-1',
        conversationId: conversation.id,
        role: 'assistant',
        content: '最新回复',
        createTime: conversation.createTime,
        updateTime: conversation.updateTime,
        deleted: 0,
      },
    ])
  })

  it('进入页面时在消息渲染完成后滚到最新记录', async () => {
    const wrapper = mount(AiWorkspace)
    const scroll = wrapper.get('.message-scroll').element as HTMLElement
    Object.defineProperty(scroll, 'scrollHeight', {
      get: () => (scroll.querySelector('.message') ? 600 : 0),
    })

    await flushPromises()

    expect(wrapper.get('.message').text()).toContain('最新回复')
    expect(scroll.scrollTop).toBe(600)
  })
})

describe('AI stream request ownership', () => {
  const pending: { handlers: AiStreamHandlers; signal?: AbortSignal; resolve: () => void }[] = []
  const inputStub = {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `<textarea :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    pending.length = 0
    vi.mocked(getConversationList).mockResolvedValue([
      { ...conversation },
      { ...conversation, id: 'second-conversation', title: '第二个会话' },
    ])
    vi.mocked(getMessageList).mockResolvedValue([])
    vi.mocked(sendMessageStream).mockImplementation(
      (_request, handlers, signal) => new Promise<void>((resolve) => pending.push({ handlers, signal, resolve })),
    )
  })

  it('旧会话延迟结束不能清除新会话的发送状态或触发旧操作确认', async () => {
    const wrapper = mount(AiWorkspace, { global: { stubs: { 'el-input': inputStub } } })
    await flushPromises()
    await wrapper.get('textarea').setValue('第一个请求')
    await wrapper.get('[aria-label="发送消息"]').trigger('click')
    await flushPromises()
    expect(pending).toHaveLength(1)

    await wrapper.findAll('.conversation')[1]!.trigger('click')
    await flushPromises()
    expect(pending[0]!.signal!.aborted).toBe(true)
    await wrapper.get('textarea').setValue('第二个请求')
    await wrapper.get('[aria-label="发送消息"]').trigger('click')
    await flushPromises()
    expect(pending).toHaveLength(2)

    pending[0]!.handlers.onChunk({
      type: 'ACTION',
      content: JSON.stringify({
        token: 'old-token',
        title: '旧操作',
        description: '不应弹出',
      }),
    })
    pending[0]!.resolve()
    await flushPromises()
    expect(ElMessageBox.confirm).not.toHaveBeenCalled()
    expect(wrapper.find('[aria-label="停止生成"]').exists()).toBe(true)

    pending[1]!.handlers.onChunk({ type: 'CONTENT', content: '新会话的回复' })
    await flushPromises()
    expect(wrapper.text()).toContain('新会话的回复')
    await wrapper.get('[aria-label="停止生成"]').trigger('click')
    expect(pending[1]!.signal!.aborted).toBe(true)
    expect(wrapper.text()).toContain('已停止生成')
    pending[1]!.resolve()
    await flushPromises()
    wrapper.unmount()
  })

  it('停止后重发同一会话时忽略旧请求的后续内容和收尾', async () => {
    const wrapper = mount(AiWorkspace, { global: { stubs: { 'el-input': inputStub } } })
    await flushPromises()
    await wrapper.get('textarea').setValue('先查询')
    await wrapper.get('[aria-label="发送消息"]').trigger('click')
    await flushPromises()
    await wrapper.get('[aria-label="停止生成"]').trigger('click')
    await wrapper.get('textarea').setValue('重新查询')
    await wrapper.get('[aria-label="发送消息"]').trigger('click')
    await flushPromises()
    pending[0]!.handlers.onChunk({ type: 'CONTENT', content: '过期回复' })
    pending[0]!.resolve()
    await flushPromises()
    expect(wrapper.text()).not.toContain('过期回复')
    expect(wrapper.find('[aria-label="停止生成"]').exists()).toBe(true)
    pending[1]!.resolve()
    await flushPromises()
    wrapper.unmount()
  })
})
