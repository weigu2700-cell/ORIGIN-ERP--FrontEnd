import { defineStore } from 'pinia'
import { getToken, removeToken, setToken } from '@/utils/auth.ts'
import Login from '@/api/system/auth.ts'
import type { loginRequest } from '@/types/system/auth.ts'
import { getCurrentUser } from '@/api/system/user.ts'
import type { UserInfo } from '@/types/system/user.ts'
import { usePermissionStore } from '@/stores/permission.ts'
import router from '@/router'
import { ElMessage } from 'element-plus'
import { disconnectWebSocket } from '@/utils/websocket'
import useNotificationStore from '@/stores/notification'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    userInfo: <UserInfo>{},
  }),
  getters: {
    isLoggedIn(state) {
      return state.token !== null
    },
  },
  actions: {
    async login(data: loginRequest) {
      try {
        const response = await Login(data)
        setToken(response.token)
        this.token = response.token
      } catch (error) {
        console.error(error)
      }
    },
    logout() {
      disconnectWebSocket()
      useNotificationStore().reset()
      ElMessage.success('退出成功')
      removeToken()
      this.token = null
      const permissionStore = usePermissionStore()
      permissionStore.routesLoaded = false
      router.push({ name: 'login' }).then((r) => r)
    },
    async getUserInfo() {
      try {
        this.userInfo = await getCurrentUser()
        return true
      } catch (error) {
        console.error(error)
        return false
      }
    },
  },
})
