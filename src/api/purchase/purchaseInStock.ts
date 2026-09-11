import type { PurchaseInStock, PurchaseInStockPage, PurchaseInStockQuery } from "@/types/purchase/purchaseInStock"
import service from "@/utils/request"


export function getPagePurchaseInStock(query: PurchaseInStockQuery) {
  return service.get<PurchaseInStockPage>(
    "/purchase/in/stock", 
    {params: query}
  )
}


export function getDetailPurchaseInStock(id: string) {
  return service.get<PurchaseInStock>(
    `/purchase/in/stock/${id}`
  )
}