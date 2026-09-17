import type { PageResult } from '@/types/common'
import { NotificationType } from '@/constants/enumCode'

export interface Notification {
  id: string
  userId: string
  type: (typeof NotificationType)[keyof typeof NotificationType]
  title: string
  content: string
  businessId: number
  businessNo: string
  businessType: string
  isRead: boolean
  readTime: Date
  createTime: Date
  updateTime: Date
}

export type NotificationPageResult = PageResult<Notification>

export interface NotificationQuery {
  pageNum: number
  pageSize: number
  isRead: boolean
}
