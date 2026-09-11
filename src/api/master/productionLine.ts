import service from "@/utils/request.ts"
import type {
  ProductionLineCreateRequest,
  ProductionLineListRequest,
  ProductionLineListResponse,
  ProductionLineStatus,
  ProductionLineUpdateRequest,
  ProductionLineVO
} from "@/types/master/productionLine.ts";

export function getPageProductionLineList(data: ProductionLineListRequest) {
  return service.get<ProductionLineListResponse>('master/production_line', {params: data})
}

export function getDetailProductionLine(id: string) {
  return service.get<ProductionLineVO>(`master/production_line/${id}`)
}

export function addProductionLine(data: ProductionLineCreateRequest) {
  return service.post<void>('master/production_line', data)
}

export function updateProductionLine(id: string, data: ProductionLineUpdateRequest) {
  return service.put<void>(`master/production_line/${id}`, data)
}

// 注意：生产线状态变更 status 是 query 参数
export function changeProductionLineStatus(id: string, status: ProductionLineStatus) {
  return service.put<void>(`master/production_line/${id}/status`, null, {params: {status}})
}