import type { PageResult } from '../common'

export interface PurchaseDemandVo {
  id: string
  purchaseDemandNo: string
  materialId: string
  purchaseQuantity: number
  sourceType: string
  sourceNo: string
  status: string
  createTime: string
  updateTime: string
}

export type PagePurchaseDemandVo = PageResult<PurchaseDemandVo>

export interface PurchaseDemandQuery {
  pageNum: number
  pageSize: number
  materialId?: string
  sourceType?: string
  sourceNo?: string
  status?: string
}

export interface PurchaseDemandAdd {
  materialId: string
  sourceType: string
  sourceNo: string
  purchaseQuantity: number
}