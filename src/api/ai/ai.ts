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
import { getToken } from '@/utils/auth'

function normalizeStreamError(error: unknown, fallback: string): Error {
  return error instanceof Error ? error : new Error(fallback)
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

/** 流式发送，支持中断与重试。 */
export async function sendMessageStream(
  request: AiRequest,
  handlers: AiStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = getToken()

  let streamResponse: Response
  try {
    streamResponse = await fetch(`${import.meta.env.VITE_API_URL}/ai/assistant/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(request),
      signal,
    })
  } catch (error) {
    // 主动中断（AbortError）交由调用方处理，其余网络错误统一回调。
    if ((error as Error)?.name === 'AbortError') throw error
    const normalizedError = normalizeStreamError(error, '流式请求失败')
    handlers.onError?.(normalizedError)
    throw normalizedError
  }

  if (streamResponse.status !== 200) {
    const responseText = await streamResponse.text()
    let message = `流式响应状态码错误：${streamResponse.status}`
    if (responseText) {
      try {
        const payload = JSON.parse(responseText) as { msg?: string; message?: string }
        message = payload.msg || payload.message || message
      } catch {
        message = responseText.trim() || message
      }
    }
    const error = new Error(message)
    handlers.onError?.(error)
    throw error
  }

  const reader = streamResponse.body?.getReader()
  if (!reader) {
    const error = new Error('流式响应失败')
    handlers.onError?.(error)
    throw error
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let lastChunk: AiStreamChunk = {}

  /** 解析单条 SSE 事件，兼容 `data:` 前缀与纯 JSON 行。 */
  const handleEvent = (raw: string) => {
    const payload = raw
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('')
      .trim()

    if (!payload || payload === '[DONE]') return

    try {
      const chunk = JSON.parse(payload) as AiStreamChunk
      lastChunk = chunk
      handlers.onChunk(chunk)
    } catch {
      // 非 JSON 分片按纯文本增量处理。
      const chunk: AiStreamChunk = { content: payload }
      lastChunk = chunk
      handlers.onChunk(chunk)
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // SSE 事件以空行分隔，逐条消费已完整到达的事件。
      let separatorIndex = buffer.indexOf('\n\n')
      while (separatorIndex !== -1) {
        const event = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 2)
        handleEvent(event)
        separatorIndex = buffer.indexOf('\n\n')
      }
    }

    // 处理结尾可能残留的未以空行结束的事件。
    if (buffer.trim()) handleEvent(buffer)

    handlers.onComplete?.(lastChunk)
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error
    const normalizedError = normalizeStreamError(error, '流式响应读取失败')
    handlers.onError?.(normalizedError)
    throw normalizedError
  } finally {
    reader.releaseLock()
  }
}
