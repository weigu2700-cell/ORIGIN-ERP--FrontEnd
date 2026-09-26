import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendMessageStream } from '@/api/ai/ai'

vi.mock('@/utils/auth', () => ({
  getToken: vi.fn(() => 'test-token'),
}))

describe('sendMessageStream', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('将非 200 响应体中的后端消息传给调用方并抛出异常', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 404, msg: '对话不存在' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    const onError = vi.fn()

    await expect(
      sendMessageStream({ conversationId: '1', message: '你好' }, { onChunk: vi.fn(), onError }),
    ).rejects.toThrow('对话不存在')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: '对话不存在' }))
  })

  it('200 响应没有 body 时回调并抛出流式响应错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })))
    const onError = vi.fn()

    await expect(
      sendMessageStream({ conversationId: '1', message: '你好' }, { onChunk: vi.fn(), onError }),
    ).rejects.toThrow('流式响应失败')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: '流式响应失败' }))
  })

  it('将待确认 ACTION 事件交给界面处理，而不是当作未知流类型报错', async () => {
    const action = {
      token: '0123456789abcdef0123456789abcdef',
      actionType: 'APPROVE_PURCHASE_ORDER',
      bizNo: 'PO-001',
      title: '审批采购订单 PO-001',
      description: '确认后将审批采购订单 PO-001，并自动生成采购入库单。',
      expireTime: '2026-09-23T12:00:00',
    }
    const event = `data: ${JSON.stringify({ type: 'ACTION', content: JSON.stringify(action) })}\n\n`
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(event, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })),
    )
    const onChunk = vi.fn()

    await sendMessageStream({ conversationId: '1', message: '审批订单' }, { onChunk })

    expect(onChunk).toHaveBeenCalledWith({ type: 'ACTION', content: JSON.stringify(action) })
  })
})
