/**
 * 通用分页响应结构（对应后端 PageResult<T>）
 * 各业务的分页响应接口继承此接口，只需指定记录类型 T
 *
 * @example
 * export interface WorkshopListResponse extends PageResult<WorkshopVO> {}
 */
export interface PageResult<T> {
  records: T[]
  total: number,
  size: number,
  current: number,
  pages: number,
  optimizeCountSql?: string,
  searchCount?: string,
}

export interface statusType {
  label: string;
  value: string;
}