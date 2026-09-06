import type { BomExplosionVo, BomVo, CreateBomRequest, GetPageBomRequest, GetPageBomResponse, MaterialRequirementVo } from "@/types/product/Bom";
import service from "@/utils/request";

export function getPageBom (data:GetPageBomRequest) {
  return service.get<GetPageBomResponse>(
  '/prd/bom', 
  {params:data}
  )
}

export function getDetailBom (id:string) {
  return service.get<BomVo>(
    `/prd/bom/${id}`
  )
}

export function createBom (data:CreateBomRequest) {
  return service.post<void>(
    '/prd/bom',
    data
  )
}

export function getBomExplosion (materialId:string, quantity:number) {
  return service.get<BomExplosionVo[]>(
    `/prd/bom/${materialId}/explosion`,
    { params: { quantity } }
  )
}

export function getMaterialRequirement (id:string, quantity:number) {
  return service.get<MaterialRequirementVo>(
    `/prd/bom/${id}/requirement`,
    {params:quantity}
  )
}
