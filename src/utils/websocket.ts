import useNotificationStore from '@/stores/notification'
import type { NotificationItem } from '@/types/eip/notification'
import { getToken } from '@/utils/auth'
import { ElNotification } from 'element-plus'

let socket: WebSocket | null = null

export function connectWebSocket() {
  const token = getToken()
  if (!token) return
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  const endpoint =
    import.meta.env.VITE_WS_URL ||
    new URL('/ws/notification', import.meta.env.VITE_API_URL || window.location.origin).toString()
  const url = new URL(endpoint, window.location.origin)
  if (url.protocol === 'http:') url.protocol = 'ws:'
  if (url.protocol === 'https:') url.protocol = 'wss:'
  url.searchParams.set('token', token)
  const currentSocket = new WebSocket(url.toString())
  socket = currentSocket

  currentSocket.onmessage = (event) => {
    try {
      const notification = JSON.parse(event.data) as NotificationItem
      const notificationStore = useNotificationStore()
      if (!notificationStore.receiveNotification(notification)) return

      ElNotification({
        title: notification.title,
        message: notification.content,
        type: 'info',
      })
    } catch (error) {
      console.error('WebSocket 消息解析失败：', error)
    }
  }

  currentSocket.onclose = () => {
    if (socket === currentSocket) socket = null
  }

  currentSocket.onerror = (error) => {
    console.error('WebSocket 连接异常：', error)
  }
}

export function disconnectWebSocket() {
  socket?.close()
  socket = null
}
