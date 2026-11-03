import service from '@/utils/request'
import type { loginRequest, loginResponse } from '@/types/system/auth.ts'

function Login(data: loginRequest): Promise<loginResponse> {
  return service.post<loginResponse>('auth/login', data, { anonymous: true, silent: true })
}

export default Login

import type { Organization, TenantConfiguration, TenantSession } from '@/types/system/auth'
export const getTenantConfiguration = () =>
  service.get<TenantConfiguration>('/auth/tenant/context', { anonymous: true, silent: true })
export const resolveOrganization = (tenantCode: string) =>
  service.post<Organization>('/auth/tenant/resolve', { tenantCode }, { anonymous: true, silent: true })
export const getTenantSession = () => service.get<TenantSession>('/auth/tenant/session', { silent: true })
