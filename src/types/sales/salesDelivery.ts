import type { PageResult } from '../common'
import { SalesDeliveryStatus as SalesDeliveryStatusCode } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export interface SalesDeliveryVo {
  id: string
  deliveryNo: string
  salesOrderId: string
  salesOrderNo: string
  customerId: string
  customerName: string
  deliveryDate: string
  status: SalesDeliveryStatus
  items: SalesDeliveryItemVo[]
  remark: string
}

export type SalesDeliveryStatus = EnumCodeOf<typeof SalesDeliveryStatusCode>

export interface SalesDeliveryItemVo {
  id: number
  deliveryId: string
  lineNo: number
  salesOrderItemId: string
  materialId: string
  materialName: string
  materialCode: string
  warehouseId: string
  warehouseName: string
  quantity: number
}

export type PageSalesDelivery = PageResult<SalesDeliveryVo>

export interface GetPageSalesDelivery {
  pageNum: number
  pageSize: number
  deliveryNo: string
  salesOrderId: number | null
  customerId: number | null
  status: SalesDeliveryStatus | ''
}

export interface PostSaleDeliveryItem {
  salesOrderItemId: number
  quantity: number
}

export interface PostSaleDelivery {
  salesOrderId: string
  deliveryDate: string
  items: PostSaleDeliveryItem[]
  remark: string
}
