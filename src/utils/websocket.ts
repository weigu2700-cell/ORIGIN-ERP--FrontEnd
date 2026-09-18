import useNotificationStore from '@/stores/notification'
import type { NotificationItem } from '@/types/eip/notification'
import { getToken } from '@/utils/auth'
import { ElNotification } from 'element-plus'

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000
let manualClose = true
let lifecycleBound = false

const clearReconnectTimer = () => {
  if (reconnectTimer !== null) clearTimeout(reconnectTimer)
  reconnectTimer = null
}

const syncNotifications = () => {
  if (!getToken()) return
  void useNotificationStore()
    .initialize()
    .catch((error) => console.error('通知同步失败：', error))
}

const handleOnline = () => {
  connectWebSocket()
  syncNotifications()
}

const handleVisibility = () => {
  if (document.visibilityState !== 'visible') return
  connectWebSocket()
  syncNotifications()
}

const bindLifecycle = () => {
  if (lifecycleBound || typeof window === 'undefined') return
  window.addEventListener('online', handleOnline)
  document.addEventListener('visibilitychange', handleVisibility)
  lifecycleBound = true
}

const unbindLifecycle = () => {
  if (!lifecycleBound || typeof window === 'undefined') return
  window.removeEventListener('online', handleOnline)
  document.removeEventListener('visibilitychange', handleVisibility)
  lifecycleBound = false
}

const scheduleReconnect = () => {
  if (manualClose || reconnectTimer !== null || !getToken()) return
  const delay = reconnectDelay
  reconnectDelay = Math.min(reconnectDelay * 2, 30_000)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectWebSocket()
  }, delay)
}

export function connectWebSocket() {
  const token = getToken()
  if (!token || typeof window === 'undefined' || typeof WebSocket === 'undefined') return
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return

  manualClose = false
  clearReconnectTimer()
  bindLifecycle()

  const endpoint =
    import.meta.env.VITE_WS_URL ||
    new URL('/ws/notification', import.meta.env.VITE_API_URL || window.location.origin).toString()
  const url = new URL(endpoint, window.location.origin)
  if (url.protocol === 'http:') url.protocol = 'ws:'
  if (url.protocol === 'https:') url.protocol = 'wss:'
  url.searchParams.set('token', token)

  const currentSocket = new WebSocket(url.toString())
  socket = currentSocket

  currentSocket.onopen = () => {
    if (socket !== currentSocket || manualClose) return
    reconnectDelay = 1000
    console.log('WebSocket 连接成功')
    syncNotifications()
  }

  currentSocket.onmessage = (event) => {
    if (socket !== currentSocket || manualClose || !getToken()) return
    try {
      const notification = JSON.parse(event.data) as NotificationItem
      const notificationStore = useNotificationStore()
      if (!notificationStore.receiveNotification(notification)) return

      ElNotification({
        title: notification.title || '通知',
        type: 'info',
      })
    } catch (error) {
      console.error('WebSocket 消息解析失败：', error)
    }
  }

  currentSocket.onclose = () => {
    console.log('WebSocket 连接关闭')
    if (socket !== currentSocket) return
    socket = null
    scheduleReconnect()
  }

  currentSocket.onerror = (error) => {
    console.error('WebSocket 连接异常：', error)
  }
}

export function disconnectWebSocket() {
  manualClose = true
  clearReconnectTimer()
  reconnectDelay = 1000
  unbindLifecycle()
  const currentSocket = socket
  socket = null
  currentSocket?.close()
}
