import type { Router } from 'vue-router'
import { getToken } from '@/utils/auth.ts'
import { useUserStore } from '@/stores/user.ts'
import { usePermissionStore } from '@/stores/permission.ts'
import { generateRoutes } from '@/router/routes.ts'
import { recordSystemActivity } from '@/utils/systemActivity'
import { useNavigationStore } from '@/stores/navigation'

export function setupRouterGuard(router: Router) {
  router.afterEach((to) => {
    if (getToken() && to.name !== 'login') {
      recordSystemActivity()
      useNavigationStore().recordRoute(to)
    }
  })

  router.beforeEach(async (to) => {
    const token = getToken()
    const useStore = useUserStore()
    const permissionStore = usePermissionStore()

    if (!token) {
      if (to.name !== 'login') {
        return { name: 'login' }
      }
      return true
    }

    if (to.name === 'login') {
      return { name: 'home' }
    }

    if (!useStore.userInfo.id) {
      const ok = await useStore.getUserInfo()
      if (!ok) {
        useStore.logout()
        return { name: 'login' }
      }
    }
    if (!permissionStore.routesLoaded) {
      await permissionStore.menuLoad()
      const dynamicRoutes = generateRoutes(permissionStore.menuList)
      dynamicRoutes.forEach((route) => {
        // 静态路由（如工作台 /home）优先作为兜底，避免同名动态路由覆盖正确组件。
        if (route.name && router.hasRoute(route.name)) return
        router.addRoute('BasicLayout', route)
      })
      return to.fullPath
    }

    return true
  })
}
