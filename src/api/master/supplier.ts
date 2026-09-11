import service from "@/utils/request.ts"
import type {
  SupplierCreateRequest,
  SupplierListRequest,
  SupplierListResponse,
  SupplierStatus,
  SupplierUpdateRequest,
  SupplierVO
} from "@/types/master/supplier.ts";

export function getPageSupplierList(data: SupplierListRequest) {
  return service.get<SupplierListResponse>('master/supplier/list', {params: data})
}

export function getDetailSupplier(id: string) {
  return service.get<SupplierVO>(`master/supplier/${id}`)
}

export function addSupplier(data: SupplierCreateRequest) {
  return service.post<void>('master/supplier', data)
}

export function updateSupplier(id: string, data: SupplierUpdateRequest) {
  return service.put<void>(`master/supplier/${id}`, data)
}

// 注意：供应商状态变更 body 是原始字符串 "ACTIVE"/"INACTIVE"，不是 JSON 对象
export function changeSupplierStatus(id: string, status: SupplierStatus) {
  return service.put<void>(`master/supplier/${id}/status`, status)
}