import { getToken } from '@/utils/auth'
import type { ConnectionState, ImApi, ImEvent } from '@/types/im'

const CLIENT_ID_KEY = 'origin-erp:im-client-id'

/** 每个浏览器实例稳定的 clientId，用于同一实例重连时替换旧连接。 */
export function getClientId() {
  let id = window.localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

export interface ChatSocketHandlers {
  onState(state: ConnectionState): void
  onReady(latestEventSeq: string): void
  onEvent(event: ImEvent): void
  /** 4401 登录过期等需要上层处理的终止性关闭 */
  onTerminated(code: number): void
}

const STOP_CODES = new Set([1000, 1008, 4401, 4403, 4409])

function resolveUrl(path: string) {
  const base = String(import.meta.env.VITE_API_URL ?? window.location.origin)
  // 只允许当前 API 服务器同源的相对路径，不接受任意目标。
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

/**
 * 聊天 WebSocket：REST 换取 60 秒一次性票据 → 连接 → SESSION.READY 后补拉。
 * 断线后指数退避并重新取票；心跳 PING/PONG，超过 idleTimeout 无任何帧则主动重连。
 */
export function createChatSocket(api: ImApi, handlers: ChatSocketHandlers) {
  let socket: WebSocket | null = null
  let stopped = true
  let attempt = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null
  let watchdog: ReturnType<typeof setTimeout> | null = null
  let generation = 0

  const clearTimers = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (heartbeat) clearInterval(heartbeat)
    if (watchdog) clearTimeout(watchdog)
    reconnectTimer = heartbeat = watchdog = null
  }

  const scheduleReconnect = () => {
    if (stopped || reconnectTimer || !getToken()) return
    handlers.onState(navigator.onLine ? 'reconnecting' : 'offline')
    const delay = Math.min(1000 * 2 ** attempt, 30_000)
    attempt += 1
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      void connect()
    }, delay)
  }

  async function connect() {
    if (stopped || !getToken()) return
    const mine = ++generation
    clearTimers()
    socket?.close()
    handlers.onState(attempt === 0 ? 'connecting' : 'reconnecting')
    try {
      const ticket = await api.issueTicket(getClientId())
      if (stopped || mine !== generation) return
      const ws = new WebSocket(resolveUrl(ticket.websocketPath))
      socket = ws
      const arm = () => {
        if (watchdog) clearTimeout(watchdog)
        watchdog = setTimeout(() => ws.close(), ticket.idleTimeoutSeconds * 1000)
      }
      ws.onopen = () => arm()
      ws.onmessage = (message) => {
        arm()
        let frame: Record<string, unknown>
        try {
          frame = JSON.parse(String(message.data))
        } catch {
          return
        }
        if (frame.type === 'SESSION.READY') {
          attempt = 0
          handlers.onState('online')
          handlers.onReady(String(frame.latestEventSeq ?? '0'))
          heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'PING', nonce: crypto.randomUUID() }))
          }, ticket.heartbeatSeconds * 1000)
          return
        }
        if (frame.type === 'PONG' || frame.type === 'PROTOCOL.ERROR') return
        if (typeof frame.eventId === 'string') handlers.onEvent(frame as unknown as ImEvent)
      }
      ws.onclose = (event) => {
        if (mine !== generation) return
        clearTimers()
        socket = null
        if (stopped) return
        if (STOP_CODES.has(event.code)) {
          handlers.onState('offline')
          handlers.onTerminated(event.code)
          return
        }
        scheduleReconnect()
      }
      ws.onerror = () => ws.close()
    } catch {
      if (!stopped && mine === generation) scheduleReconnect()
    }
  }

  const resume = () => {
    if (stopped || socket?.readyState === WebSocket.OPEN || reconnectTimer) return
    attempt = 0
    void connect()
  }

  return {
    start() {
      if (!stopped) return
      stopped = false
      attempt = 0
      window.addEventListener('online', resume)
      document.addEventListener('visibilitychange', onVisible)
      void connect()
    },
    stop() {
      stopped = true
      generation += 1
      clearTimers()
      window.removeEventListener('online', resume)
      document.removeEventListener('visibilitychange', onVisible)
      socket?.close(1000)
      socket = null
      handlers.onState('idle')
    },
  }

  function onVisible() {
    if (document.visibilityState === 'visible') resume()
  }
}
