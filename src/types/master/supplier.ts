import type { PageResult } from '../common'
import { SupplierStatus as SupplierStatusCode } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type SupplierStatus = EnumCodeOf<typeof SupplierStatusCode>

export interface SupplierListRequest {
  page: number
  pageSize: number
  code?: string | null
  name?: string | null
  shortName?: string | null
  contactName?: string | null
  phone?: string | null
  email?: string | null
  status?: SupplierStatus | null
}

export interface SupplierVO {
  id: string
  code: string
  name: string
  shortName?: string
  contactName?: string
  address?: string
  phone?: string
  email?: string
  remark?: string
  status?: SupplierStatus
  createdTime?: string
}

export type SupplierListResponse = PageResult<SupplierVO>

export interface SupplierCreateRequest {
  name: string
  shortName?: string
  contactName?: string
  address?: string
  phone?: string
  email?: string
  status?: SupplierStatus
  remark?: string
}

export type SupplierUpdateRequest = SupplierCreateRequest
