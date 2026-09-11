<script setup lang="ts">
import ProTable, { type ProColumn } from '@/components/ProTable.vue';
import { onMounted, ref, reactive } from 'vue';
import { getPageSalesOrder, addSalesOrder, updateSalesOrder, removeSalesOrder } from '@/api/sales/salesOrder';
import type { PageSalesOrder, SalesOrderVo, GetPageSalesOrderQuery, PostOrPutSalesOrder } from '@/types/sales/salesOrder';
import ProToolbar from '@/components/ProToolbar.vue';
import Selector from './components/selector.vue'
import SaveDialog from './components/saveDialog.vue'
import DetailDialog from './components/detailDialog.vue'
import { ElMessage } from 'element-plus';
import { formatDecimal } from '@/composables/useFormat';
import PageHeader from '@/components/PageHeader.vue'

const queryData = reactive<GetPageSalesOrderQuery>({
  pageNum: 1,
  pageSize: 10,
  orderNo: '',
  customerId: '',
  status: null
});

const tableData = ref<PageSalesOrder>();
const tableRef = ref<{ clearSelection: () => void }>();
const selectedRowId = ref<string>();
const visible = ref<boolean>(false)
const detailVisible = ref<boolean>(false)
const currentDetailId = ref<string>()
const model = ref<'add' | 'edit'>('add')

const handleSelectionChange = (rows: SalesOrderVo[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined;
};

const loadData = async () => {
  tableData.value = await getPageSalesOrder(queryData);
};

const columns = ref<ProColumn<SalesOrderVo>[]>([
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '订单号', prop: 'orderNo', width: 200 },
  { label: '客户名称', prop: 'customerName', width: 200 },
  { label: '订单日期', prop: 'orderDate', width: 180 },
  { label: '交货日期', prop: 'deliveryDate', width: 180 },
  { label: '总金额', prop: 'totalAmount', width: 120, slot: 'totalAmount' },
  { label: '备注', prop: 'remark', minWidth: 150 }
]);

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  CONFIRMED: { label: '已确认', type: 'success' },
  IN_PROGRESS: { label: '执行中', type: 'warning' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' }
}

const handleQuery = () => {
  queryData.pageNum = 1;
  loadData();
}

const handleReset = () => {
  queryData.orderNo = '';
  queryData.customerId = '';
  queryData.status = null;
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
    await removeSalesOrder(selectedRowId.value)
    ElMessage.success('删除成功')
    loadData()
  } catch {
    ElMessage.error('删除失败')
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
  loadData();
});

</script>

<template>
  <div class="container">
    <PageHeader title="销售订单" description="管理客户订单与履约状态">
      <template #search>
        <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
      </template>
      <template #toolbar>
        <ProToolbar @add="handleAdd" @edit="handleEdit" @delete="handleDelete" @refresh="handleRefresh" />
      </template>
    </PageHeader>
    <section class="table">
      <ProTable ref="tableRef" :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.pageNum" :page-size="queryData.pageSize"
        @update:page="(p: number) => { queryData.pageNum = p; loadData() }"
        @update:pageSize="(s: number) => { queryData.pageSize = s; queryData.pageNum = 1; loadData() }"
        @selectionChange="handleSelectionChange" @rowDblclick="handleRowDblclick">
        <template #totalAmount="{ row }">
          {{ formatDecimal.thousand(row.totalAmount) }}
        </template>
        <template #status="{ row }">
          <el-tag :type="statusMap[row.status]?.type ?? 'info'">
            {{ statusMap[row.status]?.label ?? row.status }}
          </el-tag>
        </template>
      </ProTable>
    </section>
  </div>
  <SaveDialog :visible="visible" :mode="model"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))" @cancel="handleCancel"
    @submit="handleSubmit" />
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