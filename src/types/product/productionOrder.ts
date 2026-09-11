import type { PageResult } from '../common'

export interface ProductionOrderQuery {
  pageNum: number
  pageSize: number
  productionOrderNo?: string
  productionDemandNo?: string
  materialId?: string
  status?: number
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
  actualQuantity: number
  plannedStartTime: string
  plannedEndTime: string
  actualStartTime: string
  actualEndTime: string
  status: number
  remark?: string
}

export type PageProductionOrderResponse = PageResult<ProductionOrderVo>