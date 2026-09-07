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
  orderDate: Date
  expectedDeliveryDate: Date
  actualDeliveryDate: Date
  status: string
}

export interface PagePurchaseOrderVo {
  records: PurchaseOrderVo[]
  total: number
  size: number
  current: number
  optimizeCountSql: string
  searchCount: string
}

export interface PagePurchaseOrderRequest {
  pageNum: number
  pageSize: number
  purchaseOrderNo?: string
  materialId?: string
  supplierId?: string
  status?: string
}

export interface CreatePurchaseOrderRequest {
  materialId: string
  supplierId: string
  purchaseDemandId: string
  unitPrice: number
  plannedQuantity: number
  expectedDeliveryDate: Date
}

export interface UpdatePurchaseOrderRequest {
  supplierId: string
  unitPrice: number
  plannedQuantity: number
  expectedDeliveryDate: Date
}