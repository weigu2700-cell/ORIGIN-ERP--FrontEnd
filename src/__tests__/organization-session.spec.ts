import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia, disposePinia, type Pinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useOrganizationStore } from '@/stores/organization'
import Login, { getTenantSession, resolveOrganization, getTenantConfiguration } from '@/api/system/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
vi.mock('@/router', () => ({
  default: { currentRoute: { value: { name: 'login' } }, replace: vi.fn().mockResolvedValue(undefined) },
}))
vi.mock('@/utils/websocket', () => ({ disconnectWebSocket: vi.fn() }))
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/api/system/auth', () => ({
  default: vi.fn(),
  getTenantSession: vi.fn(),
  resolveOrganization: vi.fn(),
  getTenantConfiguration: vi.fn(),
}))
vi.mock('@/api/system/user', () => ({ getCurrentUser: vi.fn() }))
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const session = (code: string) => ({
  tenantId: code,
  organization: { code, name: `组织 ${code}` },
  businessAvailable: false,
  user: { id: '80001', username: 'owner', realName: `成员 ${code}` },
})
let pinia: Pinia
beforeEach(() => {
  localStorage.clear()
  removeToken()
  pinia = createPinia()
  setActivePinia(pinia)
  vi.clearAllMocks()
})
afterEach(() => {
  disposePinia(pinia)
  removeToken()
})
describe('organization session boundaries', () => {
  it('ignores an older login that finishes after logout and a different login', async () => {
    const first = deferred<{ token: string }>()
    vi.mocked(Login).mockImplementation((data) =>
      data.tenantCode === 'a' ? first.promise : Promise.resolve({ token: 'token-b' }),
    )
    vi.mocked(getTenantSession).mockResolvedValue(session('b'))
    const user = useUserStore()
    const old = user.login({ tenantCode: 'a', username: 'owner', password: 'test' })
    const oldResult = expect(old).rejects.toMatchObject({ name: 'AbortError' })
    await user.logout(false)
    await user.login({ tenantCode: 'b', username: 'owner', password: 'test' })
    first.resolve({ token: 'token-a' })
    await oldResult
    expect(getToken()).toBe('token-b')
    expect(user.organization?.code).toBe('b')
    expect(user.userInfo.realName).toBe('成员 b')
  })
  it('cannot overwrite a new profile with a delayed session response', async () => {
    const first = deferred<ReturnType<typeof session>>()
    vi.mocked(getTenantSession).mockReturnValueOnce(first.promise).mockResolvedValueOnce(session('b'))
    setToken('token-a')
    const user = useUserStore()
    const old = user.getUserInfo()
    const rejected = expect(old).rejects.toMatchObject({ name: 'AbortError' })
    setToken('token-b')
    await user.getUserInfo()
    first.resolve(session('a'))
    await rejected
    expect(user.organization?.code).toBe('b')
    expect(user.businessAvailable).toBe(false)
  })
  it('clears old user data and page history while retaining organization choices', async () => {
    setToken('token-a')
    vi.mocked(getTenantSession).mockResolvedValue(session('a'))
    const user = useUserStore()
    await user.getUserInfo()
    localStorage.setItem('origin-erp:navigation-history', '[{"path":"/private","title":"旧组织"}]')
    await user.logout(false)
    expect(user.userInfo.id).toBeUndefined()
    expect(user.organization).toBeNull()
    expect(localStorage.getItem('origin-erp:navigation-history')).toBeNull()
    expect(useOrganizationStore().recent[0]?.code).toBe('a')
  })
  it('keeps the most recent verified organization when resolve responses arrive out of order', async () => {
    const first = deferred<{ code: string; name: string }>()
    vi.mocked(resolveOrganization).mockImplementation((code) =>
      code === 'a' ? first.promise : Promise.resolve({ code: 'b', name: '组织 B' }),
    )
    const organizations = useOrganizationStore()
    const old = organizations.verify('a')
    const rejected = expect(old).rejects.toThrow('组织选择已改变')
    await organizations.verify('b')
    first.resolve({ code: 'a', name: '组织 A' })
    await rejected
    expect(organizations.resolved?.code).toBe('b')
    expect(organizations.loading).toBe(false)
  })
  it('uses the server default in single-organization deployments', async () => {
    vi.mocked(getTenantConfiguration).mockResolvedValue({
      mode: 'single',
      organization: { code: 'default', name: '默认组织' },
    })
    const organizations = useOrganizationStore()
    await organizations.initialize()
    expect(organizations.selectedCode).toBe('default')
    expect(organizations.resolved?.name).toBe('默认组织')
  })
})
