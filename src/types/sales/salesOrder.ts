import type { PageResult } from '../common'

export interface SalesOrderVo {
  id: string
  orderNo: string
  customerId: string
  customerName: string
  orderDate: Date
  deliveryDate: Date
  totalAmount: number
  remark: string
  status: SalesOrderStatus
  items: SalesOrderItemVo[]
}

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export interface SalesOrderItemVo {
  id: string
  lineNo: number
  salesOrderId: string
  materialId: string
  materialCode: string
  materialName: string
  warehouseId: string
  warehouseName: string
  quantity: number
  unitPrice: number
  amount: number
}

export type PageSalesOrder = PageResult<SalesOrderVo>

export interface PostOrPutSalesOrderItem {
  materialId: number
  warehouseId: number
  quantity: number
  unitPrice: number
}

export interface PostOrPutSalesOrder {
  customerId: string
  orderDate: string
  deliveryDate: string
  remark: string
  items: PostOrPutSalesOrderItem[]
}

export interface GetPageSalesOrderQuery {
  pageNum: number
  pageSize: number
  orderNo: string
  customerId: string
  status: SalesOrderStatus | '' | null
}
