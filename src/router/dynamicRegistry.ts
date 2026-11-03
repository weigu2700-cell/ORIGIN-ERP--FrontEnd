import type { Router, RouteRecordRaw } from 'vue-router'
const removers = new Set<() => void>()
export function installDynamicRoutes(router: Router, routes: RouteRecordRaw[]) {
  for (const route of routes) {
    if (route.name && router.hasRoute(route.name)) continue
    removers.add(router.addRoute('BasicLayout', route))
  }
}
export function clearDynamicRoutes() {
  for (const remove of removers) remove()
  removers.clear()
}
