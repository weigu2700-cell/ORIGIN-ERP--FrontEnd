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

/** 统一错误出口：回调并抛出，避免调用方遗漏处理。 */
function fail(handlers: AiStreamHandlers, error: unknown, fallback: string): never {
  const normalized = error instanceof Error ? error : new Error(fallback)
  handlers.onError?.(normalized)
  throw normalized
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

  let response: Response
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL}/ai/assistant/chat/stream`, {
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
    fail(handlers, error, '流式请求失败')
  }

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
    fail(handlers, new Error(message), message)
  }

  const reader = response.body?.getReader()
  if (!reader) fail(handlers, null, '流式响应失败')

  const decoder = new TextDecoder()
  let buffer = ''

  /** 解析单条 SSE 事件，兼容 `data:` 前缀与纯 JSON 行。 */
  const handleEvent = (raw: string) => {
    const payload = raw
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .join('')
      .trim()

    if (!payload || payload === '[DONE]') return

    let chunk: AiStreamChunk
    try {
      chunk = JSON.parse(payload) as AiStreamChunk
    } catch {
      // 非 JSON 分片按纯文本增量处理。
      chunk = { type: 'CONTENT', content: payload }
    }

    // 按后端返回的 type 决定前端动作：错误直接中断，其余交给调用方渲染。
    switch (chunk.type) {
      case 'ERROR':
        fail(handlers, new Error(chunk.content || '发送消息失败'), '发送消息失败')
      case 'CONTENT':
      case 'TITLE':
        handlers.onChunk(chunk)
        break
      default:
        fail(handlers, new Error(`未知流类型 ${(chunk as AiStreamChunk).type}`), '未知流类型')
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
        handleEvent(buffer.slice(0, separatorIndex))
        buffer = buffer.slice(separatorIndex + 2)
        separatorIndex = buffer.indexOf('\n\n')
      }
    }

    // 处理结尾可能残留的未以空行结束的事件。
    if (buffer.trim()) handleEvent(buffer)

    handlers.onDone?.()
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error
    fail(handlers, error, '流式响应读取失败')
  } finally {
    reader.releaseLock()
  }
}
