<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue'
import ProToolbar from '@/components/ProToolbar.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import Selector from './components/selector.vue'
import DetailDialog from './components/detailDialog.vue'
import {
  approveProductionPicking,
  confirmProductionPicking,
  getPageProductionPicking,
} from '@/api/product/productionPicking'
import type {
  ProductionPicking,
  ProductionPickingQuery,
  ProductionPickingStatus,
} from '@/types/product/productionPicking'
import type { PageResult } from '@/types/common'
import { formatDate, formatDecimal } from '@/composables/useFormat'

defineOptions({ name: 'ProductionPickingPage' })

const queryData = reactive<ProductionPickingQuery>({ pageNum: 1, pageSize: 10, status: '' })
const tableData = ref<PageResult<ProductionPicking>>()
const selectedRow = ref<ProductionPicking | null>(null)
const detailRow = ref<ProductionPicking | null>(null)
const detailVisible = ref(false)
const pickingStatusAliases: Record<string, ProductionPickingStatus> = {
  DRAFT: 'DRAFT',
  '0': 'DRAFT',
  草稿: 'DRAFT',
  APPROVED: 'APPROVED',
  '1': 'APPROVED',
  已审批: 'APPROVED',
  PICKED: 'PICKED',
  '2': 'PICKED',
  已领料: 'PICKED',
  CANCELLED: 'CANCELLED',
  '3': 'CANCELLED',
  已取消: 'CANCELLED',
}

const normalizeStatus = (status: ProductionPicking['status']): ProductionPickingStatus | 'UNKNOWN' => {
  const value = String(status ?? '')
  return pickingStatusAliases[value] ?? 'UNKNOWN'
}

const statusOptions = [
  { label: '草稿', value: 'DRAFT', tone: 'info' },
  { label: '已审批', value: 'APPROVED', tone: 'warning' },
  { label: '已领料', value: 'PICKED', tone: 'success' },
  { label: '已取消', value: 'CANCELLED', tone: 'danger' },
] as const

const statusMap = {
  DRAFT: { label: '草稿', type: 'info' },
  APPROVED: { label: '已审批', type: 'warning' },
  PICKED: { label: '已领料', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' },
  UNKNOWN: { label: '未知', type: 'info' },
} as const

const cards = computed<ProPageHeaderCard[]>(() =>
  statusOptions.map((option) => ({
    ...option,
    count: (tableData.value?.records ?? []).filter((row) => normalizeStatus(row.status) === option.value).length,
    hint: '条 · 当前页',
  })),
)
const workflow = computed(() => {
  const status = selectedRow.value ? normalizeStatus(selectedRow.value.status) : 'UNKNOWN'
  if (status === 'DRAFT') return { label: '审核领料单', action: 'approve' as const }
  if (status === 'APPROVED') return { label: '确认领料', action: 'confirm' as const }
  return null
})

const columns: ProColumn<ProductionPicking>[] = [
  { label: '状态', prop: 'status', width: 110, slot: 'status' },
  { label: '领料单号', prop: 'pickingNo', minWidth: 180 },
  { label: '生产订单号', prop: 'productionOrderNo', minWidth: 180 },
  { label: '采购需求单号', prop: 'purchaseDemandNo', minWidth: 180, slot: 'purchaseDemandNo' },
  { label: '物料编码', prop: 'materialCode', width: 140 },
  { label: '物料名称', prop: 'materialName', minWidth: 160 },
  { label: '领料仓库', prop: 'warehouseName', minWidth: 140, slot: 'warehouseName' },
  {
    label: '计划数量',
    prop: 'plannedQuantity',
    width: 110,
    align: 'right',
    slot: 'plannedQuantity',
  },
  { label: '实际数量', prop: 'actualQuantity', width: 110, align: 'right', slot: 'actualQuantity' },
  { label: '领料时间', prop: 'pickingTime', width: 175, slot: 'pickingTime' },
]

const loadData = async () => {
  selectedRow.value = null
  tableData.value = await getPageProductionPicking(queryData)
}
const query = (params?: ProductionPickingQuery) => {
  if (params) Object.assign(queryData, params)
  queryData.pageNum = 1
  loadData()
}
const reset = () => {
  Object.assign(queryData, {
    pageNum: 1,
    pageSize: 10,
    productionOrderId: '',
    purchaseDemandId: '',
    materialId: '',
    warehouseId: '',
    status: '',
    pickingTimeStart: '',
    pickingTimeEnd: '',
  })
  loadData()
}
const changeStatusFilter = (status: string | number) => {
  queryData.status = String(status) as ProductionPickingStatus | ''
  query()
}
const openDetail = (row: ProductionPicking) => {
  detailRow.value = row
  detailVisible.value = true
}
const advanceWorkflow = async () => {
  if (!selectedRow.value || !workflow.value) return void ElMessage.warning('请选择可操作的领料单')
  const action = workflow.value
  try {
    await ElMessageBox.confirm(`确定${action.label}吗？`, '领料单状态流转', { type: 'warning' })
    if (action.action === 'approve') await approveProductionPicking(selectedRow.value.id)
    else await confirmProductionPicking(selectedRow.value.id)
    ElMessage.success(`${action.label}成功`)
    loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}

onMounted(loadData)
</script>

<template>
  <div class="container">
    <ProPageHeader
      title="生产领料"
      description="审核领料计划并确认物料出库，跟踪生产备料进度"
      :summary="`符合筛选条件 ${(tableData?.total ?? 0).toLocaleString()} 条`"
      :cards="cards"
      :model-value="queryData.status"
      @change="changeStatusFilter"
    >
      <template #search>
        <Selector :query-data="queryData" @query="query" @reset="reset" />
      </template>
      <template #toolbar>
        <ProToolbar
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          :show-export="false"
          :show-status="!!workflow"
          :status-label="workflow?.label"
          @status="advanceWorkflow"
          @refresh="loadData"
        />
      </template>
    </ProPageHeader>
    <section class="table">
      <ProTable
        :data="tableData?.records ?? []"
        :columns="columns"
        :total="tableData?.total ?? 0"
        :page="queryData.pageNum"
        :page-size="queryData.pageSize"
        @update:page="
          (page: number) => {
            queryData.pageNum = page
            loadData()
          }
        "
        @update:page-size="
          (size: number) => {
            queryData.pageSize = size
            queryData.pageNum = 1
            loadData()
          }
        "
        @selection-change="(rows: ProductionPicking[]) => (selectedRow = rows[0] ?? null)"
        @row-dblclick="openDetail"
      >
        <template #status="{ row }">
          <el-tag :type="statusMap[normalizeStatus(row.status)].type">
            {{ statusMap[normalizeStatus(row.status)].label }}
          </el-tag>
        </template>
        <template #purchaseDemandNo="{ row }">{{ row.purchaseDemandNo || '库存领料' }}</template>
        <template #warehouseName="{ row }">{{ row.warehouseName || '待指定' }}</template>
        <template #plannedQuantity="{ row }">{{ formatDecimal.default(row.plannedQuantity, 4) }}</template>
        <template #actualQuantity="{ row }">{{ formatDecimal.default(row.actualQuantity, 4) }}</template>
        <template #pickingTime="{ row }">{{ row.pickingTime ? formatDate.DateTime(row.pickingTime) : '-' }}</template>
      </ProTable>
    </section>
  </div>
  <DetailDialog :visible="detailVisible" :row="detailRow" @cancel="detailVisible = false" />
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.table {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
