import axios from 'axios'
import service from '@/utils/request'
import type {
  ChatMessage,
  ContactPage,
  Conversation,
  ConversationSnapshot,
  EventPage,
  ImApi,
  ImConfig,
  MemberPage,
  MessagePage,
  SendMessageResult,
  UploadReservation,
  UploadStatus,
  WsTicket,
} from '@/types/im'

/** 真实后端实现。路径无 /api 前缀，由 VITE_API_URL 提供。 */
export const httpImApi: ImApi = {
  config: () => service.get<ImConfig>('/im/config'),
  contacts: (params) => service.get<ContactPage>('/im/contacts', { params }),
  createDirect: (peerUserId) => service.post<Conversation>('/im/conversations/direct', { peerUserId }),
  snapshot: (params) => service.get<ConversationSnapshot>('/im/conversations', { params }),
  conversation: (id) => service.get<Conversation>(`/im/conversations/${id}`),
  setPreferences: (id, muted) => service.put<{ muted: boolean }>(`/im/conversations/${id}/preferences`, { muted }),
  sendMessage: (id, input) => service.post<SendMessageResult>(`/im/conversations/${id}/messages`, input),
  history: (id, params) => service.get<MessagePage>(`/im/conversations/${id}/messages`, { params }),
  async messageByClientId(clientMessageId) {
    try {
      return await service.get<ChatMessage>('/im/messages/by-client-id', { params: { clientMessageId }, silent: true })
    } catch {
      return null // 404：尚未提交
    }
  },
  markRead: (id, throughSeq) => service.put(`/im/conversations/${id}/read`, { throughSeq }),
  createGroup: (input) => service.post<Conversation>('/im/groups', input),
  renameGroup: (id, name, expectedVersion) => service.put<Conversation>(`/im/groups/${id}`, { name, expectedVersion }),
  members: (id, params) => service.get<MemberPage>(`/im/groups/${id}/members`, { params }),
  addMembers: (id, memberIds, expectedVersion) =>
    service.post<Conversation>(`/im/groups/${id}/members`, { memberIds, expectedVersion }),
  removeMember: (id, userId, expectedVersion) =>
    service.del<Conversation>(`/im/groups/${id}/members/${userId}`, { params: { expectedVersion } }),
  setRole: (id, userId, role, expectedVersion) =>
    service.put<Conversation>(`/im/groups/${id}/members/${userId}/role`, { role, expectedVersion }),
  transfer: (id, newOwnerId, expectedVersion) =>
    service.post<Conversation>(`/im/groups/${id}/transfer`, { newOwnerId, expectedVersion }),
  leave: (id, expectedVersion) => service.post(`/im/groups/${id}/leave`, { expectedVersion }),
  dissolve: (id, expectedVersion) => service.post<Conversation>(`/im/groups/${id}/dissolve`, { expectedVersion }),
  reserveUpload: (input) => service.post<UploadReservation>('/im/uploads', input),
  async putFile(reservation, file, onProgress, signal) {
    // 签名 PUT 直传对象存储：不携带应用 JWT，必须带返回的请求头。
    await axios.put(reservation.uploadUrl, file, {
      headers: reservation.requiredHeaders,
      signal,
      timeout: 0,
      onUploadProgress: (event) => {
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
  },
  completeUpload: (uploadId) => service.post<UploadStatus>(`/im/uploads/${uploadId}/complete`),
  uploadStatus: (uploadId) => service.get<UploadStatus>(`/im/uploads/${uploadId}`),
  cancelUpload: (uploadId) => service.del<UploadStatus>(`/im/uploads/${uploadId}`),
  downloadFile: (fileId) =>
    service.get<Blob>(`/im/files/${fileId}/content`, { responseType: 'blob', timeout: 0 }) as unknown as Promise<Blob>,
  issueTicket: (clientId) => service.post<WsTicket>('/im/ws-tickets', { clientId }),
  syncEvents: (afterEventSeq, limit = 100) =>
    service.get<EventPage>('/im/sync/events', { params: { afterEventSeq, limit } }),
}
