/**
 * API 枚举约定：后端仅传递并接收 code，界面通过本文件将 code 转成可读文案。
 * 枚举名只在前端常量中使用，不能作为接口参数或响应值依赖。
 */
export type EnumCode = number

export interface EnumOption<T extends EnumCode = EnumCode> {
  value: T
  label: string
}

export type EnumCodeOf<T extends { options: readonly EnumOption[] }> = T['options'][number]['value']

function defineEnum<const T extends Record<string, EnumCode>>(codes: T, labels: Record<T[keyof T], string>) {
  return {
    ...codes,
    options: Object.values(codes).map((value) => ({ value, label: labels[value as T[keyof T]] })) as EnumOption<
      T[keyof T]
    >[],
    labelOf: (value?: number | null) => (value == null ? '' : (labels[value as T[keyof T]] ?? String(value))),
  }
}

export const EnableStatus = defineEnum({ ENABLE: 1, DISABLE: 0 } as const, { 1: '启用', 0: '禁用' })
export const CustomerStatus = defineEnum({ ACTIVE: 1, INACTIVE: 2 } as const, { 1: '有效', 2: '无效' })
export const SupplierStatus = defineEnum({ ACTIVE: 1, INACTIVE: 0 } as const, { 1: '有效', 0: '无效' })
export const MaterialStatus = defineEnum({ ENABLE: 1, DISABLE: 2 } as const, { 1: '启用', 2: '停用' })
export const MaterialSupplierStatus = SupplierStatus
export const MaterialType = defineEnum(
  { RAW_MATERIAL: 1, SEMI_FINISHED: 2, PACKAGING: 3, CONSUMABLE: 4, OTHER: 5 } as const,
  { 1: '原材料', 2: '半成品', 3: '包装材料', 4: '辅料', 5: '其他物料' },
)
export const WarehouseType = defineEnum({ FINISHED: 0, MATERIAL: 1, SEMI_FINISHED: 2, SCRAP: 3, OTHER: 4 } as const, {
  0: '成品仓',
  1: '原材料仓',
  2: '半成品仓',
  3: '废品仓',
  4: '其他仓',
})
export const UserStatus = defineEnum({ NORMAL: 1, LOCK: 2, CANCEL: 3 } as const, { 1: '正常', 2: '锁定', 3: '注销' })
export const PermissionType = defineEnum({ MENU: 1, BUTTON: 2 } as const, { 1: '菜单', 2: '按钮' })
export const PurchaseDemandSourceType = defineEnum({ PRODUCTION_ORDER: 0, OTHER: 1 } as const, {
  0: '生产订单',
  1: '其他',
})
export const PurchaseDemandStatus = defineEnum({ DRAFT: 0, APPROVED: 1, CLOSED: 2 } as const, {
  0: '草稿',
  1: '已审批',
  2: '已关闭',
})
export const PurchaseOrderStatus = defineEnum({ DRAFT: 0, APPROVED: 1, SHIPPED: 2, RECEIVED: 3, CLOSED: 4 } as const, {
  0: '草稿',
  1: '已审批',
  2: '已发货',
  3: '已收货',
  4: '已关闭',
})
export const PurchaseInStockStatus = defineEnum({ DRAFT: 0, APPROVED: 1, UPLOADED: 2 } as const, {
  0: '草稿',
  1: '已审核',
  2: '已上架',
})
export const PurchaseInStockType = defineEnum({ PURCHASE_NORMAL: 0, PURCHASE_RETURN: 1, PURCHASE_GIFT: 2 } as const, {
  0: '采购入库',
  1: '采购退货',
  2: '赠品入库',
})
export const SalesOrderStatus = defineEnum({ DRAFT: 0, CONFIRMED: 1, COMPLETED: 2, CANCELLED: 3 } as const, {
  0: '草稿',
  1: '已确认',
  2: '已完成',
  3: '已取消',
})
export const SalesDeliveryStatus = defineEnum({ DRAFT: 0, CONFIRMED: 1, CANCELLED: 2, COMPLETED: 3 } as const, {
  0: '草稿',
  1: '已确认',
  2: '已取消',
  3: '已完成',
})
export const ProductionDemandStatus = defineEnum({ PENDING: 0, PLANNED: 1, CANCELLED: 2 } as const, {
  0: '待生产',
  1: '已计划',
  2: '已取消',
})
export const ProductionSourceType = defineEnum({ SALES_ORDER: 0 } as const, { 0: '销售订单' })
export const ProductionOrderStatus = defineEnum(
  { DRAFT: 0, RELEASED: 1, IN_PROGRESS: 2, COMPLETED: 3, CANCELLED: 4 } as const,
  { 0: '草稿', 1: '已下达', 2: '生产中', 3: '已完成', 4: '已取消' },
)
export const ProductionPickingStatus = defineEnum({ DRAFT: 0, APPROVED: 1, PICKED: 2, CANCELLED: 3 } as const, {
  0: '草稿',
  1: '已审批',
  2: '已领料',
  3: '已取消',
})
export const ProductionReportStatus = defineEnum(
  { DRAFT: 0, APPROVED: 1, CANCEL: 2, REJECT: 3, FINISHED: 4 } as const,
  {
    0: '草稿',
    1: '已审批',
    2: '已取消',
    3: '已驳回',
    4: '已完成',
  },
)
export const BomStatus = defineEnum({ DRAFT: 0, ACTIVE: 1, INACTIVE: 2 } as const, { 0: '草稿', 1: '使用', 2: '停用' })
export const FinishWarehousingStatus = defineEnum({ DRAFT: 0, APPROVED: 1, WAREHOUSING: 2, CANCEL: 3 } as const, {
  0: '草稿',
  1: '已审批',
  2: '已入库',
  3: '已取消',
})
export const TransactionType = defineEnum({ INBOUND: 1, RESERVE: 2, RELEASE: 3, OUTBOUND: 4 } as const, {
  1: '入库',
  2: '预占',
  3: '释放预占',
  4: '出库',
})
