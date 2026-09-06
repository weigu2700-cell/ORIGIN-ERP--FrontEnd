export interface GetPageProductionDemandRequest {
  pageNum: number
  pageSize: number
  sourceType?: 'SALES_ORDER' | string
  demandNo?: string
  materialId?: number | string
  status?: 'PENDING' | string
}

export interface ProductionDemandVo {
  id: string
  demandNo: string
  materialId: string
  materialCode: string
  materialName: string
  quantity: number
  sourceType: 'SALES_ORDER' | string
  sourceNo: string
  status: 'PENDING' | string
}

export interface PageProductionDemandVo {
  records: ProductionDemandVo[]
  total: number
  size: number
  current: number
  optimizeCountSql?: string
  searchCount?: string
}