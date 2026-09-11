import type { PageResult } from '@/types/common'
import type { ProductionPicking, ProductionPickingQuery } from '@/types/product/productionPicking'
import service from '@/utils/request'

export function getPageProductionPicking(query: ProductionPickingQuery) {
  return service.get<PageResult<ProductionPicking>>('/prd/picking', { params: query })
}

export function approveProductionPicking(id: string) {
  return service.put<void>(`/prd/picking/${id}/approve`)
}

export function confirmProductionPicking(id: string) {
  return service.post<void>('/prd/picking/confirm', undefined, { params: { id } })
}
