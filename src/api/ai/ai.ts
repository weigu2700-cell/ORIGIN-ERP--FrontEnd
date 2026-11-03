import type {
  AiAssistantResponse,
  AiConversation,
  AiConversationCreated,
  AiConversationList,
  AiMessageResponse,
  AiRequest,
  AiStreamChunk,
  AiStreamHandlers,
} from '@/types/ai/ai'
import Service from '@/utils/request'
import { getToken, captureSession, assertSession, isSessionCurrent, registerSessionAbort } from '@/utils/auth'

/** 统一抛错；错误回调只在最外层调用一次。 */
function fail(error: unknown, fallback: string): never {
  throw error instanceof Error ? error : new Error(fallback)
}

export function getConversationList() {
  return Service.get<AiConversationList>('/ai/conversation')
}

export function addConversation() {
  return Service.post<AiConversationCreated>('/ai/conversation')
}

export function getConversationDetail(conversationId: string) {
  return Service.get<AiConversation>(`/ai/conversation/${conversationId}`)
}

export function archiveConversation(conversationId: string) {
  // 旧服务仍从请求体读取 ID；先编码成 JSON 字符串，避免 Axios 将雪花 ID 转成不安全的 Number。
  return Service.put<AiConversationCreated>(
    `/ai/conversation/${conversationId}/archive`,
    JSON.stringify(conversationId),
  )
}

/** 非流式发送，保留给不支持 SSE 的场景或单元测试使用。 */
export function sendMessage(request: AiRequest) {
  return Service.post<AiAssistantResponse>('/ai/assistant/chat', request)
}

export function getMessageList(conversationId: string) {
  return Service.get<AiMessageResponse[]>(`/ai/message/${conversationId}`)
}

/** token 对应的业务参数保存在服务端，前端只提交用户确认。 */
export function executePendingAction(token: string) {
  return Service.post<void>(`/ai/action/${encodeURIComponent(token)}/execute`)
}

/** 流式发送，支持中断与重试。 */
export async function sendMessageStream(
  request: AiRequest,
  handlers: AiStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const snapshot = captureSession()
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (signal?.aborted) cancel()
  signal?.addEventListener('abort', cancel)
  const release = registerSessionAbort(cancel)
  try {
    await readMessageStream(
      request,
      {
        onChunk: (chunk) => {
          assertSession(snapshot)
          handlers.onChunk(chunk)
        },
        onDone: () => {
          assertSession(snapshot)
          handlers.onDone?.()
        },
      },
      controller.signal,
    )
  } catch (error) {
    if (!isSessionCurrent(snapshot) || controller.signal.aborted || (error as Error)?.name === 'AbortError') throw error
    const normalized = error instanceof Error ? error : new Error('流式请求失败')
    handlers.onError?.(normalized)
    throw normalized
  } finally {
    release()
    signal?.removeEventListener('abort', cancel)
  }
}

async function readMessageStream(request: AiRequest, handlers: AiStreamHandlers, signal?: AbortSignal): Promise<void> {
  const token = getToken()
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/ai/assistant/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify(request),
    signal,
  })

  if (response.status !== 200) {
    const text = await response.text()
    let message = `流式响应状态码错误：${response.status}`
    if (text) {
      try {
        const payload = JSON.parse(text) as { msg?: string; message?: string }
        message = payload.msg || payload.message || message
      } catch {
        message = text.trim() || message
      }
    }
    fail(new Error(message), message)
  }

  const reader = response.body?.getReader()
  if (!reader) fail(null, '流式响应失败')

  const decoder = new TextDecoder()
  let line = ''
  let dataLines: string[] = []
  let previousWasCR = false
  let finished = false
  let reachedEnd = false

  const dispatch = () => {
    if (!dataLines.length || finished) return
    const payload = dataLines.join('\n').trim()
    dataLines = []
    if (!payload) return
    if (payload === '[DONE]') {
      finished = true
      return
    }
    let chunk: AiStreamChunk
    try {
      chunk = JSON.parse(payload) as AiStreamChunk
    } catch {
      chunk = { type: 'CONTENT', content: payload }
    }
    switch (chunk.type) {
      case 'ERROR':
        fail(new Error(chunk.content || '发送消息失败'), '发送消息失败')
      case 'CONTENT':
      case 'TITLE':
      case 'ACTION':
        handlers.onChunk(chunk)
        break
      default:
        fail(new Error(`未知流类型 ${chunk.type}`), '未知流类型')
    }
  }

  const consumeLine = () => {
    if (!line) dispatch()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
    line = ''
  }

  // 按行解析，兼容 LF、CRLF、CR 及换行符被网络分片切开的情况。
  const consume = (text: string) => {
    for (const char of text) {
      if (finished) break
      if (previousWasCR) {
        previousWasCR = false
        if (char === '\n') continue
      }
      if (char === '\r' || char === '\n') {
        consumeLine()
        previousWasCR = char === '\r'
      } else line += char
    }
  }

  try {
    while (!finished) {
      const { done, value } = await reader.read()
      if (done) {
        reachedEnd = true
        consume(decoder.decode())
        if (line) consumeLine()
        dispatch()
        break
      }
      consume(decoder.decode(value, { stream: true }))
    }
    handlers.onDone?.()
  } finally {
    // ERROR/[DONE] 提前结束时同时取消底层响应，释放服务端生成任务。
    try {
      if (!reachedEnd) await reader.cancel()
    } catch {
      // 清理失败不覆盖原始错误。
    } finally {
      reader.releaseLock()
    }
  }
}
