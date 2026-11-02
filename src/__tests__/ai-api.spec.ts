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

it('逐字节分片也能解析 CRLF 和多行 data，保留中文 UTF-8 内容', async () => {
  const bytes = new TextEncoder().encode(
    ': heartbeat\r\ndata: {"type":"CONTENT",\r\ndata: "content":"中文回复"}\r\n\r\ndata: {"type":"TITLE","content":"库存"}\r\n\r\n',
  )
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            for (const byte of bytes) controller.enqueue(new Uint8Array([byte]))
            controller.close()
          },
        }),
      ),
    ),
  )
  const onChunk = vi.fn()
  const onDone = vi.fn()
  await sendMessageStream({ conversationId: '1', message: '查询' }, { onChunk, onDone })
  expect(onChunk.mock.calls.map(([chunk]) => chunk)).toEqual([
    { type: 'CONTENT', content: '中文回复' },
    { type: 'TITLE', content: '库存' },
  ])
  expect(onDone).toHaveBeenCalledTimes(1)
})

it('ERROR 只回调一次并取消响应，不执行完成回调', async () => {
  const cancel = vi.fn()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('data: {"type":"ERROR","content":"模型不可用"}\n\n'))
          },
          cancel,
        }),
      ),
    ),
  )
  const onError = vi.fn()
  const onDone = vi.fn()
  await expect(
    sendMessageStream(
      { conversationId: '1', message: '你好' },
      {
        onChunk: vi.fn(),
        onError,
        onDone,
      },
    ),
  ).rejects.toThrow('模型不可用')
  expect(onError).toHaveBeenCalledTimes(1)
  expect(onDone).not.toHaveBeenCalled()
  expect(cancel).toHaveBeenCalledTimes(1)
})

it('[DONE] 之后不再处理事件并取消仍打开的响应', async () => {
  const cancel = vi.fn()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode('data: [DONE]\r\n\r\ndata: {"type":"CONTENT","content":"不应出现"}\r\n\r\n'),
            )
          },
          cancel,
        }),
      ),
    ),
  )
  const onChunk = vi.fn()
  await sendMessageStream({ conversationId: '1', message: '你好' }, { onChunk })
  expect(onChunk).not.toHaveBeenCalled()
  expect(cancel).toHaveBeenCalledTimes(1)
})

it('用户中断不触发通用错误回调', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('stopped', 'AbortError')))
  const onError = vi.fn()
  await expect(
    sendMessageStream(
      { conversationId: '1', message: '你好' },
      {
        onChunk: vi.fn(),
        onError,
      },
    ),
  ).rejects.toMatchObject({ name: 'AbortError' })
  expect(onError).not.toHaveBeenCalled()
})
