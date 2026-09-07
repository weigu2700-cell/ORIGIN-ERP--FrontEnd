import type { 
  PagePurchaseDemandRequest,
  PagePurchaseDemandVo, 
  PurchaseDemandVo,
  CreatePurchaseDemandRequest
} from '@/types/purchase/purchaseDemand'
import service from '@/utils/request'

/**
 * 分页查询采购需求列表
 * @param request 查询参数
 * @returns 采购需求分页数据
 */
export function getPagePurchaseDemand(request: PagePurchaseDemandRequest) {
  return service.get<PagePurchaseDemandVo>('/purchase/demand', {
    params: request
  })
}

/**
 * 获取采购需求详情
 * @param id 采购需求ID
 * @returns 采购需求详情
 */
export function getDetailPurchaseDemand(id: string) {
  return service.get<PurchaseDemandVo>(
    `/purchase/demand/${id}`
  )
}

/**
 * 创建采购需求
 * @param request 采购需求数据
 * @returns 创建的采购需求
 */
export function createPurchaseDemand(request: CreatePurchaseDemandRequest) {
  return service.post<PurchaseDemandVo>(
    '/purchase/demand',
    request
  )
}

/**
 * 关闭采购需求
 * @param id 采购需求ID
 * @returns 更新后的采购需求
 */
export function closePurchaseDemand(id:string) {
  return service.put<void>(
    `/purchase/demand/${id}/close`
  )
}

/**
 * 审批采购需求
 * @param id 采购需求ID
 * @returns 更新后的采购需求
 */
export function approvePurchaseDemand(id:string) {
  return service.put<void>(
    `/purchase/demand/${id}/approve`
  )
}
