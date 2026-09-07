import type { 
  PagePurchaseOrderRequest, 
  PagePurchaseOrderVo, 
  PurchaseOrderVo,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest
} from '@/types/purchase/purchaseOrder'
import service from '@/utils/request'

/**
 * 分页查询采购订单列表
 * @param request 查询参数
 * @returns 采购订单分页数据
 */
export function getPagePurchaseOrder(request: PagePurchaseOrderRequest) {
  return service.get<PagePurchaseOrderVo>(
    '/purchase/order',
    {params: request}
  )
}

/**
 * 获取采购订单详情
 * @param id 采购订单ID
 * @returns 采购订单详情
 */
export function getDetailPurchaseOrder(id: string) {
  return service.get<PurchaseOrderVo>(
    `/purchase/order/${id}`
  )
}

/**
 * 创建采购订单
 * @param request 采购订单数据
 * @returns 创建的采购订单
 */
export function createPurchaseOrder(request: CreatePurchaseOrderRequest) {
  return service.post<void>(
    '/purchase/order',
    request
  )
}

/**
 * 更新采购订单
 * @param id 采购订单ID
 * @param request 采购订单数据
 * @returns 更新后的采购订单
 */
export function updatePurchaseOrder(id: string, request: UpdatePurchaseOrderRequest) {
  return service.put<void>(
    `/purchase/order/${id}`,
    request
  )
}

/**
 * 确认采购订单
 * @param id 采购订单ID
 * @returns 更新后的采购订单
 */
export function approvePurchaseOrder(id: string) {
  return service.put<void>(
    `/purchase/order/${id}/approve`
  )
}

/**
 * 取消采购订单
 * @param id 采购订单ID
 * @returns 更新后的采购订单
 */
export function shipPurchaseOrder(id: string) {
  return service.put<void>(
    `/purchase/order/${id}/ship`
  )
}

/**
 * 完成采购订单
 * @param id 采购订单ID
 * @returns 更新后的采购订单
 */
export function receivePurchaseOrder(id: string) {
  return service.put<void>(
    `/purchase/order/${id}/receive`
  )
}

export function closePurchaseOrder(id: string) {
  return service.put<void>(`/purchase/order/${id}/close`)
}
