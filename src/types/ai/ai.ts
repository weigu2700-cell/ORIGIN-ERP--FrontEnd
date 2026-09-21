export interface AiRequest {
  conversationId: string
  message: string
}

export interface AiAssistantResponse {
  content: string
}

export interface AiStreamChunk {
  content?: string
  messageId?: string
  conversationId?: string
  done?: boolean
}

/** 流式回调，由调用方决定如何渲染增量内容。 */
export interface AiStreamHandlers {
  onChunk: (chunk: AiStreamChunk) => void
  onComplete?: (chunk: AiStreamChunk) => void
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
