import service from '@/utils/request'
import type {
  PageSalesDelivery,
  GetPageSalesDelivery,
  SalesDeliveryVo,
  PostSaleDelivery,
} from '@/types/sales/salesDelivery'

export function getPageSalesDelivery(data: GetPageSalesDelivery) {
  return service.get<PageSalesDelivery>('sales/delivery', { params: data })
}

export function getDetailSalesDelivery(id: string) {
  return service.get<SalesDeliveryVo>(`sales/delivery/${id}`)
}

export function addSalesDelivery(data: PostSaleDelivery) {
  return service.post<SalesDeliveryVo>('sales/delivery', data)
}

export function confirmSalesDelivery(id: string) {
  return service.put<SalesDeliveryVo>(`sales/delivery/${id}/confirm`)
}

export function completeSalesDelivery(id: string) {
  return service.put<SalesDeliveryVo>(`sales/delivery/${id}/complete`)
}

export function cancelSalesDelivery(id: string) {
  return service.put<SalesDeliveryVo>(`sales/delivery/${id}/cancel`)
}

export function removeSalesDelivery(id: string) {
  return service.del<void>(`sales/delivery/${id}`)
}
