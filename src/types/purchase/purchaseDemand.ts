export interface PurchaseDemandVo {
  id: string
  purchaseDemandNo: string
  materialId: string
  purchaseQuantity: number
  sourceType: string
  sourceNo: string
  status: string
  createTime: Date
  updateTime: Date
}

export interface PagePurchaseDemandVo {
  records: PurchaseDemandVo[]
  total: number
  size: number
  current: number
  optimizeCountSql: string
  searchCount: string
}

export interface PagePurchaseDemandRequest {
  pageNum: number
  pageSize: number
  materialId?: string
  sourceType?: string
  sourceNo?: string
  status?: string
}

export interface CreatePurchaseDemandRequest {
  materialId: string
  sourceType: string
  sourceNo: string
  purchaseQuantity: number
}