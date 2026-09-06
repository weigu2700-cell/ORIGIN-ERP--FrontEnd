import type {PageResult} from '../common'

export type UserStatus = 1 | 2 | 3

export interface UserInfo {
  id: string
  username: string
  realName: string
  phone?: string
  deptName?: string
}

export interface getUserListRequest {
  page: number
  pageSize: number
  username?: string | null
  realName?: string | null
  deptId?: string | null
  status?: UserStatus | null
  phone?: string | null
}

// 用户分页记录项
export interface UserListRecord {
  id: string
  username: string
  realName: string
  phone?: string
  deptName?: string
  status: UserStatus
  roles: Array<{
    roleId: string
    roleName: string
    roleKey: string
  }>
}

export interface getUserListResponse extends PageResult<UserListRecord> {
  optimizeCountSql: string
  searchCount: string
}


export interface getUserDetailResponse {
  id: string
  username: string
  realName: string
  phone?: string
  deptId?: string
  deptName?: string
  roleIds?: string[]
  status?: UserStatus
}

export interface createUserRequest {
  username: string
  password: string
  realName: string
  deptId?: string | null
  roleIds?: string[] | null
}

export interface updateUserRequest {
  id: string
  username: string
  realName?: string | null
  password?: string | null
  phone?: string | null
  deptId?: string | null
  roleIds?: string[] | null
  status?: UserStatus | null
}

// 分配角色参数（UserRoleAssignDTO，roleIds 为雪花 ID 字符串）
export interface UserRoleAssignRequest {
  userId: string
  roleIds: string[]
}

export interface UserStatusUpdateRequest {
  id: string
  status: UserStatus
}