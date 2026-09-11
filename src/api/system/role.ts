import service from "@/utils/request.ts"
import type {
  RoleListRequest,
  RoleListResponse,
  RoleDetailResponse,
  RoleSaveRequest,
  RolePermissionAssignRequest,
  RoleMenuAssignRequest
} from "@/types/system/role.ts";

export function getPageRoleList(data: RoleListRequest): Promise<RoleListResponse> {
  return service.get<RoleListResponse>('system/role/list', {params: data})
}

export function getDetailRole(id: string): Promise<RoleDetailResponse> {
  return service.get<RoleDetailResponse>(`system/role/${id}`)
}

export function addRole(data: RoleSaveRequest): Promise<unknown> {
  return service.post<unknown>('system/role/add', data)
}

export function updateRole(data: RoleSaveRequest): Promise<unknown> {
  return service.put<unknown>(`system/role/${data.id}`, data)
}

export function removeRole(id: string): Promise<unknown> {
  return service.del<unknown>(`system/role/${id}`)
}

// 分配权限（RolePermissionAssignDTO，雪花 ID 字符串）
export function assignRolePermissions(data: RolePermissionAssignRequest): Promise<unknown> {
  return service.post<unknown>(`system/role/${data.roleId}/permissions`, {
    roleId: data.roleId,
    permissionIds: data.permissionIds,
  })
}

// 分配菜单（RoleMenuAssignDTO）
export function assignRoleMenus(data: RoleMenuAssignRequest): Promise<unknown> {
  return service.post<unknown>(`system/role/${data.roleId}/menu`, {
    roleId: data.roleId,
    menuIds: data.menuIds,
  })
}