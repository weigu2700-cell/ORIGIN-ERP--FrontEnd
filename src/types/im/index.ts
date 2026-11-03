// 员工实时聊天 V1 类型，字段与后端 docs/design/realtime-chat-v1/api.md 对齐。
// ID、seq、eventSeq 一律为十进制字符串，不转换为 number。

export type ConversationType = 'DIRECT' | 'GROUP'
export type ConversationStatus = 'ACTIVE' | 'DISSOLVED'
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
export type UploadStatusCode = 'INITIATED' | 'VERIFYING' | 'READY' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'

export interface ImConfig {
  maxFileBytes: number
  maxGroupMembers: number
  textMaxChars: number
  textMaxUtf8Bytes: number
  maxAttachmentsPerMessage: number
  allowedExtensions: string[]
  syncRetentionDays: number
  maxConnectionsPerUser: number
  [key: string]: unknown
}

export interface Contact {
  userId: string
  displayName: string
  departmentName?: string | null
  avatarUrl?: string | null
}

export interface ContactPage {
  records: Contact[]
  nextCursor: string | null
  hasMore: boolean
}

export interface ImFile {
  id: string
  name: string
  size: number
  mime: string
  sha256?: string
}

export interface SystemInfo {
  action: string
  actorId?: string | null
  targetUserIds?: string[]
  description: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  seq: string
  senderId: string | null
  clientMessageId: string
  type: MessageType
  text: string | null
  file: ImFile | null
  system: SystemInfo | null
  createdAt: string
}

export interface Conversation {
  id: string
  type: ConversationType
  name: string
  status: ConversationStatus
  ownerId: string | null
  version: number
  memberCount: number
  myRole: GroupRole | null
  visibleFromSeq: string
  lastSeq: string
  lastReadSeq: string
  unreadCount: number
  muted: boolean
  lastMessage: ChatMessage | null
  updatedAt: string
  /** 单聊对方的用户 ID（用于头像与会话去重；后端如未提供则由客户端从联系人推断）。 */
  peerUserId?: string | null
}

export interface ConversationSnapshot {
  records: Conversation[]
  snapshotToken: string
  nextCursor: string | null
  hasMore: boolean
  syncEventSeq: string
  totalUnreadCount: number
  expiresAt: string
}

export interface MessagePage {
  records: ChatMessage[]
  hasMore: boolean
  nextSeq: string | null
  direction: 'BACKWARD' | 'FORWARD'
  latestSeq: string
}

export interface SendMessageInput {
  clientMessageId: string
  type: 'TEXT' | 'IMAGE' | 'FILE'
  text?: string
  fileId?: string
}

export interface SendMessageResult {
  message: ChatMessage
  deduplicated: boolean
  senderEventSeq: string
}

export interface GroupMember extends Contact {
  role: GroupRole
  joinedAt: string
}

export interface MemberPage {
  records: GroupMember[]
  nextCursor: string | null
  hasMore: boolean
  groupVersion: number
}

export interface UploadReservation {
  uploadId: string
  method: 'PUT'
  uploadUrl: string
  requiredHeaders: Record<string, string>
  expiresAt: string
  reservationExpiresAt: string
  maxFileBytes: number
}

export interface UploadStatus {
  uploadId: string
  status: UploadStatusCode
  file: ImFile | null
  rejectionReason: string | null
}

export interface WsTicket {
  ticket: string
  expiresAt: string
  websocketPath: string
  heartbeatSeconds: number
  idleTimeoutSeconds: number
}

export type EventType =
  | 'MESSAGE.CREATED'
  | 'CONVERSATION.UPDATED'
  | 'MEMBER.CHANGED'
  | 'CONVERSATION.REVOKED'
  | 'READ.UPDATED'
  | 'EVENT.SKIPPED'

export interface ImEvent {
  protocolVersion?: number
  eventId: string
  eventSeq: string
  type: EventType
  conversationId?: string | null
  occurredAt: string
  payload: Record<string, unknown>
}

export interface EventPage {
  records: ImEvent[]
  nextAfterEventSeq: string
  hasMore: boolean
  highWatermark: string
}

export type ConnectionState = 'idle' | 'connecting' | 'online' | 'reconnecting' | 'offline'

/** 客户端本地的待发送/上传状态，不会出现在服务端数据里。 */
export type LocalState =
  | { state: 'sending' }
  | { state: 'failed'; reason?: string }
  | { state: 'uploading'; progress: number }
  | { state: 'verifying' }
  | { state: 'rejected'; reason: string }

export interface LocalMessage extends Omit<ChatMessage, 'seq' | 'id'> {
  id: string
  seq: string | null
  local: LocalState
  uploadId?: string
  cancelled?: boolean
}

export type TimelineItem = ChatMessage | LocalMessage

export const isLocalMessage = (item: TimelineItem): item is LocalMessage => 'local' in item

/** 对外暴露的后端能力，真实实现与内存 Mock 都遵守此接口。 */
export interface ImApi {
  config(): Promise<ImConfig>
  contacts(params: { keyword?: string; cursor?: string; limit?: number }): Promise<ContactPage>
  createDirect(peerUserId: string): Promise<Conversation>
  snapshot(params: { snapshotToken?: string; cursor?: string; limit?: number }): Promise<ConversationSnapshot>
  conversation(id: string): Promise<Conversation>
  setPreferences(id: string, muted: boolean): Promise<{ muted: boolean }>
  sendMessage(id: string, input: SendMessageInput): Promise<SendMessageResult>
  history(id: string, params: { beforeSeq?: string; afterSeq?: string; limit?: number }): Promise<MessagePage>
  messageByClientId(clientMessageId: string): Promise<ChatMessage | null>
  markRead(
    id: string,
    throughSeq: string,
  ): Promise<{ conversationId: string; lastReadSeq: string; unreadCount: number }>
  createGroup(input: { clientRequestId: string; name: string; memberIds: string[] }): Promise<Conversation>
  renameGroup(id: string, name: string, expectedVersion: number): Promise<Conversation>
  members(id: string, params: { cursor?: string; groupVersion?: number; limit?: number }): Promise<MemberPage>
  addMembers(id: string, memberIds: string[], expectedVersion: number): Promise<Conversation>
  removeMember(id: string, userId: string, expectedVersion: number): Promise<Conversation>
  setRole(id: string, userId: string, role: 'ADMIN' | 'MEMBER', expectedVersion: number): Promise<Conversation>
  transfer(id: string, newOwnerId: string, expectedVersion: number): Promise<Conversation>
  leave(id: string, expectedVersion: number): Promise<{ conversationId: string; version: number }>
  dissolve(id: string, expectedVersion: number): Promise<Conversation>
  reserveUpload(input: {
    clientUploadId: string
    conversationId: string
    name: string
    size: number
    mime: string
    sha256: string
  }): Promise<UploadReservation>
  putFile(
    reservation: UploadReservation,
    file: File,
    onProgress: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<void>
  renewUpload(uploadId: string): Promise<UploadReservation>
  completeUpload(uploadId: string): Promise<UploadStatus>
  uploadStatus(uploadId: string): Promise<UploadStatus>
  cancelUpload(uploadId: string): Promise<UploadStatus>
  downloadFile(fileId: string): Promise<Blob>
  issueTicket(clientId: string): Promise<WsTicket>
  syncEvents(afterEventSeq: string, limit?: number): Promise<EventPage>
  /** 仅 Mock 使用：订阅服务端推送；真实实现通过 WebSocket。 */
  subscribe?(listener: (event: ImEvent) => void): () => void
}
