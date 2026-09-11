import service from "@/utils/request.ts"
import type {
  MaterialSupplierCreateRequest,
  MaterialSupplierListRequest,
  MaterialSupplierListResponse,
  MaterialSupplierUpdateRequest,
  MaterialSupplierVO
} from "@/types/master/materialSupplier.ts";

export function getPageMaterialSupplierList(data: MaterialSupplierListRequest) {
  return service.get<MaterialSupplierListResponse>('master/material-supplier', {params: data})
}

export function getDetailMaterialSupplier(id: string) {
  return service.get<MaterialSupplierVO>(`master/material-supplier/${id}`)
}

export function addMaterialSupplier(data: MaterialSupplierCreateRequest) {
  return service.post<void>('master/material-supplier', data)
}

export function updateMaterialSupplier(id: string, data: MaterialSupplierUpdateRequest) {
  return service.put<void>(`master/material-supplier/${id}`, data)
}

// 状态变更无 body
export function changeMaterialSupplierStatus(id: string) {
  return service.put<void>(`master/material-supplier/${id}/status`)
}

// 设置优选供应商，supplier 为 query 参数
export function setPreferredSupplier(id: string, supplier: string) {
  return service.put<void>(`master/material-supplier/${id}/preferred`, null, {params: {supplier}})
}