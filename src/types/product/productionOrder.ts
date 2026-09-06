export interface GetPageProductionOrderRequest {
  pageNum: number
  pageSize: number
  productionOrderNo?: string
  productionDemandNo?: string
  materialId?: string
  status?: string
  plannedStartTime?: string
  plannedEndTime?: string
  actualStartTime?: string
  actualEndTime?: string
}

export interface CreateProductionOrderRequest {
  productionDemandId: number | string
  materialId: string
  plannedQuantity: number
  plannedStartTime: string
  plannedEndTime: string
  remark?: string
}

export interface ProductionOrderVo {
  id: string
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
  remark?: string
}

export interface PageProductionOrderResponse {
  records: ProductionOrderVo[]
  total: number
  size: number
  current: number
  optimizeCountSql?: string
  searchCount?: string
}