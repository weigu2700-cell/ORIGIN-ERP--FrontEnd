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
  return Service.put<AiConversationCreated>(`/ai/conversation/${conversationId}/archive`)
}

export function sendMessage(request: AiRequest) {
  return Service.post<AiAssistantResponse>('/ai/assistant/chat', request)
}

export function getMessageList(conversationId: string) {
  return Service.get<AiMessageResponse[]>(`/ai/message/${conversationId}`)
}
