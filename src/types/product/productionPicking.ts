import { ProductionPickingStatus as ProductionPickingStatusCode } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export type ProductionPickingStatus = EnumCodeOf<typeof ProductionPickingStatusCode>

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
  status: ProductionPickingStatus
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
