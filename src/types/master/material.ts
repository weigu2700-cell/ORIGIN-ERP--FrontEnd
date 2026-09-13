import type { PageResult } from '../common'
import { MaterialStatus as MaterialStatusCode, MaterialType as MaterialTypeCode } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type MaterialStatus = EnumCodeOf<typeof MaterialStatusCode> | string
export type MaterialType = EnumCodeOf<typeof MaterialTypeCode> | string

export interface MaterialListRequest {
  page: number
  pageSize: number
  name?: string | null
  code?: string | null
  spec?: string | null
  type?: string | null
  status?: MaterialStatus | null
}

export interface MaterialVO {
  id: string
  code: string
  name: string
  spec?: string
  type?: MaterialType
  status?: MaterialStatus
  unit?: string
  safetyStock?: number
  remark?: string
}

export type MaterialListResponse = PageResult<MaterialVO>

export interface MaterialCreateRequest {
  name: string
  unit?: string
  spec?: string
  type: MaterialType
  status?: MaterialStatus
  safetyStock?: number
  remark?: string
}

// 注意：MaterialUpdateDTO 没有 type 字段
export interface MaterialUpdateRequest {
  name: string
  spec?: string
  unit?: string
  safetyStock?: number
  remark?: string
}
