import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

const STORAGE_KEY = 'origin-erp:navigation-history'
const MAX_HISTORY = 6

export interface NavigationHistoryItem {
  path: string
  title: string
}

const readHistory = (): NavigationHistoryItem[] => {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter(
      (item): item is NavigationHistoryItem =>
        !!item && typeof item === 'object' && typeof item.path === 'string' && typeof item.title === 'string',
    )
  } catch {
    return []
  }
}

export const useNavigationStore = defineStore('navigation', {
  state: () => ({ history: readHistory() as NavigationHistoryItem[] }),
  actions: {
    recordRoute(route: RouteLocationNormalized) {
      const title = String(route.meta.title ?? '')
      if (!title || route.name === 'login' || route.name === 'BasicLayout') return

      const item = { path: route.fullPath, title }
      this.history = [...this.history.filter((entry) => entry.path !== item.path), item].slice(-MAX_HISTORY)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history))
    },
  },
})
