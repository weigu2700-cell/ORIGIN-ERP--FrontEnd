export interface DeptQuery {
  page: number
  pageSize: number
  name?: string | null
  code?: string | null
  parentId?: string | null
  status?: number | null
  sort?: number | null
}

export interface deptResponse {
  records: {
    id: string
    name: string
    code: string
    parentName: string
    createTime: string
    updateTime: string
  }[],
  total: number
  size:number
  current: number
  optimizeCountSql: string
  searchCount: string
}

export interface deptTree {
  id: string
  name: string
  code: string
  parentId: string
  children: deptTree[]
}

export interface deptColumns {
  label: string
  prop: string
  width: number
  sortable?: boolean
  fixed?: string
}

export interface DeptAdd {
  id?: string
  name: string
  code: string
  parentId: string | null
  sort?: number | null
}

export interface deptDetail {
  id: string | null
  name: string | null
  code: string | null
  parentId: string | null
  sort?: number | null
  status: number | null
}