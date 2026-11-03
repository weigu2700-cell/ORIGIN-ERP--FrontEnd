import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/im', async () => {
  const mock = await vi.importActual<typeof import('@/api/im/mock')>('@/api/im/mock')
  return { imApi: mock.createMockImApi(0), imMockEnabled: true, mockUserId: mock.MOCK_ME }
})
vi.mock('@/stores/user', () => ({ useUserStore: () => ({ userInfo: { id: '80001' } }) }))

import { imApi } from '@/api/im'
import { useChatStore } from '@/stores/chat'
import { isLocalMessage, type ImEvent } from '@/types/im'

const event = (seq: number, conversationId: string, name: string): ImEvent => ({
  eventId: `ev-${seq}`,
  eventSeq: String(seq),
  type: 'CONVERSATION.UPDATED',
  conversationId,
  occurredAt: new Date().toISOString(),
  payload: { conversation: { id: conversationId, name } },
})

describe('聊天 store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('加载会话快照，静音会话不计入总未读', async () => {
    const chat = useChatStore()
    await chat.bootstrap()
    expect(chat.ready).toBe(true)
    expect(chat.list.length).toBe(4)
    expect(chat.conversations['110003']?.muted).toBe(true)
    expect(chat.unreadTotal).toBe(2)
    chat.reset()
  })

  it('进入会话读取历史并上报已读', async () => {
    const chat = useChatStore()
    await chat.bootstrap()
    await chat.open('110001')
    expect(chat.timelines['110001']?.length).toBeGreaterThan(5)
    expect(chat.conversations['110001']?.unreadCount).toBe(0)
    chat.reset()
  })

  it('发送文本：实时事件与 HTTP 响应合并为同一条，不重复', async () => {
    const chat = useChatStore()
    await chat.bootstrap()
    await chat.open('110002')
    const before = chat.timelines['110002']!.length
    const pending = chat.sendText('110002', '  下午三点见  ')
    // 实时事件可能先于 HTTP 响应到达，两者必须合并为同一条。
    await pending
    const rows = chat.timelines['110002']!
    expect(rows.length).toBe(before + 1)
    expect(rows.some(isLocalMessage)).toBe(false)
    expect(rows.filter((m) => m.text === '下午三点见')).toHaveLength(1)
    chat.reset()
  })

  it('解散的群发送失败，保留失败状态与原因', async () => {
    const chat = useChatStore()
    await chat.bootstrap()
    await chat.open('110005')
    await chat.sendText('110005', '还能发吗')
    const failed = chat.timelines['110005']!.find((m) => isLocalMessage(m) && m.local.state === 'failed')
    expect(failed).toBeTruthy()
    chat.discard('110005', failed!.id)
    expect(chat.timelines['110005']!.some(isLocalMessage)).toBe(false)
    chat.reset()
  })

  it('事件按 eventSeq 顺序处理：跳号先缓存，重复丢弃', async () => {
    const chat = useChatStore()
    await chat.bootstrap()
    const base = Number((await imApi.snapshot({})).syncEventSeq)
    chat.applyEvent(event(base + 2, '110002', '第二个'))
    expect(chat.conversations['110002']?.name).toBe('王强')
    chat.applyEvent(event(base + 1, '110002', '第一个'))
    expect(chat.conversations['110002']?.name).toBe('第二个')
    chat.applyEvent(event(base + 1, '110002', '重复'))
    expect(chat.conversations['110002']?.name).toBe('第二个')
    chat.reset()
  })

  it('文件本地预检：超限、空文件、类型不允许都不发起上传', async () => {
    const chat = useChatStore()
    await chat.bootstrap()
    const big = new File([new Uint8Array(10)], 'a.pdf')
    Object.defineProperty(big, 'size', { value: 50_000_001 })
    expect(chat.precheck(big)).toContain('上限')
    expect(chat.precheck(new File([], 'empty.pdf'))).toBe('文件为空')
    expect(chat.precheck(new File(['x'], 'tool.exe'))).toContain('.exe')
    expect(chat.precheck(new File(['x'], 'ok.xlsx'))).toBeNull()
    await expect(chat.sendFile('110001', new File(['x'], 'tool.exe'))).rejects.toThrow()
    chat.reset()
  })

  it('群管理：版本冲突时刷新并抛出，群主不能直接退群，解散后只读', async () => {
    const chat = useChatStore()
    await chat.bootstrap()
    await chat.open('110003')
    chat.conversations['110003']!.version = 1
    await expect(chat.rename('110003', '新群名')).rejects.toMatchObject({ error: 'VERSION_CONFLICT' })
    expect(chat.conversations['110003']?.version).toBe(7)
    await expect(chat.leave('110003')).rejects.toMatchObject({ error: 'OWNER_TRANSFER_REQUIRED' })
    await chat.rename('110003', '仓储协同二组')
    expect(chat.conversations['110003']?.name).toBe('仓储协同二组')
    await chat.dissolve('110003')
    expect(chat.conversations['110003']?.status).toBe('DISSOLVED')
    chat.reset()
  })

  it('被撤销的会话从列表和时间线移除，并提示', async () => {
    const chat = useChatStore()
    await chat.bootstrap()
    await chat.open('110002')
    const base = Number((await imApi.snapshot({})).syncEventSeq)
    chat.applyEvent({ ...event(base + 1, '110002', ''), type: 'CONVERSATION.REVOKED', payload: { reason: 'REMOVED' } })
    expect(chat.conversations['110002']).toBeUndefined()
    expect(chat.activeId).toBeNull()
    expect(chat.revokedNotice).toBeTruthy()
    chat.reset()
  })
})
