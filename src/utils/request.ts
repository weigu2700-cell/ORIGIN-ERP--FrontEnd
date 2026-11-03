import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import {
  captureSession,
  isSessionCurrent,
  registerSessionAbort,
  getToken,
  removeToken,
  SessionChangedError,
  type SessionSnapshot,
} from '@/utils/auth'

export type RequestConfig = AxiosRequestConfig & { anonymous?: boolean; silent?: boolean }
type ScopedConfig = InternalAxiosRequestConfig & {
  anonymous?: boolean
  silent?: boolean
  session?: SessionSnapshot
  releaseSession?: () => void
}
const http = axios.create({
  // 生产环境使用同源接口时，从站点根目录发请求，避免相对路径叠加当前页面路径。
  baseURL: import.meta.env.VITE_API_URL || '/',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})
http.interceptors.request.use((config: ScopedConfig) => {
  config.session = captureSession()
  const token = getToken()
  if (!config.anonymous && token) config.headers.Authorization = `Bearer ${token}`
  const controller = new AbortController()
  const parent = config.signal
  const cancel = () => controller.abort()
  if (parent?.aborted) cancel()
  parent?.addEventListener?.('abort', cancel)
  const release = registerSessionAbort(cancel)
  config.releaseSession = () => {
    release()
    parent?.removeEventListener?.('abort', cancel)
  }
  config.signal = controller.signal
  return config
})
function checkSession(config?: ScopedConfig) {
  config?.releaseSession?.()
  if (config?.session && !isSessionCurrent(config.session)) throw new SessionChangedError()
}

function fail(code: number | undefined, message: string, config?: ScopedConfig) {
  if (code === 401 && !config?.anonymous) removeToken()
  if (!config?.silent) ElMessage.error(message)
  return Promise.reject(new Error(message))
}
http.interceptors.response.use(
  (response) => {
    const config = response.config as ScopedConfig
    checkSession(config)
    if (config.responseType === 'blob' || config.responseType === 'arraybuffer') return response.data
    const result = response.data
    if (result.code !== 200) return fail(result.code, result.msg || '请求失败', config)
    return result.data
  },
  (error: AxiosError<{ msg?: string }>) => {
    const config = error.config as ScopedConfig | undefined
    checkSession(config)
    if (axios.isCancel(error)) return Promise.reject(error)
    const status = error.response?.status
    return fail(
      status,
      error.response?.data?.msg ||
        (status === 401
          ? '登录已过期，请重新登录'
          : status === 403
            ? '当前组织或账号无权访问'
            : status === 503
              ? '当前组织暂时不可用，请稍后重试'
              : !error.response
                ? '网络异常，请检查网络连接'
                : '请求失败，请稍后重试'),
      config,
    )
  },
)
function request<T>(config: RequestConfig): Promise<T>
function request(config: RequestConfig): Promise<unknown> {
  return http.request(config)
}
export const get = <T>(url: string, config?: RequestConfig) => request<T>({ ...config, method: 'GET', url })
export const post = <T>(url: string, data?: unknown, config?: RequestConfig) =>
  request<T>({ ...config, method: 'POST', url, data })
export const put = <T>(url: string, data?: unknown, config?: RequestConfig) =>
  request<T>({ ...config, method: 'PUT', url, data })
export const del = <T>(url: string, config?: RequestConfig) => request<T>({ ...config, method: 'DELETE', url })
export default { get, post, put, del }
