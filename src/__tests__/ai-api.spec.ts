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
})
