import service from "@/utils/request.ts"
import type {
  CustomerCreateRequest,
  CustomerListRequest,
  CustomerListResponse,
  CustomerStatus,
  CustomerStatusChangeRequest,
  CustomerUpdateRequest,
  CustomerVO
} from "@/types/master/customer.ts";

export function getPageCustomerList(data: CustomerListRequest) {
  return service.get<CustomerListResponse>('master/customer/list', {params: data})
}

export function getDetailCustomer(id: string) {
  return service.get<CustomerVO>(`master/customer/${id}`)
}

export function addCustomer(data: CustomerCreateRequest) {
  return service.post<void>('master/customer', data)
}

// 注意：客户更新是 PUT master/customer（无路径 id），id 在 body 里
export function updateCustomer(data: CustomerUpdateRequest) {
  return service.put<CustomerVO>('master/customer', data)
}

export function changeCustomerStatus(id: string, status: CustomerStatus) {
  return service.put<void>(`master/customer/${id}/status`, {status} as unknown as CustomerStatusChangeRequest)
}