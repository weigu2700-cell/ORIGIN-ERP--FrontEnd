import { PurchaseInStockStatus, PurchaseInStockType } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export interface PurchaseInStock {
  id: string
  purchaseInStockNo: string
  purchaseOrderId: string
  purchaseOrderNo: string
  supplierId: string
  supplierName: string
  supplierCode: string
  materialId: string
  materialName: string
  materialCode: string
  warehouseId: string
  warehouseName: string
  warehouseCode: string
  storageLocation: string
  batchNo?: string
  inType: EnumCodeOf<typeof PurchaseInStockType>
  status: EnumCodeOf<typeof PurchaseInStockStatus>
  remark: string
  inQuantity: number
  unitPrice: number
  totalAmount: number
  productionDate: string
  deliveryDate: string
  expiryDate: string
  operator?: string
  inDate?: string
  createTime: string
  updateTime: string
}

export interface PurchaseInStockPage {
  total: number
  size: number
  current: number
  pages: number
  optimizeCountSql?: string
  searchCount?: string
  records: PurchaseInStock[]
}

export interface PurchaseInStockQuery {
  pageNum: number
  pageSize: number
  purchaseInStockNo: string
  purchaseOrderNo: string
  materialId: string
  supplierId: string
  warehouseId: string
  storageLocation: string
  operator: string
  inType: EnumCodeOf<typeof PurchaseInStockType> | ''
  productionDate: string
  deliveryDate: string
  status: EnumCodeOf<typeof PurchaseInStockStatus> | ''
}

export interface PurchaseInStockUpload {
  warehouseId?: string | number | null
  storageLocation: string
  batchNo?: string
  productionDate?: string
  expiryDate?: string
}
