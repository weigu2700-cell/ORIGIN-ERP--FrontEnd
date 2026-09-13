import type { PageResult } from '@/types/common'
import { ProductionReportStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type ProductionReportStatusCode = EnumCodeOf<typeof ProductionReportStatus>

export interface ProductionReportQuery {
  pageNum: number
  pageSize: number
  productionOrderId?: string
  productionReportNo?: string
  materialId?: string
  reportUserId?: string
  reportTime?: string
  status?: ProductionReportStatusCode | ''
}

export interface ProductionReport {
  id: string
  productionReportNo: string
  productionOrderId: string
  productionOrderNo?: string
  materialId: string
  materialCode?: string
  materialName?: string
  reportUserId?: string
  reportUserName?: string
  reportTime?: string
  reportQuantity: number
  qualifiedQuantity: number
  scrappedQuantity: number
  status: ProductionReportStatusCode
  remark?: string
}

export type ProductionReportPage = PageResult<ProductionReport>

export interface ProductionReportAdd {
  productionOrderId: string
  materialId: string
  reportQuantity: number
  qualifiedQuantity: number
  scrappedQuantity: number
  reportTime?: string
  remark?: string
}
