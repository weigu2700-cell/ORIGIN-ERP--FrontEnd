export type ProductionPickingStatus = 'DRAFT' | 'APPROVED' | 'PICKED' | 'CANCELLED'

export interface ProductionPicking {
  id: string
  pickingNo: string
  productionOrderId: string
  productionOrderNo: string
  purchaseDemandId?: string | null
  purchaseDemandNo?: string | null
  materialId: string
  materialCode: string
  materialName: string
  warehouseId?: string | null
  warehouseName?: string | null
  plannedQuantity: number
  actualQuantity: number
  /** 后端当前可能返回枚举名、编码或中文描述，页面统一做兼容展示。 */
  status: ProductionPickingStatus | string | number
  pickingTime?: string | null
  createTime?: string | null
  updateTime?: string | null
}

export interface ProductionPickingQuery {
  pageNum: number
  pageSize: number
  productionOrderId?: string
  purchaseDemandId?: string
  materialId?: string
  warehouseId?: string
  status?: ProductionPickingStatus | ''
  pickingTimeStart?: string
  pickingTimeEnd?: string
}
