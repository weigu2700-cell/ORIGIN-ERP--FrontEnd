export interface CreateBomRequest {
  materialId: string
  bomItems: CreateBomItemRequest[]
}

export interface CreateBomItemRequest {
  lineNo: number
  componentMaterialId: string
  componentMaterialName?: string
  quantity: number
  lossRate: number
  remark?: string | null
}

export interface GetPageBomRequest {
  pageNum: number;
  pageSize: number;
  bomNo?: string | null;
  materialId?: string| null;
  status?: string| null;
}

export interface BomItemVo {
  id: number;
  bomId: number;
  lineNo: number;
  componentMaterialId: string;
  componentMaterialCode: string;
  componentMaterialName: string;
  quantity: number;
  lossRate: number;
  remark: string;
}

export interface BomVo {
  id: string;
  bomNo: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  status: string;
  version: number;
  remark: string;
  createTime: string;
  updateTime: string;
  bomItems: BomItemVo[];
}

export interface GetPageBomResponse {
  records: BomVo[];
  total: string | number;
  size: string | number;
  current: string | number;
  pages?: string | number;
  optimizeCountSql?: string;
  searchCount?: string;
}

export interface BomExplosionVo {
  materialId: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  level: number;
}

export interface MaterialRequirementVo {
  materialId: string;
  materialCode: string;
  materialName: string;
  // 毛需求量
  grossQuantity: number;
  // 可用量
  stockUsedAvailableQuantity: number;
  // 缺口量
  shortageQuantity: number;
}