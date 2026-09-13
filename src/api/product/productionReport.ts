import service from '@/utils/request'
import type {
  ProductionReport,
  ProductionReportAdd,
  ProductionReportPage,
  ProductionReportQuery,
} from '@/types/product/productionReport'

export const getPageProductionReport = (params: ProductionReportQuery) =>
  service.get<ProductionReportPage>('/prd/report', { params })
export const getDetailProductionReport = (id: string) => service.get<ProductionReport>(`/prd/report/${id}`)
export const createProductionReport = (data: ProductionReportAdd) => service.post<void>('/prd/report', data)
export const approveProductionReport = (id: string) => service.put<void>(`/prd/report/${id}/approve`)
export const cancelProductionReport = (id: string) => service.put<void>(`/prd/report/${id}/cancel`)
export const rejectProductionReport = (id: string) => service.put<void>(`/prd/report/${id}/reject`)
export const finishProductionReport = (id: string) => service.put<void>(`/prd/report/${id}/finish`)
