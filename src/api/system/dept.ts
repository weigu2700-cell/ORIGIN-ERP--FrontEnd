import service from "@/utils/request.ts"
import type { PageResult } from '@/types/common'
import type {
  deptDetail,
  DeptQuery,
  deptResponse,
  deptTree,
  DeptAdd
} from "@/types/system/dept.ts"


export function getPageDeptList(data: DeptQuery) {
  return service.get<PageResult<deptResponse['records'][0]>>('/system/dept/list', {params: data})
}

export function getDeptTree() {
  return service.get<deptTree[]>('/system/dept/tree')
}

export function addDept(data: DeptAdd) {
  return service.post<void>('/system/dept/add', data)
}

export function getDetailDept(id: string) {
  return service.get<deptDetail>(`/system/dept/${id}`)
}

export function updateDept(data: DeptAdd) {
  return service.put<void>('/system/dept', data)
}