import type { PageResult } from '../common'
import { EnableStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type RoleStatus = EnumCodeOf<typeof EnableStatus> | string

// 列表记录 / 详情（RoleInfoVO）
export interface RoleInfo {
  id: string
  name: string
  code: string
  sort: number
  status: RoleStatus
  permissionIds: string[]
}

// 分页查询参数（RoleGetDTO）
export interface RoleListRequest {
  page: number
  pageSize: number
  name?: string | null
  code?: string | null
  sort?: number | null
  status?: RoleStatus | null
}

// 分页列表响应（PageRoleInfoVO）
export type RoleListResponse = PageResult<RoleInfo>

export type RoleDetailResponse = RoleInfo

// 新增/更新参数（RoleUpdateDTO），id 用于更新
export interface RoleSaveRequest {
  id?: string
  name: string
  code: string
  status: RoleStatus
  permissionCode?: string[]
}

// 分配权限参数（RolePermissionAssignDTO）
export interface RolePermissionAssignRequest {
  roleId: string
  permissionIds: string[]
}

// 分配菜单参数（RoleMenuAssignDTO）
export interface RoleMenuAssignRequest {
  roleId: string
  menuIds: string[]
}
