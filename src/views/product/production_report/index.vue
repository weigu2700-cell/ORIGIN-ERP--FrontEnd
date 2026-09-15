<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProToolbar from '@/components/ProToolbar.vue'
import Selector from './components/selector.vue'
import SaveDialog from './components/saveDialog.vue'
import DetailDialog from './components/detailDialog.vue'
import { ProductionReportStatus } from '@/constants/enumCode'
import {
  approveProductionReport,
  cancelProductionReport,
  createProductionReport,
  finishProductionReport,
  getPageProductionReport,
  rejectProductionReport,
} from '@/api/product/productionReport'
import type {
  ProductionReport,
  ProductionReportAdd,
  ProductionReportPage,
  ProductionReportQuery,
} from '@/types/product/productionReport'
import { formatDate, formatDecimal } from '@/composables/useFormat'

defineOptions({ name: 'ProductionReportPage' })

const queryData = reactive<ProductionReportQuery>({
  pageNum: 1,
  pageSize: 10,
  productionReportNo: '',
  productionOrderId: '',
  materialId: '',
  status: '',
})
const tableData = ref<ProductionReportPage>()
const selectedRow = ref<ProductionReport>()
const saveVisible = ref(false)
const detailVisible = ref(false)
const detailId = ref<string>()
const statusMap: Record<number, { label: string; type: 'info' | 'primary' | 'warning' | 'success' | 'danger' }> = {
  [ProductionReportStatus.DRAFT]: { label: '草稿', type: 'info' },
  [ProductionReportStatus.APPROVED]: { label: '已审批', type: 'primary' },
  [ProductionReportStatus.CANCEL]: { label: '已取消', type: 'warning' },
  [ProductionReportStatus.REJECT]: { label: '已驳回', type: 'danger' },
  [ProductionReportStatus.FINISHED]: { label: '已完成', type: 'success' },
}
const cards = computed<ProPageHeaderCard[]>(() =>
  ProductionReportStatus.options.map((item) => ({
    ...item,
    tone: statusMap[item.value]?.type ?? 'info',
    count: tableData.value?.records.filter((row) => row.status === item.value).length ?? 0,
    hint: '条 · 当前页',
  })),
)
const workflow = computed(() => {
  const id = selectedRow.value?.id
  if (!id) return null
  if (selectedRow.value?.status === ProductionReportStatus.DRAFT)
    return { label: '审批报工', action: () => approveProductionReport(id) }
  if (selectedRow.value?.status === ProductionReportStatus.APPROVED)
    return { label: '完成报工', action: () => finishProductionReport(id) }
  return null
})
const columns: ProColumn<ProductionReport>[] = [
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '报工单号', prop: 'productionReportNo', minWidth: 180 },
  { label: '生产订单号', prop: 'productionOrderNo', minWidth: 180 },
  { label: '物料编码', prop: 'materialCode', width: 220 },
  { label: '物料名称', prop: 'materialName', minWidth: 140 },
  { label: '报工数量', prop: 'reportQuantity', width: 110, align: 'right', slot: 'reportQuantity' },
  { label: '合格数量', prop: 'qualifiedQuantity', width: 110, align: 'right', slot: 'qualifiedQuantity' },
  { label: '报废数量', prop: 'scrappedQuantity', width: 110, align: 'right', slot: 'scrappedQuantity' },
  { label: '报工人', prop: 'reportUserName', width: 110 },
  { label: '报工时间', prop: 'reportTime', width: 175, slot: 'reportTime' },
]

const loadData = async () => {
  selectedRow.value = undefined
  tableData.value = await getPageProductionReport(queryData)
}

const query = (value: ProductionReportQuery) => {
  Object.assign(queryData, value, { pageNum: 1 })
  loadData()
}

const reset = () => {
  Object.assign(queryData, {
    pageNum: 1,
    productionReportNo: '',
    productionOrderId: '',
    materialId: '',
    reportUserId: '',
    reportTime: '',
    status: '',
  })
  loadData()
}

const changeStatus = (status: string | number) => {
  queryData.status = status === '' ? '' : (Number(status) as ProductionReportQuery['status'])
  queryData.pageNum = 1
  loadData()
}

const openDetail = (row: ProductionReport) => {
  detailId.value = row.id
  detailVisible.value = true
}

const submit = async (value: ProductionReportAdd) => {
  await createProductionReport(value)
  ElMessage.success('生产报工创建成功')
  saveVisible.value = false
  loadData()
}

const transition = async () => {
  if (!workflow.value) return void ElMessage.warning('请选择可流转的生产报工单')
  try {
    await ElMessageBox.confirm(`确定${workflow.value.label}吗？`, '生产报工状态流转', { type: 'warning' })
    await workflow.value.action()
    ElMessage.success(`${workflow.value.label}成功`)
    loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}

const cancel = async () => {
  if (!selectedRow.value || selectedRow.value.status !== ProductionReportStatus.DRAFT)
    return void ElMessage.warning('仅草稿报工单可取消')
  try {
    await ElMessageBox.confirm('确定取消该生产报工单吗？', '取消生产报工', { type: 'warning' })
    await cancelProductionReport(selectedRow.value.id)
    ElMessage.success('取消成功')
    loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}

const reject = async () => {
  if (!selectedRow.value || selectedRow.value.status !== ProductionReportStatus.APPROVED)
    return void ElMessage.warning('仅已审批报工单可驳回')
  try {
    await ElMessageBox.confirm('确定驳回该生产报工单吗？', '驳回生产报工', { type: 'warning' })
    await rejectProductionReport(selectedRow.value.id)
    ElMessage.success('驳回成功')
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
      title="生产报工"
      description="登记生产进度、合格数量与报废数量"
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
          :show-edit="false"
          :show-export="false"
          :show-status="!!workflow"
          :status-label="workflow?.label"
          delete-label="取消报工"
          @add="saveVisible = true"
          @delete="cancel"
          @status="transition"
          @refresh="loadData"
        />
        <el-button v-if="selectedRow?.status === ProductionReportStatus.APPROVED" type="danger" plain @click="reject">
          驳回报工
        </el-button>
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
        @selection-change="(rows: ProductionReport[]) => (selectedRow = rows[0])"
        @row-dblclick="openDetail"
      >
        <template #status="{ row }">
          <el-tag :type="statusMap[row.status]?.type ?? 'info'">
            {{ statusMap[row.status]?.label ?? row.status }}
          </el-tag>
        </template>
        <template #reportQuantity="{ row }">{{ formatDecimal.default(row.reportQuantity, 4) }}</template>
        <template #qualifiedQuantity="{ row }">{{ formatDecimal.default(row.qualifiedQuantity, 4) }}</template>
        <template #scrappedQuantity="{ row }">{{ formatDecimal.default(row.scrappedQuantity, 4) }}</template>
        <template #reportTime="{ row }">{{ formatDate.DateTime(row.reportTime) }}</template>
      </ProTable>
    </section>
  </div>
  <SaveDialog :visible="saveVisible" @cancel="saveVisible = false" @submit="submit" />
  <DetailDialog :visible="detailVisible" :report-id="detailId" @cancel="detailVisible = false" />
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
