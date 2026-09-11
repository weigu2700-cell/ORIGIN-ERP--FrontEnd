<script setup lang="ts">
import Selector from "@/views/inventory/transaction/components/selector.vue";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTable, { type ProColumn } from "@/components/ProTable.vue"
import { onMounted, ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { exportTransaction, getPageTransactionList, importTransaction } from "@/api/inventory/transaction.ts";
import DetailDialog from "@/views/inventory/transaction/components/detailDialog.vue";
import type { TransactionListRequest, TransactionListResponse, TransactionVO } from "@/types/inventory/transaction.ts";
import { formatDate, formatDecimal } from "@/composables/useFormat.ts";
import PageHeader from "@/components/PageHeader.vue";

// 注意：库存流水分页参数是 pageNum
const queryData = reactive<TransactionListRequest>({
  pageNum: 1,
  pageSize: 10,
  materialId: null,
  warehouseId: null,
  businessType: null,
  businessNo: null,
})

const tableData = ref<TransactionListResponse>()
const detailVisible = ref(false)
const detailRow = ref<TransactionListResponse['records'][number] | null>(null)
const fileInput = ref<HTMLInputElement>()

const loadData = async () => {
  tableData.value = await getPageTransactionList(queryData)
}

const columns = ref<ProColumn<TransactionVO>[]>([
  { label: '仓库', prop: 'warehouseName', minWidth: 130 },
  { label: '物料编码', prop: 'materialCode', width: 220 },
  { label: '物料名称', prop: 'materialName', minWidth: 140 },
  { label: '类型', prop: 'transactionTypeName', width: 100 },
  { label: '业务类型', prop: 'businessType', width: 100 },
  { label: '业务单号', prop: 'businessNo', minWidth: 180 },
  { label: '数量', prop: 'quantity', width: 90, slot: 'quantity' },
  { label: '结存在库', prop: 'afterOnHand', width: 100, slot: 'afterOnHand' },
  { label: '结存预留', prop: 'afterReserved', width: 100, slot: 'afterReserved' },
  { label: '时间', prop: 'createTime', width: 170, slot: 'createTime' },
])

const handleQuery = (params: TransactionListRequest) => {
  Object.assign(queryData, params, { pageNum: 1 })
  loadData()
}

const handleReset = () => {
  queryData.materialId = null
  queryData.warehouseId = null
  queryData.businessType = null
  queryData.businessNo = null
  queryData.pageNum = 1
  handleQuery(queryData)
}

onMounted(() => {
  loadData()
})

const handleRefresh = () => {
  loadData()
}

const handleImport = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    ElMessage.warning('仅支持导入 .xlsx 文件')
    input.value = ''
    return
  }
  try {
    await importTransaction(file)
    ElMessage.success('库存流水导入成功')
    await loadData()
  } catch {
    ElMessage.error('库存流水导入失败，请检查文件内容')
  } finally {
    input.value = ''
  }
}

const handleExport = async () => {
  try {
    const blob = await exportTransaction()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '库存流水.xlsx'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    ElMessage.success('库存流水导出成功')
  } catch {
    ElMessage.error('库存流水导出失败')
  }
}

const handleRowDblclick = (row: TransactionListResponse['records'][number]) => {
  detailRow.value = row
  detailVisible.value = true
}
</script>

<template>
  <div class="transaction-container round">
    <PageHeader title="库存流水" description="查询物料出入库记录与库存变动轨迹"
      :summary="`符合筛选条件 ${(tableData?.total ?? 0).toLocaleString()} 条`">
      <template #search>
        <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
      </template>
      <template #toolbar>
        <ProToolbar :show-add="false" :show-edit="false" :show-delete="false" show-import @import="handleImport"
          @export="handleExport" @refresh="handleRefresh" />
      </template>
    </PageHeader>
    <input ref="fileInput" class="file-input" type="file" accept=".xlsx" @change="handleFileChange" />
    <div class="table round">
      <ProTable :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.pageNum" :page-size="queryData.pageSize"
        @update:page="(p: number) => { queryData.pageNum = p; loadData() }"
        @update:pageSize="(s: number) => { queryData.pageSize = s; queryData.pageNum = 1; loadData() }"
        @rowDblclick="handleRowDblclick">
        <template #quantity="{ row }">
          <span :class="row.quantity && row.quantity > 0 ? 'qty-in' : 'qty-out'">
            {{ formatDecimal.default(row.quantity, 0) }}
          </span>
        </template>
        <template #afterOnHand="{ row }">
          {{ formatDecimal.default(row.afterOnHand, 0) }}
        </template>
        <template #afterReserved="{ row }">
          {{ formatDecimal.default(row.afterReserved, 0) }}
        </template>
        <template #createTime="{ row }">
          {{ formatDate.DateTime ? formatDate.DateTime(row.createTime) : '-' }}
        </template>
      </ProTable>
    </div>
  </div>
  <DetailDialog :visible="detailVisible" :row="detailRow" @cancel="detailVisible = false" />
</template>

<style scoped>
.transaction-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-container .table {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.transaction-container .qty-in {
  color: #67c23a;
}

.transaction-container .qty-out {
  color: #f56c6c;
}

.transaction-container .file-input {
  display: none;
}
</style>