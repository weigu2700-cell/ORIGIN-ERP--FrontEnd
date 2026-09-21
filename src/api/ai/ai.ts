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

/**
 * 以 SSE 流式方式发送消息。
 *
 * 使用原生 fetch 而非 Axios：Axios 基于 XHR，无法读取 `response.body` 流，
 * 只能等整个响应结束后一次性返回，达不到逐字输出的效果。
 *
 * @param request 会话 ID 与消息内容
 * @param handlers 增量回调，onChunk 每收到一段文本触发一次
 * @param signal 用于中断请求（如用户点击停止或切换会话）
 */
export async function sendMessageStream(
  request: AiRequest,
  handlers: AiStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const { onChunk, onDone, onError } = handlers

  try {
    const token = getToken()
    const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/assistant/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
      signal,
    })

    if (!response.ok) {
      throw new Error(`请求失败（${response.status}）`)
    }
    if (!response.body) {
      throw new Error('当前浏览器不支持流式响应')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let lastChunk: AiStreamChunk = {}

    // SSE 以空行分隔事件，逐块解码后按行解析，避免多字节字符被截断。
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      // 最后一行可能不完整，留到下一轮拼接。
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue
        if (!trimmed.startsWith('data:')) continue

        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') {
          onDone?.(lastChunk)
          return
        }

        try {
          lastChunk = JSON.parse(payload) as AiStreamChunk
        } catch {
          // 非 JSON 分片按纯文本处理，兼容后端直接推送字符串的写法。
          lastChunk = { content: payload }
        }

        if (lastChunk.done) {
          onChunk(lastChunk)
          onDone?.(lastChunk)
          return
        }
        onChunk(lastChunk)
      }
    }

    onDone?.(lastChunk)
  } catch (error) {
    // 主动中断不算错误，交由调用方忽略。
    if (error instanceof DOMException && error.name === 'AbortError') return
    const normalized = error instanceof Error ? error : new Error(String(error))
    onError?.(normalized)
    throw normalized
  }
}

/** 非流式发送，保留给不支持 SSE 的场景或单元测试使用。 */
export function sendMessage(request: AiRequest) {
  return Service.post<AiAssistantResponse>('/ai/assistant/chat', request)
}

export function getMessageList(conversationId: string) {
  return Service.get<AiMessageResponse[]>(`/ai/message/${conversationId}`)
}
