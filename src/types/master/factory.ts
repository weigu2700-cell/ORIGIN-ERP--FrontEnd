import type { PageResult } from '../common'
import { EnableStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type FactoryStatus = EnumCodeOf<typeof EnableStatus> | string

export interface FactoryListRequest {
  page: number
  pageSize: number
  name?: string | null
  code?: string | null
  shortName?: string | null
  status?: number | null
}

export interface FactoryVO {
  id: string
  name: string
  code: string
  shortName: string
  status: number
  address?: string
  remark?: string
}

export type FactoryListResponse = PageResult<FactoryVO>

export interface FactoryAdd {
  name: string
  shortName: string
  status?: number
  address?: string
  remark?: string
}

export interface FactoryUpdate extends FactoryAdd {
  id: string
}

export interface FactoryUpdateStatus {
  id: string
  status: FactoryStatus
}
