import service from "@/utils/request.ts"
import type { PageResult } from '@/types/common'
import type {
  FactoryAdd, FactoryUpdate, FactoryUpdateStatus,
  FactoryListRequest,
  FactoryVO
} from "@/types/master/factory.ts";

export function getFactoryList(data: FactoryListRequest) {
  return service.get<PageResult<FactoryVO>>('master/factory', {params: data})
}

export function getFactoryDetail(id: string) {
  return service.get<FactoryVO>(`master/factory/${id}`)
}

export function addFactory(data: FactoryAdd) {
  return service.post<void>('master/factory', data)
}

export function updateFactory(id: string,data: FactoryUpdate) {
  return service.put<void>(`master/factory/${id}`,data)
}

export function changeFactoryStatus(data: FactoryUpdateStatus) {
  return service.put<void>(`master/factory/${data.id}/status`, null, {params: {status: data.status}})
}