import type { PageResult } from '../common'
import { PurchaseDemandSourceType, PurchaseDemandStatus } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export interface PurchaseDemandVo {
  id: string
  purchaseDemandNo: string
  materialId: string
  purchaseQuantity: number
  sourceType: EnumCodeOf<typeof PurchaseDemandSourceType>
  sourceNo: string
  status: EnumCodeOf<typeof PurchaseDemandStatus>
  createTime: string
  updateTime: string
}

export type PagePurchaseDemandVo = PageResult<PurchaseDemandVo>

export interface PurchaseDemandQuery {
  pageNum: number
  pageSize: number
  materialId?: string
  sourceType?: EnumCodeOf<typeof PurchaseDemandSourceType> | ''
  sourceNo?: string
  status?: EnumCodeOf<typeof PurchaseDemandStatus> | ''
}

export interface PurchaseDemandAdd {
  materialId: string
  sourceType: EnumCodeOf<typeof PurchaseDemandSourceType>
  sourceNo: string
  purchaseQuantity: number
}
