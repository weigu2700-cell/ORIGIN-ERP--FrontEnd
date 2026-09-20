import type {
  AiAssistantResponse,
  AiConversation,
  AiConversationCreated,
  AiConversationList,
  AiMessageResponse,
  AiRequest,
} from '@/types/ai/ai'
import Service from '@/utils/request'

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

export function sendMessage(request: AiRequest) {
  return Service.post<AiAssistantResponse>('/ai/assistant/chat', request)
}

export function getMessageList(conversationId: string) {
  return Service.get<AiMessageResponse[]>(`/ai/message/${conversationId}`)
}
