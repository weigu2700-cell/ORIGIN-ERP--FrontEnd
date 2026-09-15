import service from '@/utils/request'
import type { ProductionOrderVo } from '@/types/product/productionOrder'
import type { PurchaseOrderVo } from '@/types/purchase/purchaseOrder'
import type { SalesOrderVo } from '@/types/sales/salesOrder'

export interface DashboardOverview {
  pendingProductionDemandCount: number
  productionOrderStatusCount: Record<string, number>
  draftPurchaseOrderCount: number
  shippedPurchaseOrderCount: number
  confirmedSalesOrderCount: number
  recentProductionOrders: ProductionOrderVo[]
  recentPurchaseOrders: PurchaseOrderVo[]
  recentSalesOrders: SalesOrderVo[]
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return service.get<DashboardOverview>('/system/dashboard')
}
