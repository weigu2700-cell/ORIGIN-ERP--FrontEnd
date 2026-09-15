<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProToolbar from '@/components/ProToolbar.vue'
import Selector from './components/selector.vue'
import DetailDialog from './components/detailDialog.vue'
import { FinishWarehousingStatus } from '@/constants/enumCode'
import {
  approveFinishWarehousing,
  cancelFinishWarehousing,
  getPageFinishWarehousing,
  warehouseFinishWarehousing,
} from '@/api/inventory/finishWarehousing'
import type {
  FinishWarehousing,
  FinishWarehousingPage,
  FinishWarehousingQuery,
} from '@/types/inventory/finishWarehousing'
import { formatDate, formatDecimal } from '@/composables/useFormat'

defineOptions({ name: 'FinishWarehousingPage' })

const queryData = reactive<FinishWarehousingQuery>({
  pageNum: 1,
  pageSize: 10,
  warehousingNo: '',
  productionOrderId: '',
  materialId: '',
  warehouseId: '',
  status: '',
})
const tableData = ref<FinishWarehousingPage>()
const selectedRow = ref<FinishWarehousing>()
const detailVisible = ref(false)
const detailId = ref<string>()
const statusMap: Record<number, { label: string; type: 'info' | 'primary' | 'success' | 'warning' }> = {
  [FinishWarehousingStatus.DRAFT]: { label: '草稿', type: 'info' },
  [FinishWarehousingStatus.APPROVED]: { label: '已审批', type: 'primary' },
  [FinishWarehousingStatus.WAREHOUSING]: { label: '已入库', type: 'success' },
  [FinishWarehousingStatus.CANCEL]: { label: '已取消', type: 'warning' },
}
const cards = computed<ProPageHeaderCard[]>(() =>
  FinishWarehousingStatus.options.map((item) => ({
    ...item,
    tone: statusMap[item.value]?.type ?? 'info',
    count: tableData.value?.records.filter((row) => row.status === item.value).length ?? 0,
    hint: '条 · 当前页',
  })),
)
const workflow = computed(() => {
  const id = selectedRow.value?.id
  if (!id) return null
  if (selectedRow.value?.status === FinishWarehousingStatus.DRAFT)
    return { label: '审批入库单', action: () => approveFinishWarehousing(id) }
  if (selectedRow.value?.status === FinishWarehousingStatus.APPROVED)
    return { label: '执行入库', action: () => warehouseFinishWarehousing(id) }
  return null
})
const columns: ProColumn<FinishWarehousing>[] = [
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '入库单号', prop: 'warehousingNo', minWidth: 180 },
  { label: '生产订单号', prop: 'productionOrderNo', minWidth: 180 },
  { label: '生产报工单号', prop: 'productionReportNo', minWidth: 180 },
  { label: '物料编码', prop: 'materialCode', width: 220 },
  { label: '物料名称', prop: 'materialName', minWidth: 140 },
  { label: '入库仓库', prop: 'warehouseName', width: 140 },
  { label: '入库数量', prop: 'warehousingQuantity', width: 110, align: 'right', slot: 'quantity' },
  { label: '入库人', prop: 'warehousingUserName', width: 110 },
  { label: '入库时间', prop: 'warehousingTime', width: 175, slot: 'warehousingTime' },
]

const loadData = async () => {
  selectedRow.value = undefined
  tableData.value = await getPageFinishWarehousing(queryData)
}

const query = (value: FinishWarehousingQuery) => {
  Object.assign(queryData, value, { pageNum: 1 })
  loadData()
}

const reset = () => {
  Object.assign(queryData, {
    pageNum: 1,
    warehousingNo: '',
    productionOrderId: '',
    productionReportId: '',
    materialId: '',
    warehouseId: '',
    warehousingUserId: '',
    warehousingTime: '',
    status: '',
  })
  loadData()
}

const changeStatus = (status: string | number) => {
  queryData.status = status === '' ? '' : (Number(status) as FinishWarehousingQuery['status'])
  queryData.pageNum = 1
  loadData()
}

const openDetail = (row: FinishWarehousing) => {
  detailId.value = row.id
  detailVisible.value = true
}

const transition = async () => {
  if (!workflow.value) return void ElMessage.warning('请选择可流转的成品入库单')
  try {
    await ElMessageBox.confirm(`确定${workflow.value.label}吗？`, '成品入库状态流转', { type: 'warning' })
    await workflow.value.action()
    ElMessage.success(`${workflow.value.label}成功`)
    await loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}

const cancel = async () => {
  if (!selectedRow.value || selectedRow.value.status !== FinishWarehousingStatus.DRAFT)
    return void ElMessage.warning('仅草稿入库单可取消')
  try {
    await ElMessageBox.confirm('确定取消该成品入库单吗？', '取消成品入库', { type: 'warning' })
    await cancelFinishWarehousing(selectedRow.value.id)
    ElMessage.success('取消成功')
    await loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}
onMounted(loadData)
</script>

<template>
  <div class="container">
    <ProPageHeader
      title="成品入库"
      description="审批生产完工入库单并执行成品库存入账"
      :summary="`符合筛选条件 ${(tableData?.total ?? 0).toLocaleString()} 条`"
      :cards="cards"
      :model-value="queryData.status"
      @change="changeStatus"
    >
      <template #search>
        <Selector :query-data="queryData" @query="query" @reset="reset" />
      </template>
      <template #toolbar>
        <ProToolbar
          :show-add="false"
          :show-edit="false"
          :show-export="false"
          :show-status="!!workflow"
          :status-label="workflow?.label"
          delete-label="取消入库单"
          @delete="cancel"
          @status="transition"
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
          (value: number) => {
            queryData.pageNum = value
            loadData()
          }
        "
        @update:page-size="
          (value: number) => {
            queryData.pageSize = value
            queryData.pageNum = 1
            loadData()
          }
        "
        @selection-change="(rows: FinishWarehousing[]) => (selectedRow = rows[0])"
        @row-dblclick="openDetail"
      >
        <template #status="{ row }">
          <el-tag :type="statusMap[row.status]?.type ?? 'info'">
            {{ statusMap[row.status]?.label ?? row.status }}
          </el-tag>
        </template>
        <template #quantity="{ row }">{{ formatDecimal.default(row.warehousingQuantity, 4) }}</template>
        <template #warehousingTime="{ row }">{{ formatDate.DateTime(row.warehousingTime) }}</template>
      </ProTable>
    </section>
  </div>
  <DetailDialog :visible="detailVisible" :warehousing-id="detailId" @cancel="detailVisible = false" />
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
