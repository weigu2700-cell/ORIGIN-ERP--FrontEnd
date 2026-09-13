import type { PageResult } from '../common'
import { EnableStatus, PermissionType as PermissionTypeCode } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type PermissionType = EnumCodeOf<typeof PermissionTypeCode>
export type PermissionStatus = EnumCodeOf<typeof EnableStatus>

// 权限记录 / 树节点（PermissionTreeVO）
export interface PermissionNode {
  id: string
  name: string
  code: string
  type: PermissionType
  parentId: string | null
  parentName: string | null
  sort: number
  status: PermissionStatus
  remark: string | null
  children?: PermissionNode[]
}

// 分页查询参数（PermissionGetDTO）
export interface PermissionListRequest {
  page: number
  pageSize: number
  name?: string | null
  code?: string | null
  type?: PermissionType | null
  status?: PermissionStatus | null
  parentId?: string | null
}

// 分页列表响应（PagePermissionTreeVO）
export type PermissionListResponse = PageResult<PermissionNode>

// 新增参数（PermissionCreateDTO）
export interface PermissionCreateRequest {
  name: string
  code: string
  type: PermissionType
  parentId?: string | null
  sort?: number
  status: PermissionStatus
  remark?: string | null
}

// 更新参数（PermissionUpdateDTO，以 query 参数传递）
export interface PermissionUpdateRequest {
  id: string
  name: string
  code: string
  type: PermissionType
  parentId?: string | null
  status: PermissionStatus
  remark?: string | null
}

// 新增/编辑共用表单，id 用于编辑
export interface PermissionSaveRequest {
  id?: string
  name: string
  code: string
  type: PermissionType
  parentId?: string | null
  sort?: number
  status: PermissionStatus
  remark?: string | null
}
