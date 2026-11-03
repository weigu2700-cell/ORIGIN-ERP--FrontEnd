import { captureSession, assertSession } from '@/utils/auth'
import { defineStore } from 'pinia'
import { getCurrentUserMenu } from '@/api/system/menu.ts'
import type { MenuItem } from '@/types/system/menu.ts'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    menuList: <MenuItem[]>[],
    routesLoaded: false,
  }),
  actions: {
    async menuLoad() {
      const snapshot = captureSession()
      const menus = await getCurrentUserMenu()
      assertSession(snapshot)
      this.menuList = menus
      this.routesLoaded = true
    },
  },
})
