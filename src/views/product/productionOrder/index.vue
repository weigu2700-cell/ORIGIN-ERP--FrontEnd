<script setup lang="ts">
import ProTable, { type ProColumn } from '@/components/ProTable.vue';
import { onMounted, ref, reactive } from 'vue';
import { getPageProductionOrder, createProductionOrder, cancelProductionOrder } from '@/api/product/productionOrder';
import type { PageProductionOrderResponse, ProductionOrderVo, GetPageProductionOrderRequest, CreateProductionOrderRequest } from '@/types/product/productionOrder';
import ProToolbar from '@/components/ProToolbar.vue';
import Selector from './components/selector.vue'
import SaveDialog from './components/saveDialog.vue'
import DetailDialog from './components/detailDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { formatDate, formatDecimal } from '@/composables/useFormat';
import BusinessStatusFilter from '@/components/BusinessStatusFilter.vue';

const queryData = reactive<GetPageProductionOrderRequest>({
  pageNum: 1,
  pageSize: 10,
  productionOrderNo: '',
  productionDemandNo: '',
  materialId: '',
  status: '',
  plannedStartTime: '',
  plannedEndTime: ''
});

const tableData = ref<PageProductionOrderResponse>();
const selectedRowId = ref<string>();
const visible = ref<boolean>(false)
const detailVisible = ref<boolean>(false)
const currentDetailId = ref<string>()
const model = ref<'add' | 'edit'>('add')

const handleSelectionChange = (rows: ProductionOrderVo[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined;
};

const loadData = async () => {
  tableData.value = await getPageProductionOrder(queryData);
};

const columns = ref<ProColumn[]>([
  { label: '生产订单号', prop: 'productionOrderNo', width: 180 },
  { label: '需求单号', prop: 'productionDemandNo', width: 180 },
  { label: '物料编码', prop: 'materialCode', width: 140 },
  { label: '物料名称', prop: 'materialName', width: 160 },
  { label: '计划数量', prop: 'plannedQuantity', width: 100, slot: 'plannedQuantity' },
  { label: '实际数量', prop: 'actualQuantity', width: 100, slot: 'actualQuantity' },
  { label: '计划开始时间', prop: 'plannedStartTime', width: 160, slot: 'plannedStartTime' },
  { label: '计划结束时间', prop: 'plannedEndTime', width: 160, slot: 'plannedEndTime' },
  { label: '实际开始时间', prop: 'actualStartTime', width: 160, slot: 'actualStartTime' },
  { label: '实际结束时间', prop: 'actualEndTime', width: 160, slot: 'actualEndTime' },
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '备注', prop: 'remark', minWidth: 150 }
]);

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  RELEASED: { label: '已下达', type: 'success' },
  IN_PROGRESS: { label: '生产中', type: 'warning' },
  COMPLETED: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' }
}

const quickStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已下达', value: 'RELEASED', tone: 'success' },
  { label: '生产中', value: 'IN_PROGRESS', tone: 'warning' },
  { label: '已完成', value: 'COMPLETED', tone: 'success' },
  { label: '已取消', value: 'CANCELLED', tone: 'danger' },
]

const handleQuery = () => {
  queryData.pageNum = 1;
  loadData();
}

const handleQuickStatus = (status: string | number | null) => {
  queryData.status = typeof status === 'string' ? status : ''
  handleQuery()
}

const handleReset = () => {
  queryData.productionOrderNo = '';
  queryData.productionDemandNo = '';
  queryData.materialId = '';
  queryData.status = '';
  queryData.plannedStartTime = '';
  queryData.plannedEndTime = '';
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
    await ElMessageBox.confirm('确定取消该生产订单吗？', '取消订单', { type: 'warning' })
    await cancelProductionOrder(selectedRowId.value)
    ElMessage.success('取消成功')
    loadData()
  } catch {
    // 用户取消或请求失败
  }
}

const handleRefresh = () => {
  loadData()
}

const handleRowDblclick = (row: ProductionOrderVo) => {
  currentDetailId.value = String(row.id)
  detailVisible.value = true
}

const handleSubmit = async (data: CreateProductionOrderRequest) => {
  try {
    await createProductionOrder(data)
    ElMessage.success(model.value === 'edit' ? '修改成功' : '新增成功')
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
    <section class="selector">
      <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
    </section>
    <section class="toolbar">
      <ProToolbar @add="handleAdd" @edit="handleEdit" @delete="handleDelete" @refresh="handleRefresh">
        <BusinessStatusFilter :model-value="queryData.status ?? ''" business-type="production"
          :options="quickStatusOptions" empty-value="" @change="handleQuickStatus" />
      </ProToolbar>
    </section>
    <section class="table">
      <ProTable :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.pageNum" :page-size="queryData.pageSize"
        @update:page="(p: number) => { queryData.pageNum = p; loadData() }"
        @update:pageSize="(s: number) => { queryData.pageSize = s; queryData.pageNum = 1; loadData() }"
        @selectionChange="handleSelectionChange" @rowDblclick="handleRowDblclick">
        <template #plannedQuantity="{ row }">
          {{ formatDecimal.default(row.plannedQuantity, 0) }}
        </template>
        <template #actualQuantity="{ row }">
          {{ formatDecimal.default(row.actualQuantity, 0) }}
        </template>
        <template #plannedStartTime="{ row }">
          {{ formatDate.DateTime(row.plannedStartTime) }}
        </template>
        <template #plannedEndTime="{ row }">
          {{ formatDate.DateTime(row.plannedEndTime) }}
        </template>
        <template #actualStartTime="{ row }">
          {{ row.actualStartTime ? formatDate.DateTime(row.actualStartTime) : '-' }}
        </template>
        <template #actualEndTime="{ row }">
          {{ row.actualEndTime ? formatDate.DateTime(row.actualEndTime) : '-' }}
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
