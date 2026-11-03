import { describe, expect, it } from 'vitest'
import { cmpSeq } from '@/stores/chat'
import { buildRows, dayLabel, fmtBytes, listTime, previewOf } from '@/views/message/utils'
import type { ChatMessage, LocalMessage } from '@/types/im'

const message = (seq: string, createdAt: string, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: `m${seq}`,
  conversationId: 'c1',
  seq,
  senderId: '2',
  clientMessageId: `cm${seq}`,
  type: 'TEXT',
  text: `消息${seq}`,
  file: null,
  system: null,
  createdAt,
  ...over,
})

describe('聊天工具函数', () => {
  it('seq 按 BigInt 比较，超出安全整数范围也正确', () => {
    expect(cmpSeq('9007199254740993', '9007199254740992')).toBe(1)
    expect(cmpSeq('9', '10')).toBe(-1)
    expect(cmpSeq('5', '5')).toBe(0)
    expect(cmpSeq('', '0')).toBe(0)
  })

  it('文件大小显示', () => {
    expect(fmtBytes(512)).toBe('512 B')
    expect(fmtBytes(24_681)).toBe('25 KB')
    expect(fmtBytes(8_123_456)).toBe('8.1 MB')
  })

  it('列表时间：今天时分、昨天、同年日期、跨年完整日期', () => {
    const now = new Date(2026, 10, 3, 12, 0)
    expect(listTime(new Date(2026, 10, 3, 9, 5).toISOString(), now)).toBe('09:05')
    expect(listTime(new Date(2026, 10, 2, 23, 0).toISOString(), now)).toBe('昨天')
    expect(listTime(new Date(2026, 9, 31, 9, 0).toISOString(), now)).toBe('10月31日')
    expect(listTime(new Date(2025, 11, 31, 9, 0).toISOString(), now)).toBe('2025/12/31')
    expect(dayLabel(new Date(2026, 10, 3, 1, 0).toISOString(), now)).toBe('今天')
    expect(dayLabel(new Date(2026, 9, 30, 1, 0).toISOString(), now)).toMatch(/^10月30日 周/)
  })

  it('会话预览：群聊带发送者，图片和文件有占位', () => {
    const name = (id: string | null) => (id === '2' ? '李敏' : '系统')
    expect(previewOf(message('1', '2026-11-03T01:00:00Z'), name, true)).toBe('李敏：消息1')
    expect(previewOf(message('1', '2026-11-03T01:00:00Z'), name, false)).toBe('消息1')
    expect(previewOf(message('2', '2026-11-03T01:00:00Z', { type: 'IMAGE', text: null }), name, true)).toBe(
      '李敏：[图片]',
    )
    expect(
      previewOf(
        message('3', '2026-11-03T01:00:00Z', {
          type: 'FILE',
          text: null,
          file: { id: 'f', name: '排产.xlsx', size: 1, mime: 'x' },
        }),
        name,
        false,
      ),
    ).toBe('[文件] 排产.xlsx')
    expect(previewOf(null, name, false)).toBe('暂无消息')
  })

  it('时间线插入日期分隔，并只插入一次未读分割线', () => {
    const now = new Date(2026, 10, 3, 12, 0)
    const items = [
      message('1', new Date(2026, 10, 2, 9, 0).toISOString()),
      message('2', new Date(2026, 10, 3, 9, 0).toISOString()),
      message('3', new Date(2026, 10, 3, 9, 5).toISOString()),
    ]
    const local: LocalMessage = {
      ...message('4', new Date(2026, 10, 3, 9, 6).toISOString()),
      id: 'local-1',
      seq: null,
      local: { state: 'sending' },
    }
    const rows = buildRows([...items, local], '2', now)
    expect(rows.map((r) => r.kind)).toEqual(['day', 'message', 'day', 'unread', 'message', 'message', 'message'])
    expect(rows[0]?.label).toBe('昨天')
    expect(rows.filter((r) => r.kind === 'unread')).toHaveLength(1)
  })
})
