<script setup lang="ts">
import ProTable, { type ProColumn } from '@/components/ProTable.vue';
import { onMounted, ref, reactive } from 'vue';
import { getLPageSalesDelivery, postSalesDelivery, removeSalesDelivery } from '@/api/sales/salesDelivery';
import type { PageSalesDelivery, SalesDeliveryVo, GetPageSalesDelivery, PostSaleDelivery } from '@/types/sales/salesDelivery';
import ProToolbar from '@/components/ProToolbar.vue';
import Selector from './components/selector.vue'
import SaveDialog from './components/saveDialog.vue'
import DetailDialog from './components/detailDialog.vue'
import { ElMessage } from 'element-plus';
import BusinessStatusFilter from '@/components/BusinessStatusFilter.vue';

const queryData = reactive<GetPageSalesDelivery>({
  pageNum: 1,
  pageSize: 10,
  deliveryNo: '',
  salesOrderId: null,
  customerId: null,
  status: ''
});

const tableData = ref<PageSalesDelivery>();
const tableRef = ref<{ clearSelection: () => void }>();
const selectedRowId = ref<string>();
const visible = ref<boolean>(false)
const detailVisible = ref<boolean>(false)
const model = ref<'add' | 'edit'>('add')
const currentDetailId = ref<string>()

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  CONFIRMED: { label: '已确认', type: 'success' },
  COMPLETED: { label: '已完成', type: 'warning' },
  CANCELLED: { label: '已取消', type: 'danger' }
}

const quickStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已确认', value: 'CONFIRMED', tone: 'success' },
  { label: '已完成', value: 'COMPLETED', tone: 'success' },
  { label: '已取消', value: 'CANCELLED', tone: 'danger' },
]

const handleSelectionChange = (rows: SalesDeliveryVo[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined;
};

const loadData = async () => {
  tableData.value = await getLPageSalesDelivery(queryData);
};

const columns = ref<ProColumn[]>([
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '交货单号', prop: 'deliveryNo', width: 200 },
  { label: '销售订单号', prop: 'salesOrderNo', width: 200 },
  { label: '客户名称', prop: 'customerName', width: 200 },
  { label: '交货日期', prop: 'deliveryDate', width: 200 },
  { label: '备注', prop: 'remark', minWidth: 150 }
]);

const handleQuery = () => {
  queryData.pageNum = 1;
  loadData();
}

const handleQuickStatus = (status: string | number | null) => {
  queryData.status = typeof status === 'string' ? status : ''
  handleQuery()
}

const handleReset = () => {
  queryData.deliveryNo = '';
  queryData.salesOrderId = null;
  queryData.customerId = null;
  queryData.status = '';
  queryData.pageNum = 1;
  loadData();
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
  visible.value = true
  model.value = 'edit'
}

const handleDelete = async () => {
  if (!selectedRowId.value) {
    ElMessage.warning('请选择一条数据进行删除')
    return
  }

  try {
    await removeSalesDelivery(selectedRowId.value)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败')
  }
}

const handleDetail = () => {
  if (!selectedRowId.value) {
    ElMessage.warning('请选择一条数据查看详情')
    return
  }
  currentDetailId.value = selectedRowId.value
  detailVisible.value = true
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
    await postSalesDelivery(data)
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
  loadData();
});

</script>

<template>
  <div class="container">
    <section class="selector">
      <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
    </section>
    <section class="toolbar">
      <ProToolbar @add="handleAdd" @delete="handleDelete" @refresh="handleRefresh" @detail="handleDetail">
        <BusinessStatusFilter :model-value="queryData.status" business-type="sales" :options="quickStatusOptions"
          empty-value="" @change="handleQuickStatus" />
      </ProToolbar>
    </section>
    <section class="table">
      <ProTable ref="tableRef" :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.pageNum" :page-size="queryData.pageSize"
        @update:page="(p: number) => { queryData.pageNum = p; loadData() }"
        @update:pageSize="(s: number) => { queryData.pageSize = s; queryData.pageNum = 1; loadData() }"
        @selectionChange="handleSelectionChange" @rowDblclick="handleRowDblclick">
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