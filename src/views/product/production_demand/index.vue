<script setup lang="ts">
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import { computed, onMounted, ref, reactive } from 'vue'
import { getPageProductionDemand } from '@/api/product/productionDemand'
import type { ProductionDemandVo, ProductionDemandQuery } from '@/types/product/productionDemand'
import type { PageResult } from '@/types/common'
import ProToolbar from '@/components/ProToolbar.vue'
import Selector from './components/selector.vue'
import DetailDialog from './components/detailDialog.vue'
import { formatDecimal } from '@/composables/useFormat'
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue'

const queryData = reactive<ProductionDemandQuery>({
  pageNum: 1,
  pageSize: 10,
  demandNo: '',
  materialId: '',
  sourceType: '',
  status: '',
})

const tableData = ref<PageResult<ProductionDemandVo>>()
const selectedRowId = ref<string>()
const detailVisible = ref<boolean>(false)
const currentDetailId = ref<string>()

const handleSelectionChange = (rows: ProductionDemandVo[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined
}

const loadData = async () => {
  tableData.value = await getPageProductionDemand(queryData)
}

const columns = ref<ProColumn<ProductionDemandVo>[]>([
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '需求单号', prop: 'demandNo', width: 180 },
  { label: '物料编码', prop: 'materialCode', width: 140 },
  { label: '物料名称', prop: 'materialName', width: 160 },
  { label: '数量', prop: 'quantity', width: 100, slot: 'quantity' },
  { label: '来源类型', prop: 'sourceType', width: 120, slot: 'sourceType' },
  { label: '来源单号', prop: 'sourceNo', width: 180 },
])

const sourceTypeMap: Record<string, string> = {
  SALES_ORDER: '销售订单',
  FORECAST: '预测',
  MANUAL: '手工创建',
}

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  PENDING: { label: '待生产', type: 'info' },
  PLANNED: { label: '已计划', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' },
}

const quickStatusOptions = [
  { label: '待生产', value: 'PENDING', tone: 'warning' },
  { label: '已计划', value: 'PLANNED', tone: 'success' },
  { label: '已取消', value: 'CANCELLED', tone: 'danger' },
] as const

const statusCards = computed<ProPageHeaderCard[]>(() => {
  const counts = new Map<string, number>()
  for (const record of tableData.value?.records ?? []) {
    counts.set(record.status, (counts.get(record.status) ?? 0) + 1)
  }
  return quickStatusOptions.map((option) => ({
    ...option,
    count: counts.get(option.value) ?? 0,
    hint: '条 · 当前页',
  }))
})

const handleQuery = () => {
  queryData.pageNum = 1
  loadData()
}

const handleQuickStatus = (status: string | number | null) => {
  queryData.status = typeof status === 'string' ? status : ''
  handleQuery()
}

const handleReset = () => {
  queryData.demandNo = ''
  queryData.materialId = ''
  queryData.sourceType = ''
  queryData.status = ''
  queryData.pageNum = 1
  loadData()
}

const handleRefresh = () => {
  loadData()
}

const handleRowDblclick = (row: ProductionDemandVo) => {
  currentDetailId.value = String(row.id)
  detailVisible.value = true
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="container">
    <ProPageHeader
      title="生产需求"
      description="查看生产需求，跟踪计划安排与需求状态"
      :summary="`符合筛选条件 ${(tableData?.total ?? 0).toLocaleString()} 条`"
      :cards="statusCards"
      :model-value="queryData.status"
      @change="handleQuickStatus"
    >
      <template #search>
        <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
      </template>
      <template #toolbar>
        <ProToolbar @refresh="handleRefresh" />
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
          (p: number) => {
            queryData.pageNum = p
            loadData()
          }
        "
        @update:pageSize="
          (s: number) => {
            queryData.pageSize = s
            queryData.pageNum = 1
            loadData()
          }
        "
        @selectionChange="handleSelectionChange"
        @rowDblclick="handleRowDblclick"
      >
        <template #quantity="{ row }">{{ formatDecimal.default(row.quantity, 0) }}</template>
        <template #sourceType="{ row }">{{ sourceTypeMap[row.sourceType] ?? row.sourceType }}</template>
        <template #status="{ row }">
          <el-tag :type="statusMap[row.status]?.type ?? 'info'">
            {{ statusMap[row.status]?.label ?? row.status }}
          </el-tag>
        </template>
      </ProTable>
    </section>
  </div>
  <DetailDialog :visible="detailVisible" :demand-id="currentDetailId" @cancel="detailVisible = false" />
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 10px;
  flex-direction: column;

  .table {
    flex: 1;
    overflow: auto;
  }
}
</style>
