import type {
  NotificationItem,
  NotificationPageResult,
  NotificationQuery,
  NotificationPublishRequest,
  NotificationTemplate,
  NotificationTemplateStatusCommand,
  RecipientOption,
  RecipientSelectorType,
  SystemNotificationPublishRequest,
} from '@/types/eip/notification'
import service from '@/utils/request'

export function getPageNotification(query: NotificationQuery) {
  return service.get<NotificationPageResult>('/sys/notification', { params: query })
}

export function getNotificationDetail(notificationId: string) {
  return service.get<NotificationItem>(`/sys/notification/${notificationId}`)
}

export function getUnreadCount() {
  return service.get<number | string>('/sys/notification/unread/count')
}

export function remarkRead(notificationId: string) {
  return service.put<void>(`/sys/notification/${notificationId}/readed`)
}

export function remarkAllRead() {
  return service.put<void>('/sys/notification/all/readed')
}

export function publishNotification(data: SystemNotificationPublishRequest) {
  return service.post<string>('/eip/notifications/publish', data)
}

export function getRecipientOptions(type: RecipientSelectorType, keyword?: string) {
  return service.get<RecipientOption[]>('/eip/notification-recipient-options', {
    params: { type, ...(keyword ? { keyword } : {}) },
  })
}

export function getNotificationTemplates(keyword?: string) {
  return service.get<NotificationTemplate[]>('/eip/notification-templates', {
    params: keyword ? { keyword } : undefined,
  })
}

export const listNotificationTemplates = getNotificationTemplates

export function getNotificationTemplate(id: string) {
  return service.get<NotificationTemplate>(`/eip/notification-templates/${id}`)
}

export function createNotificationTemplate(data: NotificationTemplate) {
  return service.post<NotificationTemplate>('/eip/notification-templates', data)
}

export function updateNotificationTemplate(id: string, data: NotificationTemplate) {
  return service.put<NotificationTemplate>(`/eip/notification-templates/${id}`, data)
}

export function updateNotificationTemplateStatus(id: string, status: NotificationTemplateStatusCommand) {
  return service.put<void>(`/eip/notification-templates/${id}/status`, undefined, { params: { status } })
}

export function deleteNotificationTemplate(id: string) {
  return service.del<void>(`/eip/notification-templates/${id}`)
}

// 业务模块仅在服务端直接发布 NotificationPublishDTO；保留其契约类型供调用方复用。
export type { NotificationPublishRequest }
