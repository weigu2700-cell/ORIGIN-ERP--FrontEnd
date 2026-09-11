export interface PurchaseInStock {
  id: string;
  purchaseInStockNo: string;
  purchaseOrderId: string;
  purchaseOrderNo: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  storageLocation: string;
  inType: string;
  remark: string;
  inQuantity: number;
  unitPrice: number;
  totalAmount: number;
  productionDate: string;
  deliveryDate: string;
  expiryDate: string;
  createTime: string;
  updateTime: string;
}

export interface PurchaseInStockPage {
  total: number;
  size: number;
  current: number;
  pages: number;
  optimizeCountSql?: string;
  searchCount?: string;
  records: PurchaseInStock[];
}

export interface PurchaseInStockQuery {
  pageNum: number;
  pageSize: number;
  purchaseInStockNo: string;
  purchaseOrderNo: string;
  materialId: string;
  supplierId: string;
  warehouseId: string;
  storageLocation: string;
  operator: string;
  inType: string;
  productionDate: string;
  deliveryDate: string;
}