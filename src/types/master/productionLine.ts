import type { PageResult } from '../common'
import { EnableStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type ProductionLineStatus = EnumCodeOf<typeof EnableStatus> | string

export interface ProductionLineListRequest {
  page: number
  pageSize: number
  name?: string | null
  workshopId?: string | null
  status?: number | null
}

export interface ProductionLineVO {
  id: string
  name: string
  workshopId: string
  workshopName?: string
  capacityPerDay?: number
  remark?: string
  status: number
  createTime?: string
}

export type ProductionLineListResponse = PageResult<ProductionLineVO>

export interface ProductionLineCreateRequest {
  name: string
  workshopId: string
  status?: number
  capacityPerDay?: number
  remark?: string
}

export type ProductionLineUpdateRequest = ProductionLineCreateRequest
