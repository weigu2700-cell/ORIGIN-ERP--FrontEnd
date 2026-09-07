import type {PageResult} from '../common'

export type MaterialStatus = 'ENABLE' | 'DISABLE'
export type MaterialType = 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'PACKAGING' | 'CONSUMABLE' | 'OTHER'

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
  type?: string
  status?: number
  unit?: string
  safetyStock?: number
  remark?: string
}

export interface MaterialListResponse extends PageResult<MaterialVO> {}

export interface MaterialCreateRequest {
  name: string
  unit?: string
  spec?: string
  type: MaterialType
  status?: number
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
