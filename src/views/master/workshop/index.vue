<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Selector from "@/views/master/workshop/components/selector.vue";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTable, { type ProColumn } from "@/components/ProTable.vue"
import { getWorkshopList, createWorkshop, updateWorkshop, changeWorkshopStatus } from "@/api/master/workshop.ts";
import type {
  WorkshopCreateRequest,
  WorkshopListRequest,
  WorkshopListResponse,
  WorkshopUpdateRequest,
  WorkshopVO
} from "@/types/master/workshop.ts";
import { ElMessage, ElMessageBox } from "element-plus";
import SaveDialog from "@/views/master/workshop/components/saveDialog.vue";
import DetailDialog from "@/views/master/workshop/components/detailDialog.vue";
import PageHeader from '@/components/PageHeader.vue'

const queryData = reactive<WorkshopListRequest>({
  page: 1,
  pageSize: 10,
  name: '',
  code: '',
  // 未选择工厂时传 null 而不是 ''，避免后端把空字符串当成有效条件过滤导致列表查不到数据
  factoryId: null,
})

const tableData = ref<WorkshopListResponse>()
const visible = ref(false)
const detailVisible = ref(false)
const model = ref<'add' | 'edit'>('add')
const selectedRowId = ref<string>('')
const tableRef = ref<{ clearSelection: () => void }>()

const columns = ref<ProColumn[]>([
  { label: '状态', prop: 'status', width: 90, slot: 'status' },
  { label: '车间名称', prop: 'name', minWidth: 140 },
  { label: '简称', prop: 'shortName', width: 120 },
  { label: '所属工厂', prop: 'factoryName', minWidth: 140 },
  { label: '备注', prop: 'remark', minWidth: 160 },
])


const loadData = async () => {
  try {
    // 完整记录实际发送的查询参数与后端返回，定位"保存成功但列表查不到"
    console.log('[workshop] loadData query =', JSON.stringify(queryData))
    tableData.value = await getWorkshopList(queryData)
    console.log('[workshop] loadData res =', JSON.stringify(tableData.value))
  } catch {
    ElMessage.error('获取车间列表失败')
  }
}

const handleQuery = (params: WorkshopListRequest) => {
  Object.assign(queryData, params)
  queryData.page = 1
  loadData()
}

const handleReset = () => {
  queryData.name = ''
  queryData.code = ''
  queryData.factoryId = null
  queryData.page = 1
  loadData()
}

const handleSelectionChange = (rows: WorkshopVO[]) => {
  // 诊断：确认选中行的 id 是否有值（车间 id 可能跟工厂一样返回 null）
  console.log('[workshop] selection rows =', JSON.stringify(rows), 'id =', rows[0]?.id)
  selectedRowId.value = rows[0]?.id ?? ''
}

const handleAdd = () => {
  visible.value = true
  model.value = 'add'
}

const handleEdit = () => {
  if (!selectedRowId.value) {
    ElMessage.warning('请选择要编辑的车间')
    return
  }
  model.value = 'edit'
  visible.value = true
}

const handleStatus = async () => {
  const rowId = selectedRowId.value
  if (!rowId) {
    ElMessage.warning('请选择要切换状态的车间')
    return
  }
  const row = tableData.value?.records?.find(item => String(item.id) === String(rowId))
  if (!row) return
  const target = row.status === 1 ? 'DISABLE' : 'ENABLE'
  const action = target === 'ENABLE' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定要${action}选中的车间吗？`, '状态确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch {
    return // 用户取消
  }
  try {
    await changeWorkshopStatus(String(rowId), target)
    ElMessage.success(`${action}成功`)
    tableRef.value?.clearSelection()
    selectedRowId.value = ''
    await loadData()
  } catch {
    ElMessage.error(`${action}失败`)
  }
}

const handleRefresh = () => {
  loadData()
}

const handleRowDblclick = (row: WorkshopVO) => {
  detailVisible.value = true
  selectedRowId.value = String(row.id)
}

const handleSubmit = async (form: WorkshopCreateRequest | WorkshopUpdateRequest) => {
  try {
    if (model.value === 'edit' && selectedRowId.value) {
      await updateWorkshop(String(selectedRowId.value), form)
    } else {
      await createWorkshop(form as WorkshopCreateRequest)
    }
    ElMessage.success('保存成功')
    visible.value = false
    tableRef.value?.clearSelection()
    selectedRowId.value = ''
    await loadData()
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
  <div class="workshop-index round">
    <PageHeader title="车间管理" description="维护工厂车间资料与启用状态">
      <template #search><Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" /></template>
      <template #toolbar><ProToolbar :show-delete="false" show-status @add="handleAdd" @edit="handleEdit"
        @status="handleStatus" @refresh="handleRefresh" /></template>
    </PageHeader>
    <div class="table round">
      <ProTable ref="tableRef" :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.page" :page-size="queryData.pageSize"
        @update:page="(p: number) => { queryData.page = p; loadData() }"
        @update:pageSize="(s: number) => { queryData.pageSize = s; queryData.page = 1; loadData() }"
        @selectionChange="handleSelectionChange" @rowDblclick="handleRowDblclick">
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </ProTable>
    </div>
  </div>

  <SaveDialog v-model="visible" :model="model" :selectedRowId="selectedRowId" @submit="handleSubmit"
    @cancel="handleCancel" />
  <DetailDialog :visible="detailVisible"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))"
    @cancel="detailVisible = false" />
</template>

<style scoped>
.workshop-index {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .selector {
    width: 100%;
    display: flex;
    gap: 10px;
  }

  .toolbar {
    width: 100%;
    display: flex;
    gap: 10px;
  }

  .table {
    flex: 1;
  }
}
</style>
