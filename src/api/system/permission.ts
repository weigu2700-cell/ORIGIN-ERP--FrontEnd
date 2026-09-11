import service from "@/utils/request.ts"
import type {
  PermissionListRequest,
  PermissionListResponse,
  PermissionNode,
  PermissionCreateRequest,
  PermissionUpdateRequest
} from "@/types/system/permission.ts";

export function getPagePermissionList(data: PermissionListRequest): Promise<PermissionListResponse> {
  return service.get<PermissionListResponse>('system/permission/list', {params: data})
}

export function getPermissionTree(): Promise<PermissionNode[]> {
  return service.get<PermissionNode[]>('system/permission/tree')
}

export function getDetailPermission(id: string): Promise<PermissionNode> {
  return service.get<PermissionNode>(`system/permission/${id}`)
}

export function addPermission(data: PermissionCreateRequest): Promise<unknown> {
  return service.post<unknown>('system/permission/add', data)
}

// 更新接口的 DTO 以 query 参数传递
export function updatePermission(data: PermissionUpdateRequest): Promise<unknown> {
  return service.put<unknown>(`system/permission/${data.id}`, undefined, {params: data})
}