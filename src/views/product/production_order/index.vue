<script setup lang="ts">
import ProTable, { type ProColumn } from '@/components/ProTable.vue';
import { computed, onMounted, ref, reactive } from 'vue';
import { getPageProductionOrder, createProductionOrder, cancelProductionOrder } from '@/api/product/productionOrder';
import type { ProductionOrderVo, ProductionOrderQuery, ProductionOrderAdd } from '@/types/product/productionOrder';
import type { PageResult } from '@/types/common';
import ProToolbar from '@/components/ProToolbar.vue';
import Selector from './components/selector.vue'
import SaveDialog from './components/saveDialog.vue'
import DetailDialog from './components/detailDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { formatDate, formatDecimal } from '@/composables/useFormat';
import ProPageHeader, { type ProPageHeaderCard } from '@/components/ProPageHeader.vue';

const queryData = reactive<ProductionOrderQuery>({
  pageNum: 1,
  pageSize: 10,
  productionOrderNo: '',
  productionDemandNo: '',
  materialId: '',
  status: undefined,
  plannedStartTime: '',
  plannedEndTime: ''
});

const tableData = ref<PageResult<ProductionOrderVo>>();
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

const columns = ref<ProColumn<ProductionOrderVo>[]>([
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '生产订单号', prop: 'productionOrderNo', width: 180 },
  { label: '需求单号', prop: 'productionDemandNo', width: 180 },
  { label: '物料编码', prop: 'materialCode', width: 200 },
  { label: '物料名称', prop: 'materialName', width: 180 },
  { label: '计划数量', prop: 'plannedQuantity', width: 100, slot: 'plannedQuantity' },
  { label: '实际数量', prop: 'actualQuantity', width: 100, slot: 'actualQuantity' },
  { label: '计划开始时间', prop: 'plannedStartTime', width: 180, slot: 'plannedStartTime' },
  { label: '计划结束时间', prop: 'plannedEndTime', width: 180, slot: 'plannedEndTime' },
  { label: '实际开始时间', prop: 'actualStartTime', width: 180, slot: 'actualStartTime' },
  { label: '实际结束时间', prop: 'actualEndTime', width: 180, slot: 'actualEndTime' },
  { label: '备注', prop: 'remark', minWidth: 150 }
]);

const statusMap: Record<number, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  0: { label: '草稿', type: 'info' },
  1: { label: '已下达', type: 'success' },
  2: { label: '生产中', type: 'warning' },
  3: { label: '已完成', type: 'success' },
  4: { label: '已取消', type: 'danger' }
}

const quickStatusOptions = [
  { label: '草稿', value: 0, tone: 'info' },
  { label: '已下达', value: 1, tone: 'success' },
  { label: '生产中', value: 2, tone: 'warning' },
  { label: '已完成', value: 3, tone: 'success' },
  { label: '已取消', value: 4, tone: 'danger' },
] as const

const statusCards = computed<ProPageHeaderCard[]>(() => {
  const counts = new Map<number, number>()
  for (const record of tableData.value?.records ?? []) {
    counts.set(record.status, (counts.get(record.status) ?? 0) + 1)
  }
  return quickStatusOptions.map(option => ({
    ...option,
    count: counts.get(option.value) ?? 0,
    hint: '条 · 当前页',
  }))
})

const handleQuery = () => {
  queryData.pageNum = 1;
  loadData();
}

const handleQuickStatus = (status: string | number | null) => {
  queryData.status = status === null || status === '' ? undefined : Number(status)
  handleQuery()
}

const handleReset = () => {
  queryData.productionOrderNo = '';
  queryData.productionDemandNo = '';
  queryData.materialId = '';
  queryData.status = undefined;
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

const handleSubmit = async (data: ProductionOrderAdd) => {
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
    <ProPageHeader title="生产订单" description="安排生产计划，跟踪订单执行与完工进度"
      :summary="`符合筛选条件 ${(tableData?.total ?? 0).toLocaleString()} 条`" :cards="statusCards"
      :model-value="queryData.status" @change="handleQuickStatus">
      <template #search>
        <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
      </template>
      <template #toolbar>
        <ProToolbar @add="handleAdd" @edit="handleEdit" @delete="handleDelete" @refresh="handleRefresh" />
      </template>
    </ProPageHeader>
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