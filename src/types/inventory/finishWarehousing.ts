import type { PageResult } from '@/types/common'
import { FinishWarehousingStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type FinishWarehousingStatusCode = EnumCodeOf<typeof FinishWarehousingStatus>

export interface FinishWarehousingQuery {
  pageNum: number
  pageSize: number
  warehousingNo?: string
  productionOrderId?: string
  productionReportId?: string
  materialId?: string
  warehouseId?: string
  warehousingUserId?: string
  warehousingTime?: string
  status?: FinishWarehousingStatusCode | ''
}

export interface FinishWarehousing {
  id: string
  warehousingNo: string
  productionOrderId?: string
  productionReportId?: string
  materialId?: string
  warehouseId?: string
  productionOrderNo?: string
  productionReportNo?: string
  materialName?: string
  materialCode?: string
  warehouseName?: string
  warehousingQuantity?: number
  warehousingUserName?: string
  warehousingTime?: string
  status: FinishWarehousingStatusCode
  remark?: string
}

export type FinishWarehousingPage = PageResult<FinishWarehousing>
