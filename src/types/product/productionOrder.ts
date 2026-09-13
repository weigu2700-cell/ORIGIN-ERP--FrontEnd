import type { PageResult } from '../common'
import { ProductionOrderStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type ProductionOrderStatusCode = EnumCodeOf<typeof ProductionOrderStatus>

export interface ProductionOrderQuery {
  pageNum: number
  pageSize: number
  productionOrderNo?: string
  productionDemandNo?: string
  materialId?: string
  status?: ProductionOrderStatusCode
  plannedStartTime?: string
  plannedEndTime?: string
  actualStartTime?: string
  actualEndTime?: string
}

export interface ProductionOrderAdd {
  productionDemandId: number | string
  materialId: string
  plannedQuantity: number
  plannedStartTime: string
  plannedEndTime: string
  remark?: string
}

export interface ProductionOrderVo {
  id: string
  productionOrderNo: string
  productionDemandId: string
  productionDemandNo: string
  materialId: string
  materialCode: string
  materialName: string
  plannedQuantity: number
  completedQuantity: number
  plannedStartTime: string
  plannedEndTime: string
  actualStartTime: string
  actualEndTime: string
  status: ProductionOrderStatusCode
  remark?: string
}

export type PageProductionOrderResponse = PageResult<ProductionOrderVo>
