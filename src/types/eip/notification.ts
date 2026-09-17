import type { PageResult } from '@/types/common'

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
