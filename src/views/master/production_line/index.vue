<script setup lang="ts">
import Selector from "@/views/master/production_line/components/selector.vue";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTable, { type ProColumn } from "@/components/ProTable.vue"
import { onMounted, ref, reactive } from 'vue'
import { changeProductionLineStatus, createProductionLine, getProductionLineList, updateProductionLine } from "@/api/master/productionLine.ts";
import type {
  ProductionLineCreateRequest,
  ProductionLineListRequest,
  ProductionLineListResponse,
  ProductionLineUpdateRequest,
  ProductionLineVO
} from "@/types/master/productionLine.ts";
import SaveDialog from "@/views/master/production_line/components/saveDialog.vue";
import DetailDialog from "@/views/master/production_line/components/detailDialog.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ProPageTitle from '@/components/ProPageTitle.vue'

const queryData = reactive<ProductionLineListRequest>({
  page: 1,
  pageSize: 10,
  name: null,
  workshopId: null,
  status: null,
})

const tableData = ref<ProductionLineListResponse>()
const visible = ref(false)
const detailVisible = ref(false)
const model = ref<'add' | 'edit'>('add')
const selectedRowId = ref<string>()
const tableRef = ref<{ clearSelection: () => void }>()

const handleSelectionChange = (rows: ProductionLineVO[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined
}

const loadData = async () => {
  tableData.value = await getProductionLineList(queryData)
}

const columns = ref<ProColumn[]>([
  { label: '状态', prop: 'status', width: 90, slot: 'status' },
  { label: '生产线名称', prop: 'name', minWidth: 140 },
  { label: '所属车间', prop: 'workshopName', minWidth: 140 },
  { label: '日产能', prop: 'capacityPerDay', width: 100 },
  { label: '备注', prop: 'remark', minWidth: 140 },
])

const handleQuery = (params: ProductionLineListRequest) => {
  Object.assign(queryData, params, { page: 1 })
  loadData()
}

const handleReset = () => {
  queryData.name = null
  queryData.workshopId = null
  queryData.status = null
  queryData.page = 1
  handleQuery(queryData)
}

onMounted(() => {
  loadData()
})

const handleAdd = () => {
  model.value = 'add'
  visible.value = true
}

const handleEdit = () => {
  const row = tableData.value?.records?.find(item => String(item.id) === selectedRowId.value)
  if (!row) {
    ElMessage.warning('请选择要编辑的生产线')
    return
  }
  model.value = 'edit'
  visible.value = true
}

const handleStatus = async () => {
  const row = tableData.value?.records?.find(item => String(item.id) === selectedRowId.value)
  if (!row) {
    ElMessage.warning('请选择要切换状态的生产线')
    return
  }
  const target = row.status === 1 ? 'DISABLE' : 'ENABLE'
  const action = target === 'ENABLE' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}生产线 ${row.name} 吗？`,
      '状态确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    )
  } catch {
    return // 用户取消
  }
  try {
    // 生产线状态变更 status 是 query 参数
    await changeProductionLineStatus(String(row.id), target)
    ElMessage.success(`${action}成功`)
    tableRef.value?.clearSelection()
    selectedRowId.value = undefined
    await loadData()
  } catch {
    ElMessage.error(`${action}失败`)
  }
}

const handleRefresh = () => {
  loadData()
}

const handleRowDblclick = (row: ProductionLineVO) => {
  detailVisible.value = true
  selectedRowId.value = String(row.id)
}

const handleSubmit = async (form: ProductionLineCreateRequest | ProductionLineUpdateRequest) => {
  try {
    if (model.value === 'edit' && selectedRowId.value) {
      await updateProductionLine(selectedRowId.value, form as ProductionLineUpdateRequest)
    } else {
      await createProductionLine(form as ProductionLineCreateRequest)
    }
    ElMessage.success('保存成功')
    visible.value = false
    tableRef.value?.clearSelection()
    selectedRowId.value = undefined
    await loadData()
  } catch {
    ElMessage.error('保存失败')
  }
}

const handleCancel = () => {
  visible.value = false
}
</script>

<template>
  <div class="production-line-container round">
    <ProPageTitle title="生产线管理" description="维护生产线归属与运行状态" />
    <div class="selector round">
      <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
    </div>
    <div class="toolbar round">
      <ProToolbar :show-delete="false" show-status @add="handleAdd" @edit="handleEdit" @status="handleStatus"
        @refresh="handleRefresh" />
    </div>
    <div class="table round">
      <ProTable ref="tableRef" :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.page" :page-size="queryData.pageSize"
        @update:page="(p: number) => { queryData.page = p; loadData() }"
        @update:pageSize="(s: number) => { queryData.pageSize = s; queryData.page = 1; loadData() }"
        @selectionChange="handleSelectionChange" @rowDblclick="handleRowDblclick">
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </ProTable>
    </div>
  </div>

  <SaveDialog :visible="visible" :title="model === 'add' ? '新增生产线' : '修改生产线'" :mode="model"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))" @cancel="handleCancel"
    @submit="handleSubmit" />
  <DetailDialog :visible="detailVisible"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))"
    @cancel="detailVisible = false" />
</template>

<style scoped>
.production-line-container {
  width: 100%;
  height: 100%;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.production-line-container .selector {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e4e7ed;
}

.production-line-container .toolbar {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e4e7ed;
}

.production-line-container .table {
  width: 100%;
  flex: 1;
  min-height: 0;
}
</style>
