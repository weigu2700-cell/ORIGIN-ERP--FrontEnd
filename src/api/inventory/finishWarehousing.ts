import service from '@/utils/request'
import type {
  FinishWarehousing,
  FinishWarehousingPage,
  FinishWarehousingQuery,
} from '@/types/inventory/finishWarehousing'

export const getPageFinishWarehousing = (params: FinishWarehousingQuery) =>
  service.get<FinishWarehousingPage>('/inv/finish-warehousing', { params })
export const getDetailFinishWarehousing = (id: string) =>
  service.get<FinishWarehousing>(`/inv/finish-warehousing/${id}`)
export const approveFinishWarehousing = (id: string) => service.put<boolean>(`/inv/finish-warehousing/${id}/approve`)
export const warehouseFinishWarehousing = (id: string) =>
  service.put<boolean>(`/inv/finish-warehousing/${id}/warehouse`)
export const cancelFinishWarehousing = (id: string) => service.put<boolean>(`/inv/finish-warehousing/${id}/cancel`)
