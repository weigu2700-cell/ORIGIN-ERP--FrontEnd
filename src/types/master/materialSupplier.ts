import type { PageResult } from '../common'
import { MaterialSupplierStatus as MaterialSupplierStatusCode } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type MaterialSupplierStatus = EnumCodeOf<typeof MaterialSupplierStatusCode>

export interface MaterialSupplierListRequest {
  page: number
  pageSize: number
  materialSupplierCode?: string | null
  materialId?: string | null
  supplierId?: string | null
  status?: MaterialSupplierStatus | null
  preferred?: number | null
}

export interface MaterialSupplierVO {
  id: string
  materialSupplierCode: string
  materialName?: string
  supplierName?: string
  purchasePrice?: number
  leadTimeDays?: number
  preferred?: number
  minOrderQty?: number
  remark?: string
  status?: MaterialSupplierStatus
}

export type MaterialSupplierListResponse = PageResult<MaterialSupplierVO>

export interface MaterialSupplierCreateRequest {
  materialId: string
  supplierId: string
  materialSupplierCode: string
  purchasePrice?: number
  leadTimeDays?: number
  preferred?: number
  minOrderQty?: number
  status?: MaterialSupplierStatus
  remark?: string
}

// 注意：UpdateDTO 不含 materialId / supplierId，通过路径 id 定位关联关系
export interface MaterialSupplierUpdateRequest {
  materialSupplierCode: string
  purchasePrice?: number
  leadTimeDays?: number
  preferred?: number
  minOrderQty?: number
  remark?: string
}
