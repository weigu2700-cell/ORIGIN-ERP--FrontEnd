import { computed, ref, onScopeDispose } from 'vue'
import { defineStore } from 'pinia'
import {
  getToken,
  removeToken,
  setToken,
  captureSession,
  assertSession,
  isSessionCurrent,
  onSessionChange,
} from '@/utils/auth'
import Login, { getTenantSession } from '@/api/system/auth'
import type { loginRequest, Organization } from '@/types/system/auth'
import { getCurrentUser } from '@/api/system/user'
import type { UserInfo } from '@/types/system/user'
import { usePermissionStore } from '@/stores/permission'
import { useNavigationStore } from '@/stores/navigation'
import { useOrganizationStore } from '@/stores/organization'
import router from '@/router'
import { clearDynamicRoutes } from '@/router/dynamicRegistry'
import { disconnectWebSocket } from '@/utils/websocket'
import useNotificationStore from '@/stores/notification'
import { useChatStore } from '@/stores/chat'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const userInfo = ref<UserInfo>({} as UserInfo)
  const organization = ref<Organization | null>(null)
  const businessAvailable = ref(true)
  const sessionLoaded = ref(false)
  const permissions = usePermissionStore()
  const navigation = useNavigationStore()
  const notifications = useNotificationStore()
  const organizations = useOrganizationStore()
  const unsubscribe = onSessionChange(() => {
    token.value = getToken()
    userInfo.value = {} as UserInfo
    organization.value = null
    sessionLoaded.value = false
    businessAvailable.value = true
    disconnectWebSocket()
    notifications.reset()
    useChatStore().reset()
    permissions.$reset()
    clearDynamicRoutes()
    localStorage.removeItem('origin-erp:navigation-history')
    localStorage.removeItem('origin-erp:system-activity')
    navigation.$reset()
    if (router.currentRoute.value.name !== 'login') void router.replace({ name: token.value ? 'home' : 'login' })
  })
  onScopeDispose(unsubscribe)
  async function getUserInfo() {
    const snapshot = captureSession()
    const session = await getTenantSession()
    assertSession(snapshot)
    const profile: UserInfo = session.businessAvailable
      ? await getCurrentUser()
      : { ...session.user, realName: session.user.realName || session.user.username }
    assertSession(snapshot)
    userInfo.value = profile
    organization.value = session.organization
    if (!businessAvailable.value && session.businessAvailable) permissions.$reset()
    businessAvailable.value = session.businessAvailable
    sessionLoaded.value = true
    organizations.remember(session.organization)
    return true
  }

  async function login(data: loginRequest) {
    removeToken()
    const snapshot = captureSession()
    const response = await Login(data)
    assertSession(snapshot)
    if (!response.token) throw new Error('登录响应缺少凭据')
    setToken(response.token)
    const active = captureSession()
    try {
      await getUserInfo()
    } catch (error) {
      if (isSessionCurrent(active)) removeToken()
      throw error
    }
  }

  async function logout(notify = true) {
    removeToken()
    if (notify) ElMessage.success('已退出当前组织')
    await router.replace({ name: 'login' })
  }
  return {
    token,
    userInfo,
    organization,
    businessAvailable,
    sessionLoaded,
    isLoggedIn: computed(() => !!token.value),
    login,
    logout,
    getUserInfo,
  }
})
