import type { PageResult } from '../common'
import { PurchaseOrderStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export interface PurchaseOrderVo {
  id: string
  purchaseOrderNo: string
  purchaseDemandId: string
  purchaseDemandNo: string
  materialId: string
  materialName: string
  materialCode: string
  supplierId: string
  supplierName: string
  supplierCode: string
  plannedQuantity: number
  completeQuantity: number
  unitPrice: number
  totalAmount: number
  orderDate?: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  status: EnumCodeOf<typeof PurchaseOrderStatus>
}

export type PagePurchaseOrderVo = PageResult<PurchaseOrderVo>

export interface PurchaseOrderQuery {
  pageNum: number
  pageSize: number
  purchaseOrderNo?: string
  materialId?: string
  supplierId?: string
  status?: EnumCodeOf<typeof PurchaseOrderStatus> | ''
}

export interface PurchaseOrderAdd {
  materialId: string
  supplierId: string
  purchaseDemandId: string
  unitPrice: number
  plannedQuantity: number
  expectedDeliveryDate: string
}

export interface PurchaseOrderUpdate {
  supplierId: string
  unitPrice: number
  plannedQuantity: number
  expectedDeliveryDate: string
}
