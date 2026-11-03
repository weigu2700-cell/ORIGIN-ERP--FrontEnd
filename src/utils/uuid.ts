/**
 * 生成 UUID v4。`crypto.randomUUID` 只在安全上下文（HTTPS 或 localhost）可用；
 * 通过局域网 IP 等 HTTP 地址访问时它不存在，所以退回 `getRandomValues`（任何上下文都可用）。
 */
export function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
