export interface AiRequest {
  conversationId: string
  message: string
}

export interface AiAssistantResponse {
  content: string
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
