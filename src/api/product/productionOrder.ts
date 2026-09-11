import service from '@/utils/request'
import type { PageResult } from '@/types/common'
import type {
  ProductionOrderAdd, 
  ProductionOrderQuery,
  ProductionOrderVo } from '../../types/product/productionOrder';

export function getPageProductionOrder (data:ProductionOrderQuery) {
  return service.get<PageResult<ProductionOrderVo>>(
    '/prd/order',
    {params:data}
  )
}

export function getDetailProductionOrder (id:string) {
  return service.get<ProductionOrderVo>(
    `/prd/order/${id}`
  )
}

export function createProductionOrder (data:ProductionOrderAdd) {
  return service.post(
    '/prd/order',
    data
  )
}

export function startProductionOrder (id:string) {
  return service.put(
    `/prd/order/${id}/start`
  )
}

export function releaseProductionOrder (id:string) {
  return service.put(
    `/prd/order/${id}/release`
  )
}

export function completeProductionOrder (id:string) {
  return service.put(
    `/prd/order/${id}/complete`
  )
}

export function cancelProductionOrder (id:string) {
  return service.put(
    `/prd/order/${id}/cancel`
  )
}