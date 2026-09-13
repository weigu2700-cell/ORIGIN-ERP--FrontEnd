import type { PageResult } from '../common'
import { EnableStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type WorkshopStatus = EnumCodeOf<typeof EnableStatus> | string

export interface WorkshopVO {
  id: string
  name: string
  shortName?: string
  factoryId: string
  factoryName?: string
  remark?: string
  status: number
}

export interface WorkshopListRequest {
  page: number
  pageSize: number
  name?: string | null
  code?: string | null
  factoryId?: string | null
  status?: number | null
}

export interface WorkshopCreateRequest {
  name: string
  factoryId: string
  shortName?: string
  status?: number
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
  status: number
}

export type WorkshopListResponse = PageResult<WorkshopVO>
