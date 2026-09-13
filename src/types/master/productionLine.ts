import type { PageResult } from '../common'
import { EnableStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type ProductionLineStatus = EnumCodeOf<typeof EnableStatus>

export interface ProductionLineListRequest {
  page: number
  pageSize: number
  name?: string | null
  workshopId?: string | null
  status?: ProductionLineStatus | null
}

export interface ProductionLineVO {
  id: string
  name: string
  workshopId: string
  workshopName?: string
  capacityPerDay?: number
  remark?: string
  status: ProductionLineStatus
  createTime?: string
}

export type ProductionLineListResponse = PageResult<ProductionLineVO>

export interface ProductionLineCreateRequest {
  name: string
  workshopId: string
  status?: ProductionLineStatus
  capacityPerDay?: number
  remark?: string
}

export type ProductionLineUpdateRequest = ProductionLineCreateRequest
