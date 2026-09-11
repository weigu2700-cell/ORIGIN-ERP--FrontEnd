import service from '@/utils/request'
import type { PageResult } from '@/types/common'
import type { 
  ProductionDemandQuery,
  ProductionDemandVo } from '@/types/product/productionDemand';

export function getPageProductionDemand (data:ProductionDemandQuery) {
  return service.get<PageResult<ProductionDemandVo>>(
    '/prd/demand',
    {params:data}
  )
}

export function getDetailProductionDemand (id:string) {
  return service.get<ProductionDemandVo>(
    `/prd/demand/${id}`
  )
}