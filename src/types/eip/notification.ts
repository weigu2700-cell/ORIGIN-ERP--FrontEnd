import type { PageResult } from '@/types/common'

/** 后端 EIP 收件人维度；Long ID 在 JSON/前端中均保持字符串。 */
export type RecipientSelectorType =
  'USER' | 'ROLE' | 'PERMISSION' | 'DEPARTMENT' | 'ALL_ACTIVE_USERS' | 'ADMINISTRATORS'

export type RecipientMergeMode = 'PRESET_ONLY' | 'MERGE' | 'OVERRIDE'
export type NotificationSourceType = 'SYSTEM' | 'BUSINESS'

export interface RecipientOption {
  type: RecipientSelectorType
  value: string
  label: string
}

/** 与 RecipientSelectorDTO 对应，数组字段可直接序列化为后端 Set。 */
export interface RecipientSelector {
  userIds: string[]
  roleCodes: string[]
  permissionCodes: string[]
  departmentIds: string[]
  allActiveUsers: boolean
  includeChildDepartments: boolean
  includeAdministrators: boolean
}

export interface NotificationBusinessReference {
  businessType?: string
  businessId?: string
  businessNo?: string
}

interface NotificationPublishBase {
  requestId?: string
  type?: number
  title?: string
  content?: string
  recipients?: RecipientSelector
}

export interface NotificationPublishRequest extends NotificationPublishBase {
  sourceType?: NotificationSourceType
  business?: NotificationBusinessReference
}

export interface SystemNotificationPublishRequest extends NotificationPublishBase {
  templateId?: string
  templateCode?: string
  mergeMode?: RecipientMergeMode
  variables?: Record<string, string>
  businessType?: string
  businessId?: string
  businessNo?: string
}

export interface NotificationTemplateRecipient {
  selectorType: RecipientSelectorType
  selectorValue: string
  includeChildren: boolean
}

export type NotificationTemplateStatus = 0 | 1
/** Status 枚举用于查询参数时按名称绑定，不能传响应中的 0/1 code。 */
export type NotificationTemplateStatusCommand = 'ENABLE' | 'DISABLE'

export interface NotificationTemplate {
  id?: string
  code: string
  name: string
  titleTemplate: string
  contentTemplate: string
  notificationType: number
  status: NotificationTemplateStatus
  remark?: string
  recipients: NotificationTemplateRecipient[]
}

export type NotificationTemplateSaveRequest = Omit<NotificationTemplate, 'id'> & { id?: string }

export interface NotificationItem {
  id: string
  userId?: string
  type: number
  title: string
  content: string
  businessType?: string
  businessId?: string
  businessNo?: string
  isRead: boolean
  readTime?: string
  createTime: string
  updateTime?: string
}

export type NotificationPageResult = PageResult<NotificationItem>

export interface NotificationQuery {
  pageNum: number
  pageSize: number
  isRead?: boolean | null
}
