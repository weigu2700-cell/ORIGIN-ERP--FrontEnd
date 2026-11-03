import type { ChatMessage, Conversation, TimelineItem } from '@/types/im'
import { isLocalMessage } from '@/types/im'

const COLORS = ['#3c7c9c', '#2a8c6a', '#d99a2b', '#8b67c7', '#c44f4f', '#3b6fb5', '#5a8a3c']

export const avatarColor = (id: string) => COLORS[Number(String(id).slice(-2)) % COLORS.length] ?? COLORS[0]!
export const initials = (name: string) => name.trim().slice(-2) || '?'

export function fmtBytes(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`
  if (n >= 1_000) return `${Math.round(n / 1_000)} KB`
  return `${n} B`
}

const pad = (n: number) => String(n).padStart(2, '0')
export const clock = (iso: string) => {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const dayDiff = (iso: string, now = new Date()) => {
  const d = new Date(iso)
  return Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86_400_000,
  )
}

/** 会话列表时间：今天显示时分，昨天、更早显示日期。 */
export function listTime(iso: string | undefined, now = new Date()) {
  if (!iso) return ''
  const diff = dayDiff(iso, now)
  if (diff === 0) return clock(iso)
  if (diff === 1) return '昨天'
  const d = new Date(iso)
  return d.getFullYear() === now.getFullYear()
    ? `${d.getMonth() + 1}月${d.getDate()}日`
    : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

/** 聊天区日期分隔标签。 */
export function dayLabel(iso: string, now = new Date()) {
  const diff = dayDiff(iso, now)
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  const d = new Date(iso)
  const week = '日一二三四五六'[d.getDay()]
  return d.getFullYear() === now.getFullYear()
    ? `${d.getMonth() + 1}月${d.getDate()}日 周${week}`
    : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function previewOf(m: ChatMessage | null, nameOf: (id: string | null) => string, group: boolean) {
  if (!m) return '暂无消息'
  const body =
    m.type === 'TEXT'
      ? (m.text ?? '')
      : m.type === 'IMAGE'
        ? '[图片]'
        : m.type === 'FILE'
          ? `[文件] ${m.file?.name ?? ''}`
          : (m.system?.description ?? '')
  return group && m.type !== 'SYSTEM' && m.senderId ? `${nameOf(m.senderId)}：${body}` : body
}

export interface Row {
  key: string
  kind: 'day' | 'unread' | 'message'
  label?: string
  item?: TimelineItem
}

/** 把时间线转成带日期分隔与未读分割线的行；unreadFromSeq 为进入会话时的第一条未读 seq。 */
export function buildRows(items: TimelineItem[], unreadFromSeq: string | null, now = new Date()): Row[] {
  const rows: Row[] = []
  let prev = ''
  let marked = false
  for (const item of items) {
    const label = dayLabel(item.createdAt, now)
    if (label !== prev) {
      rows.push({ key: `day-${item.createdAt}-${item.id}`, kind: 'day', label })
      prev = label
    }
    if (!marked && unreadFromSeq && !isLocalMessage(item) && BigInt(item.seq) >= BigInt(unreadFromSeq)) {
      rows.push({ key: 'unread', kind: 'unread' })
      marked = true
    }
    rows.push({ key: item.id, kind: 'message', item })
  }
  return rows
}

export const isGroup = (c: Conversation | null | undefined) => c?.type === 'GROUP'
export const canManage = (c: Conversation | null | undefined) =>
  !!c && c.status === 'ACTIVE' && (c.myRole === 'OWNER' || c.myRole === 'ADMIN')

const ERRORS: Record<string, string> = {
  VERSION_CONFLICT: '群信息已被他人修改，已刷新，请确认后重试',
  GROUP_NOT_WRITABLE: '该群已解散，无法发送或修改',
  OWNER_TRANSFER_REQUIRED: '群主需要先转让群主才能退出',
  MEMBER_ALREADY_PRESENT: '所选成员已在群中',
  IDEMPOTENCY_CONFLICT: '相同发送标识对应不同内容，请重新发送',
  FILE_TOO_LARGE: '文件超过大小上限',
  FILE_TYPE_NOT_ALLOWED: '不支持该文件类型',
  RATE_LIMITED: '发送太快了，请稍后再试',
  QUOTA_EXCEEDED: '存储配额已满，请联系管理员',
  IM_NOT_ENABLED: '聊天功能尚未对你开放',
  GROUP_ROLE_REQUIRED: '你没有权限执行该操作',
}
export const errorText = (error: unknown) => {
  const e = error as { error?: string; message?: string }
  return (e.error && ERRORS[e.error]) || e.message || '操作失败，请稍后重试'
}
