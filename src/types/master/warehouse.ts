import type { PageResult } from '../common'
import { EnableStatus, WarehouseType as WarehouseTypeCode } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type WarehouseStatus = EnumCodeOf<typeof EnableStatus>
export type WarehouseType = EnumCodeOf<typeof WarehouseTypeCode>

export interface WarehouseListRequest {
  page: number
  pageSize: number
  name?: string | null
  code?: string | null
  factoryId?: string | null
  type?: WarehouseType | null
  status?: WarehouseStatus | null
}

export interface WarehouseVO {
  id: string
  name: string
  code: string
  type: WarehouseType
  address?: string
  remark?: string
  factoryId: string
  factoryName?: string
  status?: WarehouseStatus
}

export type WarehouseListResponse = PageResult<WarehouseVO>

export interface WarehouseCreateRequest {
  name: string
  type: WarehouseType
  factoryId: string
  status?: WarehouseStatus
  address?: string
  remark?: string
}

export interface WarehouseUpdateRequest {
  name: string
  address?: string
  remark?: string
}

export interface WarehouseStatusChangeRequest {
  status: WarehouseStatus
}
