<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue'
import ProToolbar from '@/components/ProToolbar.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import Selector from './components/selector.vue'
import SaveDialog from './components/save.vue'
import DetailDialog from './components/detail.vue'
import { approvePurchaseDemand, closePurchaseDemand, createPurchaseDemand, getPagePurchaseDemand } from '@/api/purchase/purchaseDemand'
import type { CreatePurchaseDemandRequest, PagePurchaseDemandRequest, PagePurchaseDemandVo, PurchaseDemandVo } from '@/types/purchase/purchaseDemand'
import { formatDate, formatDecimal } from '@/composables/useFormat'

const queryData = reactive<PagePurchaseDemandRequest>({ pageNum: 1, pageSize: 10, materialId: '', sourceType: '', sourceNo: '', status: '' })
const tableData = ref<PagePurchaseDemandVo>()
const selectedRow = ref<PurchaseDemandVo | null>(null)
const saveVisible = ref(false)
const detailVisible = ref(false)
const detailId = ref<string>()

const statusOptions = [
  { label: '草稿', value: 'DRAFT', tone: 'info' },
  { label: '已审批', value: 'APPROVED', tone: 'success' },
  { label: '已关闭', value: 'CLOSED', tone: 'danger' },
] as const
const cards = computed<ProPageHeaderCard[]>(() => statusOptions.map(option => ({
  ...option,
  count: (tableData.value?.records ?? []).filter(row => row.status === option.value).length,
  hint: '条 · 当前页',
})))
const workflow = computed(() => {
  if (selectedRow.value?.status === 'DRAFT') return { label: '审批需求', next: 'APPROVED' }
  if (selectedRow.value?.status === 'APPROVED') return { label: '关闭需求', next: 'CLOSED' }
  return null
})
const columns: ProColumn[] = [
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '需求单号', prop: 'purchaseDemandNo', minWidth: 180 },
  { label: '物料 ID', prop: 'materialId', width: 120 },
  { label: '采购数量', prop: 'purchaseQuantity', width: 120, slot: 'quantity' },
  { label: '来源类型', prop: 'sourceType', width: 120, slot: 'sourceType' },
  { label: '来源单号', prop: 'sourceNo', minWidth: 180 },
  { label: '创建时间', prop: 'createTime', width: 170, slot: 'createTime' },
]
const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' }, APPROVED: { label: '已审批', type: 'success' }, CLOSED: { label: '已关闭', type: 'danger' },
}
const sourceMap: Record<string, string> = { PRODUCTION_ORDER: '生产订单', OTHER: '其他' }

const loadData = async () => { selectedRow.value = null; tableData.value = await getPagePurchaseDemand(queryData) }
const query = () => { queryData.pageNum = 1; loadData() }
const reset = () => { Object.assign(queryData, { pageNum: 1, materialId: '', sourceType: '', sourceNo: '', status: '' }); loadData() }
const changeStatusFilter = (status: string) => { queryData.status = status; query() }
const openDetail = (row: PurchaseDemandVo) => { detailId.value = String(row.id); detailVisible.value = true }

const submit = async (data: CreatePurchaseDemandRequest) => {
  await createPurchaseDemand(data)
  ElMessage.success('采购需求创建成功')
  saveVisible.value = false
  loadData()
}

const advanceWorkflow = async () => {
  if (!selectedRow.value || !workflow.value) {
    ElMessage.warning('请选择可流转的采购需求')
    return
  }
  const action = workflow.value
  try {
    await ElMessageBox.confirm(`确定${action.label}吗？`, '状态流转', { type: 'warning' })
    if (action.next === 'APPROVED') await approvePurchaseDemand(selectedRow.value.id)
    else await closePurchaseDemand(selectedRow.value.id)
    ElMessage.success(`${action.label}成功`)
    loadData()
  } catch { /* 用户取消或请求失败 */ }
}

onMounted(loadData)
</script>

<template>
  <div class="container">
    <ProPageHeader title="采购需求" description="汇总物料采购需求，跟踪审批与关闭状态"
      :summary="`符合筛选条件 ${(tableData?.total ?? 0).toLocaleString()} 条`" :cards="cards"
      :model-value="queryData.status" @change="changeStatusFilter">
      <template #search><Selector :query-data="queryData" @query="query" @reset="reset" /></template>
      <template #toolbar>
        <ProToolbar :show-edit="false" :show-delete="false" :show-export="false" :show-status="!!workflow"
          :status-label="workflow?.label" @add="saveVisible = true" @status="advanceWorkflow" @refresh="loadData" />
      </template>
    </ProPageHeader>
    <section class="table">
      <ProTable :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.pageNum" :page-size="queryData.pageSize"
        @update:page="(page: number) => { queryData.pageNum = page; loadData() }"
        @update:page-size="(size: number) => { queryData.pageSize = size; queryData.pageNum = 1; loadData() }"
        @selection-change="(rows: PurchaseDemandVo[]) => selectedRow = rows[0] ?? null" @row-dblclick="openDetail">
        <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type ?? 'info'">{{ statusMap[row.status]?.label ?? row.status }}</el-tag></template>
        <template #quantity="{ row }">{{ formatDecimal.default(row.purchaseQuantity, 4) }}</template>
        <template #sourceType="{ row }">{{ sourceMap[row.sourceType] ?? row.sourceType }}</template>
        <template #createTime="{ row }">{{ formatDate.DateTime(row.createTime) }}</template>
      </ProTable>
    </section>
  </div>
  <SaveDialog :visible="saveVisible" @cancel="saveVisible = false" @submit="submit" />
  <DetailDialog :visible="detailVisible" :demand-id="detailId" @cancel="detailVisible = false" />
</template>

<style scoped>
.container { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 10px; }
.table { flex: 1; min-height: 0; overflow: auto; }
</style>
