
// ==================== 日期格式化 ====================
export const formatDate = {
  /** 仅日期：2024-01-15 */
  Date: (date: Date | string | null | undefined) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  },
  /** 仅时间：14:30:00 */
  Time: (date: Date | string | null | undefined) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('zh-CN', { hour12: false })
  },
  /** 日期时间：2024-01-15 14:30:00 */
  DateTime: (date: Date | string | null | undefined) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  },
  /** 自定义格式：YYYY-MM-DD HH:mm:ss */
  custom: (date: Date | string | null | undefined, pattern: string) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return pattern
      .replace('YYYY', String(d.getFullYear()))
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'))
      .replace('HH', String(d.getHours()).padStart(2, '0'))
      .replace('mm', String(d.getMinutes()).padStart(2, '0'))
      .replace('ss', String(d.getSeconds()).padStart(2, '0'))
  }
}

// ==================== 数字格式化 ====================
export const formatDecimal = {
  /** 默认保留2位小数：1234.57 */
  default: (num: number | string | null | undefined, decimal: number = 2) => {
    if (num === null || num === undefined) return '-'
    const n = typeof num === 'string' ? parseFloat(num) : num
    return n.toFixed(decimal)
  },
  /** 千分位：1,234.57 */
  thousand: (num: number | string | null | undefined, decimal: number = 2) => {
    if (num === null || num === undefined) return '-'
    const n = typeof num === 'string' ? parseFloat(num) : num
    return n.toLocaleString('zh-CN', { minimumFractionDigits: decimal, maximumFractionDigits: decimal })
  },
  /** 百分比：12.34% */
  percent: (num: number | string | null | undefined, decimal: number = 2) => {
    if (num === null || num === undefined) return '-'
    const n = typeof num === 'string' ? parseFloat(num) : num
    return (n * 100).toFixed(decimal) + '%'
  },
  /** 整数：1234 */
  integer: (num: number | string | null | undefined) => {
    if (num === null || num === undefined) return '-'
    const n = typeof num === 'string' ? parseFloat(num) : num
    return Math.round(n).toString()
  }
}

// ==================== 状态格式化 ====================
export const formatStatus = {
  /** 启用/禁用状态 */
  enable: (status: 'ENABLE' | 'DISABLE' | string) => {
    const map: Record<string, string> = { ENABLE: '启用', DISABLE: '停用' }
    return map[status] || status
  },
  /** 激活/停用状态 */
  active: (status: 'ACTIVE' | 'INACTIVE' | string) => {
    const map: Record<string, string> = { ACTIVE: '合作中', INACTIVE: '停用' }
    return map[status] || status
  },
  /** 是/否状态 */
  yesNo: (value: number | boolean | null | undefined) => {
    if (value === null || value === undefined) return '-'
    return value ? '是' : '否'
  }
}
