import service from "@/utils/request.ts"
import type {
  MaterialStockCreateRequest,
  MaterialStockListRequest,
  MaterialStockListResponse,
  MaterialStockVO
} from "@/types/inventory/materialStock.ts";

export function getPageMaterialStockList(data: MaterialStockListRequest) {
  return service.get<MaterialStockListResponse>('inventory/material-stock', {params: data})
}

export function getDetailMaterialStock(id: string) {
  return service.get<MaterialStockVO>(`inventory/material-stock/${id}`)
}

export function addMaterialStock(data: MaterialStockCreateRequest) {
  return service.post<MaterialStockVO>('inventory/material-stock', data)
}