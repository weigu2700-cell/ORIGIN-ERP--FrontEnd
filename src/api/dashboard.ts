import { getPageProductionDemand } from '@/api/product/productionDemand'
import { getPageProductionOrder } from '@/api/product/productionOrder'
import { getPagePurchaseOrder } from '@/api/purchase/purchaseOrder'
import { getPageSalesOrder } from '@/api/sales/salesOrder'
import type { PageResult } from '@/types/common'
import type { ProductionOrderVo } from '@/types/product/productionOrder'
import type { PurchaseOrderVo } from '@/types/purchase/purchaseOrder'

export interface DashboardOverview {
  metrics: {
    pendingDemand: number
    draftProduction: number
    productionInProgress: number
    draftPurchase: number
    purchaseInTransit: number
    salesToDeliver: number
  }
  productionStatus: Array<{ name: string; value: number }>
  recentOrders: Array<{ id: string; title: string; detail: string; time: string; path: string; tone: string }>
  failedRequests: number
}

const totalOf = (result: PromiseSettledResult<{ total: number }>) => result.status === 'fulfilled' ? result.value.total : 0

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const requests = [
    getPageProductionDemand({ pageNum: 1, pageSize: 1, status: 'PENDING' }),
    ...[0, 1, 2, 3, 4].map(status => getPageProductionOrder({ pageNum: 1, pageSize: 1, status })),
    getPagePurchaseOrder({ pageNum: 1, pageSize: 1, status: 'DRAFT' }),
    getPagePurchaseOrder({ pageNum: 1, pageSize: 1, status: 'SHIPPED' }),
    getPageSalesOrder({ pageNum: 1, pageSize: 1, orderNo: '', customerId: '', status: 1 }),
    getPageProductionOrder({ pageNum: 1, pageSize: 4 }),
    getPagePurchaseOrder({ pageNum: 1, pageSize: 4 }),
  ] as const
  const results = await Promise.allSettled(requests)
  const totals = results.slice(0, 9).map(result => totalOf(result as PromiseSettledResult<{ total: number }>))
  const productionResult = results[9]
  const purchaseResult = results[10]
  const productionRecent = productionResult?.status === 'fulfilled'
    ? (productionResult.value as PageResult<ProductionOrderVo>).records
    : []
  const purchaseRecent = purchaseResult?.status === 'fulfilled'
    ? (purchaseResult.value as PageResult<PurchaseOrderVo>).records
    : []

  const recentOrders = [
    ...productionRecent.map(row => ({
      id: `production-${row.id}`,
      title: row.productionOrderNo,
      detail: `${row.materialName ?? '未知物料'} · 计划 ${row.plannedQuantity ?? 0}`,
      time: row.plannedStartTime ?? '',
      path: '/product/productionOrder',
      tone: 'production',
    })),
    ...purchaseRecent.map(row => ({
      id: `purchase-${row.id}`,
      title: row.purchaseOrderNo,
      detail: `${row.supplierName ?? '供应商待补充'} · ${row.materialName ?? '未知物料'}`,
      time: row.orderDate ?? '',
      path: '/purchase/purchaseOrder',
      tone: 'purchase',
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6)

  return {
    metrics: {
      pendingDemand: totals[0] ?? 0,
      draftProduction: totals[1] ?? 0,
      productionInProgress: totals[3] ?? 0,
      draftPurchase: totals[6] ?? 0,
      purchaseInTransit: totals[7] ?? 0,
      salesToDeliver: totals[8] ?? 0,
    },
    productionStatus: ['草稿', '已下达', '生产中', '已完成', '已取消'].map((name, index) => ({
      name,
      value: totals[index + 1] ?? 0,
    })),
    recentOrders,
    failedRequests: results.filter(result => result.status === 'rejected').length,
  }
}