import type { NotificationPageResult, NotificationQuery } from '@/types/eip/notification'
import service from '@/utils/request'

export function getPageNotification(query: NotificationQuery) {
  return service.get<NotificationPageResult>('/sys/notification', { params: query })
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
