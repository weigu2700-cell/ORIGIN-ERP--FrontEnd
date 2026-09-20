import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosError,
  type AxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token: string | null = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

http.interceptors.response.use(
  (response) => {
    // 文件下载接口返回二进制内容，不经过统一的 JSON Result 解包。
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response.data
    }
    const result = response.data

    if (result.code !== 200) {
      const message = result.msg ?? '请求失败'
      ElMessage.error(message)
      return Promise.reject(new Error(message))
    }
    return result.data
  },
  (error: AxiosError) => {
    switch (error.response?.status) {
      case 401:
        removeToken()
        ElMessage.error('登录过期，请重新登录')
        break
      case 403:
        console.error('无权访问')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      default:
        if (error.response && error.response.status > 500) {
          ElMessage.error('服务器内部错误')
        } else if (!error.response) {
          ElMessage.error('网络异常，请检查网络连接')
        } else {
          ElMessage.error(error.message)
        }
    }
    return Promise.reject(error)
  },
)

function request<T>(config: AxiosRequestConfig): Promise<T>
function request(config: AxiosRequestConfig): Promise<unknown> {
  return http.request(config)
}

export function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'GET', url })
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'POST', url, data })
}

export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'PUT', url, data })
}

export function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'DELETE', url })
}

const service = {
  get,
  post,
  put,
  del,
}

export default service
