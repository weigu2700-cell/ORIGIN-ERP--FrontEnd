import type { PageResult } from '../common'
import { EnableStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type WorkshopStatus = EnumCodeOf<typeof EnableStatus>

export interface WorkshopVO {
  id: string
  name: string
  shortName?: string
  factoryId: string
  factoryName?: string
  remark?: string
  status: WorkshopStatus
}

export interface WorkshopListRequest {
  page: number
  pageSize: number
  name?: string | null
  code?: string | null
  factoryId?: string | null
  status?: WorkshopStatus | null
}

export interface WorkshopCreateRequest {
  name: string
  factoryId: string
  shortName?: string
  status?: WorkshopStatus
  remark?: string
}

export interface WorkshopUpdateRequest {
  name?: string
  shortName?: string
  factoryId?: string
  remark?: string
}

export interface WorkshopStatusChangeRequest {
  id: string
  status: WorkshopStatus
}

export type WorkshopListResponse = PageResult<WorkshopVO>
