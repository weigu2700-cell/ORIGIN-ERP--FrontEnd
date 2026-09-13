import type { PageResult } from '../common'
import { CustomerStatus as CustomerStatusCode } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type CustomerStatus = EnumCodeOf<typeof CustomerStatusCode>

export interface CustomerListRequest {
  page: number
  pageSize: number
  name?: string | null
  code?: string | null
  status?: CustomerStatus | null
}

export interface CustomerVO {
  id: string
  name: string
  code: string
  shortName?: string
  contactName?: string
  address?: string
  contact?: string
  phone?: string
  email?: string
  remark?: string
  status?: CustomerStatus
  createdTime?: string
}

export type CustomerListResponse = PageResult<CustomerVO>

export interface CustomerCreateRequest {
  name: string
  shortName?: string
  contactName?: string
  address?: string
  phone?: string
  email?: string
  status?: CustomerStatus
  remark?: string
}

export interface CustomerUpdateRequest extends CustomerCreateRequest {
  id?: string
  status?: CustomerStatus
}

export interface CustomerStatusChangeRequest {
  status: CustomerStatus
}
