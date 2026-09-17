import { getToken } from '@/utils/auth'

let socket: WebSocket | null = null

export function connectWebSocket() {
  const token = getToken()

  if (!token) {
    return
  }

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  socket = new WebSocket(`ws://localhost:8080/ws/notification?token=${encodeURIComponent(token)}`)

  socket.onopen = () => {
    console.log('WebSocket 连接成功')
  }

  socket.onmessage = (event) => {
    console.log('收到 WebSocket 消息：', event.data)
  }

  socket.onclose = () => {
    console.log('WebSocket 连接关闭')
    socket = null
  }

  socket.onerror = (error) => {
    console.error('WebSocket 连接异常：', error)
  }
}

export function disconnectWebSocket() {
  if (socket) {
    socket.close()
    socket = null
  }
}
