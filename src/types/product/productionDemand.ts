import type { PageResult } from '../common'
import { ProductionDemandStatus, ProductionSourceType } from '@/constants/enumCode'
import type { EnumCodeOf } from '@/constants/enumCode'

export interface ProductionDemandQuery {
  pageNum: number
  pageSize: number
  sourceType?: EnumCodeOf<typeof ProductionSourceType> | ''
  demandNo?: string
  materialId?: number | string
  status?: EnumCodeOf<typeof ProductionDemandStatus> | ''
}

export interface ProductionDemandVo {
  id: string
  demandNo: string
  materialId: string
  materialCode: string
  materialName: string
  quantity: number
  sourceType: EnumCodeOf<typeof ProductionSourceType>
  sourceNo: string
  status: EnumCodeOf<typeof ProductionDemandStatus>
}

export type PageProductionDemandVo = PageResult<ProductionDemandVo>
