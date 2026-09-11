<script setup lang="ts">
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import { computed, onMounted, ref, reactive } from 'vue'
import {
  getPageSalesOrder,
  addSalesOrder,
  updateSalesOrder,
  removeSalesOrder,
  confirmSalesOrder,
  cancelSalesOrder,
} from '@/api/sales/salesOrder'
import type {
  PageSalesOrder,
  SalesOrderVo,
  GetPageSalesOrderQuery,
  PostOrPutSalesOrder,
} from '@/types/sales/salesOrder'
import ProToolbar from '@/components/ProToolbar.vue'
import Selector from './components/selector.vue'
import SaveDialog from './components/saveDialog.vue'
import DetailDialog from './components/detailDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDecimal } from '@/composables/useFormat'
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue'

defineOptions({ name: 'SalesOrderPage' })

const queryData = reactive<GetPageSalesOrderQuery>({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  customerId: '',
  status: null,
})

const tableData = ref<PageSalesOrder>()
const selectedRowId = ref<string>()
const visible = ref<boolean>(false)
const detailVisible = ref<boolean>(false)
const currentDetailId = ref<string>()
const model = ref<'add' | 'edit'>('add')
const selectedRow = computed(
  () => tableData.value?.records?.find((item) => String(item.id) === String(selectedRowId.value)) ?? null,
)

const handleSelectionChange = (rows: SalesOrderVo[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined
}

const loadData = async () => {
  tableData.value = await getPageSalesOrder(queryData)
}

const columns = ref<ProColumn<SalesOrderVo>[]>([
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '订单号', prop: 'orderNo', width: 200 },
  { label: '客户名称', prop: 'customerName', width: 200 },
  { label: '订单日期', prop: 'orderDate', width: 180 },
  { label: '交货日期', prop: 'deliveryDate', width: 180 },
  { label: '总金额', prop: 'totalAmount', width: 120, slot: 'totalAmount' },
  { label: '备注', prop: 'remark', minWidth: 150 },
])

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  CONFIRMED: { label: '已确认', type: 'success' },
  IN_PROGRESS: { label: '执行中', type: 'warning' },
  COMPLETED: { label: '已完成', type: 'success' },
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
  if (selectedRow.value?.status === 'DRAFT') return { label: '确认订单', action: confirmSalesOrder }
  if (selectedRow.value?.status === 'CONFIRMED') return { label: '取消订单', action: cancelSalesOrder }
  return null
})

const handleQuery = (params?: GetPageSalesOrderQuery) => {
  if (params) Object.assign(queryData, params)
  queryData.pageNum = 1
  loadData()
}

const handleReset = () => {
  queryData.orderNo = ''
  queryData.customerId = ''
  queryData.status = null
  queryData.pageNum = 1
  loadData()
}

const handleQuickStatus = (status: string | number) => {
  queryData.status = String(status) as GetPageSalesOrderQuery['status']
  handleQuery()
}

const handleAdd = () => {
  visible.value = true
  model.value = 'add'
}

const handleEdit = () => {
  if (!selectedRowId.value) {
    ElMessage.warning('请选择一条数据进行编辑')
    return
  }
  if (selectedRow.value?.status !== 'DRAFT') {
    ElMessage.warning('仅草稿销售订单可编辑')
    return
  }
  visible.value = true
  model.value = 'edit'
}

const handleDelete = async () => {
  if (!selectedRowId.value) {
    ElMessage.warning('请选择一条数据进行删除')
    return
  }

  try {
    if (selectedRow.value?.status !== 'DRAFT') {
      ElMessage.warning('仅草稿销售订单可删除')
      return
    }
    await ElMessageBox.confirm('删除后不可恢复，确定删除该销售订单吗？', '删除订单', {
      type: 'warning',
    })
    await removeSalesOrder(selectedRowId.value)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}

const advanceWorkflow = async () => {
  if (!selectedRow.value || !workflow.value) return void ElMessage.warning('请选择可流转的销售订单')
  const action = workflow.value
  try {
    await ElMessageBox.confirm(`确定${action.label}吗？`, '销售订单状态流转', { type: 'warning' })
    await action.action(selectedRow.value.id)
    ElMessage.success(`${action.label}成功`)
    loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}

const handleRefresh = () => {
  loadData()
}

const handleRowDblclick = (row: SalesOrderVo) => {
  currentDetailId.value = String(row.id)
  detailVisible.value = true
}

const handleSubmit = async (data: PostOrPutSalesOrder) => {
  try {
    if (model.value === 'edit') {
      await updateSalesOrder(selectedRowId.value!, data)
      ElMessage.success('修改成功')
    } else {
      await addSalesOrder(data)
      ElMessage.success('新增成功')
    }
    visible.value = false
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
      title="销售订单"
      description="管理客户订单、库存预占与履约状态"
      :summary="`符合筛选条件 ${(tableData?.total ?? 0).toLocaleString()} 条`"
      :cards="cards"
      :model-value="queryData.status ?? ''"
      @change="handleQuickStatus"
    >
      <template #search>
        <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
      </template>
      <template #toolbar>
        <ProToolbar
          :show-edit="selectedRow?.status === 'DRAFT'"
          :show-delete="selectedRow?.status === 'DRAFT'"
          :show-export="false"
          :show-status="!!workflow"
          :status-label="workflow?.label"
          @add="handleAdd"
          @edit="handleEdit"
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
        <template #totalAmount="{ row }">{{ formatDecimal.thousand(row.totalAmount) }}</template>
        <template #status="{ row }">
          <el-tag :type="statusMap[row.status]?.type ?? 'info'">
            {{ statusMap[row.status]?.label ?? row.status }}
          </el-tag>
        </template>
      </ProTable>
    </section>
  </div>
  <SaveDialog :visible="visible" :mode="model" :row="selectedRow" @cancel="handleCancel" @submit="handleSubmit" />
  <DetailDialog :visible="detailVisible" :order-id="currentDetailId" @cancel="detailVisible = false" />
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
