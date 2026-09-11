<script setup lang="ts">
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import { computed, onMounted, ref, reactive } from 'vue'
import {
  getPageSalesDelivery,
  addSalesDelivery,
  cancelSalesDelivery,
  completeSalesDelivery,
  confirmSalesDelivery,
} from '@/api/sales/salesDelivery'
import type {
  PageSalesDelivery,
  SalesDeliveryVo,
  GetPageSalesDelivery,
  PostSaleDelivery,
} from '@/types/sales/salesDelivery'
import ProToolbar from '@/components/ProToolbar.vue'
import Selector from './components/selector.vue'
import SaveDialog from './components/saveDialog.vue'
import DetailDialog from './components/detailDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue'

defineOptions({ name: 'SalesDeliveryPage' })

const queryData = reactive<GetPageSalesDelivery>({
  pageNum: 1,
  pageSize: 10,
  deliveryNo: '',
  salesOrderId: null,
  customerId: null,
  status: '',
})

const tableData = ref<PageSalesDelivery>()
const selectedRowId = ref<string>()
const visible = ref<boolean>(false)
const detailVisible = ref<boolean>(false)
const model = ref<'add' | 'edit'>('add')
const currentDetailId = ref<string>()
const selectedRow = computed(
  () => tableData.value?.records?.find((item) => String(item.id) === String(selectedRowId.value)) ?? null,
)

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  CONFIRMED: { label: '已确认', type: 'success' },
  COMPLETED: { label: '已完成', type: 'warning' },
  CANCELLED: { label: '已取消', type: 'danger' },
}
const statusOptions = [
  { label: '草稿', value: 'DRAFT', tone: 'info' },
  { label: '已确认', value: 'CONFIRMED', tone: 'primary' },
  { label: '已完成', value: 'COMPLETED', tone: 'success' },
  { label: '已取消', value: 'CANCELLED', tone: 'danger' },
] as const
const cards = computed<ProPageHeaderCard[]>(() =>
  statusOptions.map((option) => ({
    ...option,
    count: (tableData.value?.records ?? []).filter((row) => row.status === option.value).length,
    hint: '条 · 当前页',
  })),
)
const workflow = computed(() => {
  if (selectedRow.value?.status === 'DRAFT') return { label: '确认发货单', action: confirmSalesDelivery }
  if (selectedRow.value?.status === 'CONFIRMED') return { label: '完成出库', action: completeSalesDelivery }
  return null
})

const handleSelectionChange = (rows: SalesDeliveryVo[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined
}

const loadData = async () => {
  tableData.value = await getPageSalesDelivery(queryData)
}

const columns = ref<ProColumn<SalesDeliveryVo>[]>([
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '交货单号', prop: 'deliveryNo', width: 200 },
  { label: '销售订单号', prop: 'salesOrderNo', width: 200 },
  { label: '客户名称', prop: 'customerName', width: 200 },
  { label: '交货日期', prop: 'deliveryDate', width: 200 },
  { label: '备注', prop: 'remark', minWidth: 150 },
])

const handleQuery = () => {
  queryData.pageNum = 1
  loadData()
}

const handleReset = () => {
  queryData.deliveryNo = ''
  queryData.salesOrderId = null
  queryData.customerId = null
  queryData.status = ''
  queryData.pageNum = 1
  loadData()
}

const handleQuickStatus = (status: string | number) => {
  queryData.status = String(status) as GetPageSalesDelivery['status']
  handleQuery()
}

const handleAdd = () => {
  visible.value = true
  model.value = 'add'
}

const handleDelete = async () => {
  if (!selectedRowId.value) {
    ElMessage.warning('请选择一条数据进行删除')
    return
  }

  try {
    if (selectedRow.value?.status === 'COMPLETED' || selectedRow.value?.status === 'CANCELLED') {
      ElMessage.warning('当前发货单不可取消')
      return
    }
    await ElMessageBox.confirm('取消后将释放已预占库存，确定取消该发货单吗？', '取消发货单', {
      type: 'warning',
    })
    await cancelSalesDelivery(selectedRowId.value)
    ElMessage.success('取消成功')
    loadData()
  } catch {
    // 用户取消或请求失败
  }
}

const advanceWorkflow = async () => {
  if (!selectedRow.value || !workflow.value) return void ElMessage.warning('请选择可流转的发货单')
  const action = workflow.value
  try {
    await ElMessageBox.confirm(`确定${action.label}吗？`, '发货单状态流转', { type: 'warning' })
    await action.action(String(selectedRow.value.id))
    ElMessage.success(`${action.label}成功`)
    loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}

const handleRefresh = () => {
  loadData()
}

const handleRowDblclick = (row: SalesDeliveryVo) => {
  currentDetailId.value = String(row.id)
  detailVisible.value = true
}

const handleSubmit = async (data: PostSaleDelivery) => {
  try {
    await addSalesDelivery(data)
    visible.value = false
    ElMessage.success('新增成功')
    loadData()
  } catch {
    ElMessage.error('保存失败')
  }
}

const handleCancel = () => {
  visible.value = false
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="container">
    <ProPageHeader
      title="销售发货"
      description="处理销售出库、库存预占与发货进度"
      :summary="`符合筛选条件 ${(tableData?.total ?? 0).toLocaleString()} 条`"
      :cards="cards"
      :model-value="queryData.status"
      @change="handleQuickStatus"
    >
      <template #search>
        <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
      </template>
      <template #toolbar>
        <ProToolbar
          :show-edit="false"
          :show-delete="selectedRow?.status === 'DRAFT' || selectedRow?.status === 'CONFIRMED'"
          delete-label="取消发货单"
          :show-export="false"
          :show-status="!!workflow"
          :status-label="workflow?.label"
          @add="handleAdd"
          @delete="handleDelete"
          @status="advanceWorkflow"
          @refresh="handleRefresh"
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
        <template #status="{ row }">
          <el-tag :type="statusMap[row.status]?.type ?? 'info'">
            {{ statusMap[row.status]?.label ?? '未知' }}
          </el-tag>
        </template>
      </ProTable>
    </section>
  </div>
  <SaveDialog :visible="visible" :mode="model" @cancel="handleCancel" @submit="handleSubmit" />
  <DetailDialog :visible="detailVisible" :delivery-id="currentDetailId" @cancel="detailVisible = false" />
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
