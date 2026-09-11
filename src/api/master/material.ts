import service from "@/utils/request.ts"
import type {
  MaterialCreateRequest,
  MaterialListRequest,
  MaterialListResponse,
  MaterialStatus,
  MaterialUpdateRequest,
  MaterialVO
} from "@/types/master/material.ts";

export function getPageMaterialList(data: MaterialListRequest) {
  return service.get<MaterialListResponse>('master/material', {params: data})
}

export function getDetailMaterial(id: string) {
  return service.get<MaterialVO>(`master/material/${id}`)
}

export function addMaterial(data: MaterialCreateRequest) {
  return service.post<void>('master/material', data)
}

export function updateMaterial(id: string, data: MaterialUpdateRequest) {
  return service.put<void>(`master/material/${id}`, data)
}

// 注意：物料状态变更 body 是原始字符串 "ENABLE"/"DISABLE"
export function changeMaterialStatus(id: string, status: MaterialStatus) {
  return service.put<void>(`master/material/${id}/status`, status)
}