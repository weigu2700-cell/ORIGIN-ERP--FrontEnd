import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPageProductionDemand } from '@/api/product/productionDemand'
import { getPageProductionOrder } from '@/api/product/productionOrder'
import { getPagePurchaseOrder } from '@/api/purchase/purchaseOrder'
import { getPageSalesOrder } from '@/api/sales/salesOrder'
import { getDashboardOverview } from '@/api/dashboard'

vi.mock('@/api/product/productionDemand', () => ({ getPageProductionDemand: vi.fn() }))
vi.mock('@/api/product/productionOrder', () => ({ getPageProductionOrder: vi.fn() }))
vi.mock('@/api/purchase/purchaseOrder', () => ({ getPagePurchaseOrder: vi.fn() }))
vi.mock('@/api/sales/salesOrder', () => ({ getPageSalesOrder: vi.fn() }))

const page = <T>(total: number, records: T[] = []) => ({ total, records, size: 1, current: 1 })

describe('getDashboardOverview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps real page totals into dashboard metrics and charts', async () => {
    vi.mocked(getPageProductionDemand).mockResolvedValue(page(7))
    vi.mocked(getPageProductionOrder)
      .mockResolvedValueOnce(page(2)).mockResolvedValueOnce(page(3)).mockResolvedValueOnce(page(4))
      .mockResolvedValueOnce(page(5)).mockResolvedValueOnce(page(1))
      .mockResolvedValueOnce(page(1, [{ id: 'p1', productionOrderNo: 'PO-1', materialName: '电机', plannedQuantity: 8, plannedStartTime: '2026-09-07T08:00:00' } as never]))
    vi.mocked(getPagePurchaseOrder)
      .mockResolvedValueOnce(page(6)).mockResolvedValueOnce(page(9))
      .mockResolvedValueOnce(page(1, [{ id: 'b1', purchaseOrderNo: 'PUR-1', supplierName: '供应商', materialName: '钢材', orderDate: '2026-09-07T09:00:00' } as never]))
    vi.mocked(getPageSalesOrder).mockResolvedValue(page(11))

    const result = await getDashboardOverview()

    expect(result.metrics).toEqual({
      pendingDemand: 7, draftProduction: 2, productionInProgress: 4,
      draftPurchase: 6, purchaseInTransit: 9, salesToDeliver: 11,
    })
    expect(result.productionStatus.map(item => item.value)).toEqual([2, 3, 4, 5, 1])
    expect(result.recentOrders.map(item => item.title)).toEqual(['PUR-1', 'PO-1'])
    expect(result.failedRequests).toBe(0)
  })
})
