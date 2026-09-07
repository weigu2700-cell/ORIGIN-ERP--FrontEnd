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
    '/purchase/order/page', 
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
    `/purchase/order/detail/${id}`
  )
}

/**
 * 创建采购订单
 * @param request 采购订单数据
 * @returns 创建的采购订单
 */
export function createPurchaseOrder(request: CreatePurchaseOrderRequest) {
  return service.post<PurchaseOrderVo>(
    '/purchase/order/create', 
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
  return service.put<PurchaseOrderVo>(
    `/purchase/order/update/${id}`, 
    request
  )
}

/**
 * 确认采购订单
 * @param id 采购订单ID
 * @returns 更新后的采购订单
 */
export function confirmPurchaseOrder(id: string) {
  return service.put<PurchaseOrderVo>(
    `/purchase/order/${id}/confirm`
  )
}

/**
 * 取消采购订单
 * @param id 采购订单ID
 * @returns 更新后的采购订单
 */
export function cancelPurchaseOrder(id: string) {
  return service.put<PurchaseOrderVo>(
    `/purchase/order/${id}/cancel`
  )
}

/**
 * 完成采购订单
 * @param id 采购订单ID
 * @returns 更新后的采购订单
 */
export function completePurchaseOrder(id: string) {
  return service.put<PurchaseOrderVo>(
    `/purchase/order/${id}/complete`
  )
}