import service from '@/utils/request'
import type { 
  GetPageProductionDemandRequest,
  PageProductionDemandVo, 
  ProductionDemandVo } from '@/types/product/productionDemand';

export function getPageProductionDemand (data:GetPageProductionDemandRequest) {
  return service.get<PageProductionDemandVo>(
    '/prd/demand',
    {params:data}
  )
}

export function getDetailProductionDemand (id:string) {
  return service.get<ProductionDemandVo>(
    `/prd/demand/${id}`
  )
}