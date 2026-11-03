import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import service from '@/utils/request'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'
vi.mock('element-plus', () => ({ ElMessage: { error: vi.fn() } }))
beforeEach(() => {
  localStorage.clear()
  removeToken()
  vi.clearAllMocks()
})
describe('authenticated requests across organization switches', () => {
  it('rejects an old successful response after changing credentials', async () => {
    let finish!: () => void
    setToken('a')
    const pending = service.get('/slow', {
      adapter: (config) =>
        new Promise<AxiosResponse>((resolve) => {
          finish = () =>
            resolve({
              data: { code: 200, data: 'a-secret' },
              status: 200,
              statusText: 'OK',
              headers: new AxiosHeaders(),
              config,
            })
        }),
    })
    const rejected = expect(pending).rejects.toBeDefined()
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    setToken('b')
    finish()
    await rejected
    expect(getToken()).toBe('b')
    expect(ElMessage.error).not.toHaveBeenCalled()
  })
  it('ignores a delayed 401 from the previous organization', async () => {
    let rejectOld!: () => void
    setToken('a')
    const pending = service.get('/slow', {
      adapter: (config) =>
        new Promise((_resolve, reject) => {
          rejectOld = () =>
            reject(
              new AxiosError('old', '401', config, undefined, {
                status: 401,
                data: {},
                statusText: '',
                headers: new AxiosHeaders(),
                config,
              }),
            )
        }),
    })
    const rejected = expect(pending).rejects.toBeDefined()
    await vi.waitFor(() => expect(rejectOld).toBeTypeOf('function'))
    setToken('b')
    rejectOld()
    await rejected
    expect(getToken()).toBe('b')
    expect(ElMessage.error).not.toHaveBeenCalled()
  })
  it('public organization validation never sends the existing organization token', async () => {
    setToken('a')
    await service.get('/auth/tenant/context', {
      anonymous: true,
      adapter: async (config: InternalAxiosRequestConfig) => {
        expect(config.headers.Authorization).toBeUndefined()
        return { data: { code: 200, data: {} }, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config }
      },
    })
    expect(getToken()).toBe('a')
  })
})
