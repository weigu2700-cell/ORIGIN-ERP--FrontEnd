import service from '@/utils/request'
import type {
  CreateProductionOrderRequest, 
  GetPageProductionOrderRequest,
  PageProductionOrderResponse, 
  ProductionOrderVo } from '../../types/product/productionOrder';

export function getPageProductionOrder (data:GetPageProductionOrderRequest) {
  return service.get<PageProductionOrderResponse>(
    '/prd/order',
    {params:data}
  )
}

export function getDetailProductionOrder (id:string) {
  return service.get<ProductionOrderVo>(
    `/prd/order/${id}`
  )
}

export function createProductionOrder (data:CreateProductionOrderRequest) {
  return service.post<void>(
    '/prd/order',
    data
  )
}

export function startProductionOrder (id:string) {
  return service.put<void>(
    `/prd/order/${id}/start`
  )
}

export function releaseProductionOrder (id:string) {
  return service.put<void>(
    `/prd/order/${id}/release`
  )
}
export function completeProductionOrder (id:string) {
  return service.put<void>(
    `/prd/order/${id}/complete`
  )
}

export function cancelProductionOrder (id:string) {
  return service.put<void>(
    `/prd/order/${id}/cancel`
  )
}
