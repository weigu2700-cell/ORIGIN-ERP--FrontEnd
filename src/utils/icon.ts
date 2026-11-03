// 菜单 icon 字段可能是 Element Plus 图标组件名（如 User / Setting），
// 也可能是 CSS 类名（含 - 空格 . / 等字符，如 icon-user）
export function isClassIcon(icon?: string | null): boolean {
  return !!icon && /[\s.\-/]/.test(icon)
}

// 新初始化的菜单可能没有配置图标，优先保留管理员配置。
export function menuIcon(icon: string | null | undefined, path: string): string {
  if (icon?.trim()) return icon
  const defaults: Record<string, string> = {
    '/system': 'Setting',
    '/master': 'Files',
    '/sales': 'ShoppingCart',
    '/inventory': 'Box',
    '/product': 'Goods',
    '/purchase': 'ShoppingBag',
    '/eip': 'Bell',
    '/ai': 'ChatDotRound',
  }
  return defaults[path] ?? 'Document'
}
