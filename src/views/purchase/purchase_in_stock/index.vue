<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue'
import ProToolbar from '@/components/ProToolbar.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import Selector from './components/selector.vue'
import DetailDialog from './components/detail.vue'
import UploadDialog from './components/uploadDialog.vue'
import { approvePurchaseInStock, getPagePurchaseInStock, uploadPurchaseInStock } from '@/api/purchase/purchaseInStock'
import type { PurchaseInStock, PurchaseInStockQuery, PurchaseInStockUpload } from '@/types/purchase/purchaseInStock'
import type { PageResult } from '@/types/common'
import { formatDate, formatDecimal } from '@/composables/useFormat'

defineOptions({ name: 'PurchaseInStockPage' })

const selectedId = ref<string>()
const detailVisible = ref(false)
const uploadVisible = ref(false)
const tableData = ref<PageResult<PurchaseInStock>>({
  records: [],
  total: 0,
  size: 0,
  current: 0,
  pages: 0,
})
const queryData = reactive<PurchaseInStockQuery>({
  pageNum: 1,
  pageSize: 10,
  purchaseInStockNo: '',
  purchaseOrderNo: '',
  materialId: '',
  supplierId: '',
  warehouseId: '',
  storageLocation: '',
  operator: '',
  inType: '',
  productionDate: '',
  deliveryDate: '',
  status: '',
})
const selectedRow = computed(
  () => tableData.value.records.find((row) => String(row.id) === String(selectedId.value)) ?? null,
)

const statusOptions = [
  { label: '草稿', value: 'DRAFT', tone: 'info' },
  { label: '已审核', value: 'APPROVED', tone: 'warning' },
  { label: '已上架', value: 'UPLOADED', tone: 'success' },
] as const
const cards = computed<ProPageHeaderCard[]>(() =>
  statusOptions.map((option) => ({
    ...option,
    count: tableData.value.records.filter((row) => row.status === option.value).length,
    hint: '条 · 当前页',
  })),
)
const statusMap: Record<string, { label: string; type: 'info' | 'warning' | 'success' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  APPROVED: { label: '已审核', type: 'warning' },
  UPLOADED: { label: '已上架', type: 'success' },
}
const inTypeMap: Record<string, string> = {
  PURCHASE_NORMAL: '采购入库',
  PURCHASE_RETURN: '采购退货',
  PURCHASE_GIFT: '赠品入库',
}
const workflow = computed(() => {
  if (selectedRow.value?.status === 'DRAFT') return { label: '审核入库单', kind: 'approve' as const }
  if (selectedRow.value?.status === 'APPROVED') return { label: '上架入库', kind: 'upload' as const }
  return null
})

const columns: ProColumn<PurchaseInStock>[] = [
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '入库单号', prop: 'purchaseInStockNo', width: 170 },
  { label: '采购订单号', prop: 'purchaseOrderNo', width: 170 },
  { label: '供应商', prop: 'supplierName', minWidth: 150 },
  { label: '物料编码', prop: 'materialCode', width: 130 },
  { label: '物料名称', prop: 'materialName', minWidth: 150 },
  { label: '仓库', prop: 'warehouseName', width: 130, slot: 'warehouseName' },
  { label: '库位', prop: 'storageLocation', width: 110, slot: 'storageLocation' },
  { label: '入库类型', prop: 'inType', width: 100, slot: 'inType' },
  { label: '入库数量', prop: 'inQuantity', width: 110, align: 'right', slot: 'inQuantity' },
  { label: '总金额', prop: 'totalAmount', width: 125, align: 'right', slot: 'totalAmount' },
  { label: '入库时间', prop: 'inDate', width: 175, slot: 'inDate' },
  { label: '创建时间', prop: 'createTime', width: 175, slot: 'createTime' },
]

const loadData = async () => {
  selectedId.value = undefined
  const res = await getPagePurchaseInStock(queryData)
  tableData.value = { ...res, pages: res.pages ?? Math.ceil(res.total / Math.max(res.size, 1)) }
}
const search = (params: PurchaseInStockQuery) => {
  Object.assign(queryData, params, { pageNum: 1 })
  loadData()
}
const reset = () => {
  Object.assign(queryData, {
    pageNum: 1,
    pageSize: 10,
    purchaseInStockNo: '',
    purchaseOrderNo: '',
    materialId: '',
    supplierId: '',
    warehouseId: '',
    storageLocation: '',
    operator: '',
    inType: '',
    productionDate: '',
    deliveryDate: '',
    status: '',
  })
  loadData()
}
const changeStatus = (status: string | number) => {
  queryData.status = String(status) as PurchaseInStockQuery['status']
  queryData.pageNum = 1
  loadData()
}
const openDetail = (row: PurchaseInStock) => {
  selectedId.value = row.id
  detailVisible.value = true
}

const advanceWorkflow = async () => {
  if (!selectedRow.value || !workflow.value) return void ElMessage.warning('请选择可流转的入库单')
  if (workflow.value.kind === 'upload') {
    uploadVisible.value = true
    return
  }
  try {
    await ElMessageBox.confirm('审核后入库单将进入待上架状态，确定审核吗？', '审核入库单', {
      type: 'warning',
    })
    await approvePurchaseInStock(selectedRow.value.id)
    ElMessage.success('审核成功')
    loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}
const submitUpload = async (data: PurchaseInStockUpload) => {
  if (!selectedRow.value) return
  await uploadPurchaseInStock(selectedRow.value.id, data)
  ElMessage.success('上架成功，库存已更新')
  uploadVisible.value = false
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="purchase-in-stock-container">
    <ProPageHeader
      title="采购入库"
      description="审核采购到货并完成仓库上架"
      :summary="`符合筛选条件 ${tableData.total.toLocaleString()} 条`"
      :cards="cards"
      :model-value="queryData.status"
      @change="changeStatus"
    >
      <template #search><Selector :query-data="queryData" @search="search" @reset="reset" /></template>
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
    <section class="table-panel">
      <ProTable
        :data="tableData.records"
        :columns="columns"
        :total="tableData.total"
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
        @selection-change="(rows: PurchaseInStock[]) => (selectedId = rows[0]?.id)"
        @row-dblclick="openDetail"
      >
        <template #status="{ row }">
          <el-tag :type="statusMap[row.status]?.type ?? 'info'">
            {{ statusMap[row.status]?.label ?? row.status }}
          </el-tag>
        </template>
        <template #warehouseName="{ row }">{{ row.warehouseName || '待指定' }}</template>
        <template #storageLocation="{ row }">{{ row.storageLocation || '待指定' }}</template>
        <template #inType="{ row }">{{ inTypeMap[row.inType] ?? row.inType }}</template>
        <template #inQuantity="{ row }">{{ formatDecimal.default(row.inQuantity, 4) }}</template>
        <template #totalAmount="{ row }">¥ {{ formatDecimal.thousand(row.totalAmount, 2) }}</template>
        <template #inDate="{ row }">{{ row.inDate ? formatDate.DateTime(row.inDate) : '-' }}</template>
        <template #createTime="{ row }">{{ row.createTime ? formatDate.DateTime(row.createTime) : '-' }}</template>
      </ProTable>
    </section>
  </div>
  <DetailDialog :visible="detailVisible" :record-id="selectedId" @cancel="detailVisible = false" />
  <UploadDialog :visible="uploadVisible" :row="selectedRow" @cancel="uploadVisible = false" @submit="submitUpload" />
</template>

<style scoped>
.purchase-in-stock-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.table-panel {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
