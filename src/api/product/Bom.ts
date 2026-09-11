import type { PageResult } from '@/types/common'
import type { BomExplosionVo, BomVo, BomAdd, BomQuery, MaterialRequirementVo } from '@/types/product/Bom'
import service from '@/utils/request'

export function getPageBom(data: BomQuery) {
  return service.get<PageResult<BomVo>>('/prd/bom', { params: data })
}

export function getDetailBom(id: string) {
  return service.get<BomVo>(`/prd/bom/${id}`)
}

export function createBom(data: BomAdd) {
  return service.post<void>('/prd/bom', data)
}

export function activateBom(id: string) {
  return service.put<void>(`/prd/bom/${id}`)
}

export function disableBom(id: string) {
  return service.put<void>(`/prd/bom/${id}/disable`)
}

export function getBomExplosion(materialId: string, quantity: number) {
  return service.get<BomExplosionVo[]>(`/prd/bom/${materialId}/explosion`, { params: { quantity } })
}

export function getMaterialRequirement(id: string, quantity: number) {
  return service.get<MaterialRequirementVo>(`/prd/bom/${id}/requirement`, { params: quantity })
}
