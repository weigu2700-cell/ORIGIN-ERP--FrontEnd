import type { PageResult } from '../common'

export interface ProductionDemandQuery {
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

export type PageProductionDemandVo = PageResult<ProductionDemandVo>