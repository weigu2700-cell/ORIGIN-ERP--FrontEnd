<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue'
import ProToolbar from '@/components/ProToolbar.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import Selector from './components/selector.vue'
import SaveDialog from './components/save.vue'
import DetailDialog from './components/detail.vue'
import { approvePurchaseOrder, closePurchaseOrder, createPurchaseOrder, getPagePurchaseOrder, receivePurchaseOrder, shipPurchaseOrder, updatePurchaseOrder } from '@/api/purchase/purchaseOrder'
import type { PurchaseOrderAdd, PurchaseOrderQuery, PurchaseOrderVo, PurchaseOrderUpdate } from '@/types/purchase/purchaseOrder'
import type { PageResult } from '@/types/common'
import { formatDate, formatDecimal } from '@/composables/useFormat'

const queryData = reactive<PurchaseOrderQuery>({ pageNum: 1, pageSize: 10, purchaseOrderNo: '', materialId: '', supplierId: '', status: '' })
const tableData = ref<PageResult<PurchaseOrderVo>>()
const selectedRow = ref<PurchaseOrderVo | null>(null)
const saveVisible = ref(false)
const saveMode = ref<'add' | 'edit'>('add')
const detailVisible = ref(false)
const detailId = ref<string>()

const statusOptions = [
  { label: '草稿', value: 'DRAFT', tone: 'info' },
  { label: '已审批', value: 'APPROVED', tone: 'primary' },
  { label: '已发货', value: 'SHIPPED', tone: 'warning' },
  { label: '已收货', value: 'RECEIVED', tone: 'success' },
  { label: '已关闭', value: 'CLOSED', tone: 'danger' },
] as const
const cards = computed<ProPageHeaderCard[]>(() => statusOptions.map(option => ({
  ...option, count: (tableData.value?.records ?? []).filter(row => row.status === option.value).length, hint: '条 · 当前页',
})))
const workflow = computed(() => ({
  DRAFT: { label: '审批订单', next: 'APPROVED' }, APPROVED: { label: '确认发货', next: 'SHIPPED' },
  SHIPPED: { label: '确认收货', next: 'RECEIVED' }, RECEIVED: { label: '关闭订单', next: 'CLOSED' },
} as const)[selectedRow.value?.status ?? ''])
const statusMap: Record<string, { label: string; type: 'info' | 'primary' | 'warning' | 'success' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' }, APPROVED: { label: '已审批', type: 'primary' },
  SHIPPED: { label: '已发货', type: 'warning' }, RECEIVED: { label: '已收货', type: 'success' }, CLOSED: { label: '已关闭', type: 'danger' },
}
const columns: ProColumn<PurchaseOrderVo>[] = [
  { label: '状态', prop: 'status', width: 100, slot: 'status' }, { label: '采购订单号', prop: 'purchaseOrderNo', minWidth: 180 },
  { label: '采购需求单号', prop: 'purchaseDemandNo', minWidth: 180 }, { label: '供应商', prop: 'supplierName', minWidth: 150 },
  { label: '物料编码', prop: 'materialCode', width: 140 }, { label: '物料名称', prop: 'materialName', minWidth: 150 },
  { label: '计划数量', prop: 'plannedQuantity', width: 110, slot: 'plannedQuantity' },
  { label: '到货数量', prop: 'completeQuantity', width: 110, slot: 'completeQuantity' },
  { label: '订单金额', prop: 'totalAmount', width: 130, slot: 'totalAmount' },
  { label: '订单日期', prop: 'orderDate', width: 170, slot: 'orderDate' },
  { label: '预计交货', prop: 'expectedDeliveryDate', width: 170, slot: 'expectedDeliveryDate' },
]

const loadData = async () => { selectedRow.value = null; tableData.value = await getPagePurchaseOrder(queryData) }
const query = () => { queryData.pageNum = 1; loadData() }
const reset = () => { Object.assign(queryData, { pageNum: 1, purchaseOrderNo: '', materialId: '', supplierId: '', status: '' }); loadData() }
const changeStatusFilter = (status: string | number) => { queryData.status = String(status); query() }
const openAdd = () => { saveMode.value = 'add'; saveVisible.value = true }
const openEdit = () => {
  if (!selectedRow.value) return void ElMessage.warning('请选择一条采购订单')
  if (selectedRow.value.status !== 'DRAFT') return void ElMessage.warning('仅草稿采购订单可编辑')
  saveMode.value = 'edit'; saveVisible.value = true
}
const openDetail = (row: PurchaseOrderVo) => { detailId.value = row.id; detailVisible.value = true }
const submit = async (data: PurchaseOrderAdd | PurchaseOrderUpdate) => {
  if (saveMode.value === 'edit' && selectedRow.value) await updatePurchaseOrder(selectedRow.value.id, data as PurchaseOrderUpdate)
  else await createPurchaseOrder(data as PurchaseOrderAdd)
  ElMessage.success(saveMode.value === 'edit' ? '采购订单更新成功' : '采购订单创建成功')
  saveVisible.value = false
  loadData()
}
const advanceWorkflow = async () => {
  if (!selectedRow.value || !workflow.value) return void ElMessage.warning('请选择可流转的采购订单')
  const action = workflow.value
  try {
    await ElMessageBox.confirm(`确定${action.label}吗？`, '状态流转', { type: 'warning' })
    const id = selectedRow.value.id
    if (action.next === 'APPROVED') await approvePurchaseOrder(id)
    else if (action.next === 'SHIPPED') await shipPurchaseOrder(id)
    else if (action.next === 'RECEIVED') await receivePurchaseOrder(id)
    else await closePurchaseOrder(id)
    ElMessage.success(`${action.label}成功`)
    loadData()
  } catch { /* 用户取消或请求失败 */ }
}

onMounted(loadData)
</script>

<template>
  <div class="container">
    <ProPageHeader title="采购订单" description="管理供应商采购订单，跟踪审批、发货与收货进度"
      :summary="`符合筛选条件 ${(tableData?.total ?? 0).toLocaleString()} 条`" :cards="cards" :model-value="queryData.status"
      @change="changeStatusFilter">
      <template #search>
        <Selector :query-data="queryData" @query="query" @reset="reset" />
      </template>
      <template #toolbar>
        <ProToolbar :show-delete="false" :show-export="false" :show-status="!!workflow" :status-label="workflow?.label"
          @add="openAdd" @edit="openEdit" @status="advanceWorkflow" @refresh="loadData" />
      </template>
    </ProPageHeader>
    <section class="table">
      <ProTable :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.pageNum" :page-size="queryData.pageSize"
        @update:page="(page: number) => { queryData.pageNum = page; loadData() }"
        @update:page-size="(size: number) => { queryData.pageSize = size; queryData.pageNum = 1; loadData() }"
        @selection-change="(rows: PurchaseOrderVo[]) => selectedRow = rows[0] ?? null" @row-dblclick="openDetail">
        <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type ?? 'info'">{{
          statusMap[row.status]?.label ?? row.status }}</el-tag></template>
        <template #plannedQuantity="{ row }">{{ formatDecimal.default(row.plannedQuantity, 4) }}</template>
        <template #completeQuantity="{ row }">{{ formatDecimal.default(row.completeQuantity, 4) }}</template>
        <template #totalAmount="{ row }">¥ {{ formatDecimal.thousand(row.totalAmount, 2) }}</template>
        <template #orderDate="{ row }">{{ formatDate.DateTime(row.orderDate) }}</template>
        <template #expectedDeliveryDate="{ row }">{{ formatDate.DateTime(row.expectedDeliveryDate) }}</template>
      </ProTable>
    </section>
  </div>
  <SaveDialog :visible="saveVisible" :mode="saveMode" :row="selectedRow" @cancel="saveVisible = false"
    @submit="submit" />
  <DetailDialog :visible="detailVisible" :order-id="detailId" @cancel="detailVisible = false" />
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