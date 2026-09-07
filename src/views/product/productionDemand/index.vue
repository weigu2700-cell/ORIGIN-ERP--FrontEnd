<script setup lang="ts">
import ProTable, { type ProColumn } from '@/components/ProTable.vue';
import { onMounted, ref, reactive } from 'vue';
import { getPageProductionDemand, getDetailProductionDemand } from '@/api/product/productionDemand';
import type { PageProductionDemandVo, ProductionDemandVo, GetPageProductionDemandRequest } from '@/types/product/productionDemand';
import ProToolbar from '@/components/ProToolbar.vue';
import Selector from './components/selector.vue'
import DetailDialog from './components/detailDialog.vue'
import { ElMessage } from 'element-plus';
import { formatDecimal } from '@/composables/useFormat';
import BusinessStatusFilter from '@/components/BusinessStatusFilter.vue';

const queryData = reactive<GetPageProductionDemandRequest>({
  pageNum: 1,
  pageSize: 10,
  demandNo: '',
  materialId: '',
  sourceType: '',
  status: ''
});

const tableData = ref<PageProductionDemandVo>();
const selectedRowId = ref<string>();
const detailVisible = ref<boolean>(false)
const currentDetailId = ref<string>()

const handleSelectionChange = (rows: ProductionDemandVo[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined;
};

const loadData = async () => {
  tableData.value = await getPageProductionDemand(queryData);
};

const columns = ref<ProColumn[]>([
  { label: '需求单号', prop: 'demandNo', width: 180 },
  { label: '物料编码', prop: 'materialCode', width: 140 },
  { label: '物料名称', prop: 'materialName', width: 160 },
  { label: '数量', prop: 'quantity', width: 100, slot: 'quantity' },
  { label: '来源类型', prop: 'sourceType', width: 120, slot: 'sourceType' },
  { label: '来源单号', prop: 'sourceNo', width: 180 },
  { label: '状态', prop: 'status', width: 100, slot: 'status' }
]);

const sourceTypeMap: Record<string, string> = {
  SALES_ORDER: '销售订单',
  FORECAST: '预测',
  MANUAL: '手工创建'
}

const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' }> = {
  PENDING: { label: '待生产', type: 'info' },
  PLANNED: { label: '已计划', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' }
}

const quickStatusOptions = [
  { label: '待生产', value: 'PENDING' },
  { label: '已计划', value: 'PLANNED', tone: 'success' },
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
  queryData.demandNo = '';
  queryData.materialId = '';
  queryData.sourceType = '';
  queryData.status = '';
  queryData.pageNum = 1;
  loadData();
}

const handleRefresh = () => {
  loadData()
}

const handleRowDblclick = (row: ProductionDemandVo) => {
  currentDetailId.value = String(row.id)
  detailVisible.value = true
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
      <ProToolbar @refresh="handleRefresh">
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
        <template #quantity="{ row }">
          {{ formatDecimal.default(row.quantity, 0) }}
        </template>
        <template #sourceType="{ row }">
          {{ sourceTypeMap[row.sourceType] ?? row.sourceType }}
        </template>
        <template #status="{ row }">
          <el-tag :type="statusMap[row.status]?.type ?? 'info'">
            {{ statusMap[row.status]?.label ?? row.status }}
          </el-tag>
        </template>
      </ProTable>
    </section>
  </div>
  <DetailDialog :visible="detailVisible" :demand-id="currentDetailId" @cancel="detailVisible = false" />
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
