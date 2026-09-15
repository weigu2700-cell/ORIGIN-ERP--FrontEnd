import { beforeEach, describe, expect, it, vi } from 'vitest'
import service from '@/utils/request'
import { getDashboardOverview, type DashboardOverview } from '@/api/dashboard'

vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
  },
}))

const mockBackendResponse: DashboardOverview = {
  pendingProductionDemandCount: 7,
  productionOrderStatusCount: {
    '0': 2,
    '1': 3,
    '2': 4,
    '3': 5,
    '4': 1,
  },
  draftPurchaseOrderCount: 6,
  shippedPurchaseOrderCount: 9,
  confirmedSalesOrderCount: 11,
  recentProductionOrders: [
    {
      id: 'p1',
      productionOrderNo: 'PO-1',
      materialName: '电机',
      plannedQuantity: 8,
      plannedStartTime: '2026-09-07T08:00:00',
    },
  ] as DashboardOverview['recentProductionOrders'],
  recentPurchaseOrders: [
    {
      id: 'b1',
      purchaseOrderNo: 'PUR-1',
      supplierName: '供应商',
      materialName: '钢材',
      orderDate: '2026-09-07T09:00:00',
    },
  ] as DashboardOverview['recentPurchaseOrders'],
  recentSalesOrders: [],
}

describe('getDashboardOverview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls /system/dashboard and returns dashboard data', async () => {
    vi.mocked(service.get).mockResolvedValue(mockBackendResponse)

    const result = await getDashboardOverview()

    expect(service.get).toHaveBeenCalledWith('/system/dashboard')
    expect(result).toEqual(mockBackendResponse)
  })
})
