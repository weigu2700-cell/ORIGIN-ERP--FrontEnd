import service from "@/utils/request.ts";
import type {
  createUserRequest,
  getUserDetailResponse,
  getUserListRequest,
  getUserListResponse,
  updateUserRequest,
  UserInfo,
  UserRoleAssignRequest,
  UserStatusUpdateRequest
} from "@/types/system/user.ts";

export function getCurrentUser() {
  return service.get<UserInfo>('system/user/current')
}

export function getUserList(params: getUserListRequest) {
  return service.get<getUserListResponse>('system/user/list', {params})
}

export function createUser(data: createUserRequest) {
  return service.post('system/user/create', data)
}

export function getUserDetail(id: string) {
  return service.get<getUserDetailResponse>(`system/user/detail/${id}`)
}

export function updateUser(data: updateUserRequest) {
  return service.put(`system/user/${data.id}`, data)
}

export function updateUserStatus(data: UserStatusUpdateRequest) {
  return service.put<void>(`system/user/${data.id}/status`, {status: data.status})
}

// 分配角色（UserRoleAssignDTO，雪花 ID 字符串）
export function assignUserRoles(data: UserRoleAssignRequest) {
  return service.post(`system/user/${data.userId}/roles`, {
    userId: data.userId,
    roleIds: data.roleIds,
  })
}
