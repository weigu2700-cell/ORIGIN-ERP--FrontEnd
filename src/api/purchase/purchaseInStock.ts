import type {
  PurchaseInStock,
  PurchaseInStockPage,
  PurchaseInStockQuery,
  PurchaseInStockUpload,
} from '@/types/purchase/purchaseInStock'
import service from '@/utils/request'

export function getPagePurchaseInStock(query: PurchaseInStockQuery) {
  return service.get<PurchaseInStockPage>('/purchase/in/stock', { params: query })
}

export function getDetailPurchaseInStock(id: string) {
  return service.get<PurchaseInStock>(`/purchase/in/stock/${id}`)
}

export function approvePurchaseInStock(id: string) {
  return service.put<void>(`/purchase/in/stock/${id}/approve`)
}

export function uploadPurchaseInStock(id: string, data: PurchaseInStockUpload) {
  return service.put<void>(`/purchase/in/stock/${id}/upload`, data)
}
