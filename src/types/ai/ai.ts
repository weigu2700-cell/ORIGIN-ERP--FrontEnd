export interface AiRequest {
  conversationId: string
  message: string
}

export interface AiAssistantResponse {
  content: string
}

/** 流式响应的单个分片，后端以 SSE 的 data 字段返回 JSON。 */
export interface AiStreamChunk {
  /** 增量文本，直接追加到当前回复末尾。 */
  content?: string
  /** 服务端返回的完整消息 ID，通常在最后一帧下发。 */
  messageId?: string
  /** 会话 ID，新建会话时可能由服务端回填。 */
  conversationId?: string
  /** 结束标记。 */
  done?: boolean
}

/** 流式回调，由调用方决定如何渲染增量内容。 */
export interface AiStreamHandlers {
  onChunk: (chunk: AiStreamChunk) => void
  onDone?: (chunk: AiStreamChunk) => void
  onError?: (error: Error) => void
}

export type AiMessageRole = 'user' | 'assistant'

export interface AiMessageResponse {
  id: string
  conversationId: string
  role: AiMessageRole
  content: string
  createTime: string
  updateTime: string
  deleted: number
}

export interface AiConversation {
  id: string
  title: string
  status: 0 | 1
  createTime: string
  updateTime: string
  deleted?: number
}

export interface AiConversationCreated {
  conversationId: string
}
export type AiConversationDetail = AiConversation

export type AiConversationList = AiConversation[]
