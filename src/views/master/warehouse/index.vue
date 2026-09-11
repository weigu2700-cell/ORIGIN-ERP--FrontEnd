<script setup lang="ts">
import Selector from "@/views/master/warehouse/components/selector.vue";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTable, { type ProColumn } from "@/components/ProTable.vue"
import { onMounted, ref, reactive } from 'vue'
import { changeWarehouseStatus, addWarehouse, getPageWarehouseList, updateWarehouse } from "@/api/master/warehouse.ts";
import type {
  WarehouseCreateRequest,
  WarehouseListRequest,
  WarehouseListResponse,
  WarehouseUpdateRequest,
  WarehouseVO
} from "@/types/master/warehouse.ts";
import SaveDialog from "@/views/master/warehouse/components/saveDialog.vue";
import DetailDialog from "@/views/master/warehouse/components/detailDialog.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import PageHeader from '@/components/PageHeader.vue'

const queryData = reactive<WarehouseListRequest>({
  page: 1,
  pageSize: 10,
  name: null,
  code: null,
  factoryId: null,
  type: null,
  status: null,
})

const tableData = ref<WarehouseListResponse>()
const visible = ref(false)
const detailVisible = ref(false)
const model = ref<'add' | 'edit'>('add')
const selectedRowId = ref<string>()
const tableRef = ref<{ clearSelection: () => void }>()

// 兼容旧后端返回的枚举名称和新接口返回的状态码，避免启用仓库被误显示为停用。
const isEnabledStatus = (status: unknown) => status === 1 || status === '1' || status === 'ENABLE'

const handleSelectionChange = (rows: WarehouseVO[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined
}

const loadData = async () => {
  tableData.value = await getPageWarehouseList(queryData)
}

const columns = ref<ProColumn<WarehouseVO>[]>([
  { label: '仓库名称', prop: 'name', minWidth: 140 },
  { label: '仓库编码', prop: 'code', width: 240 },
  { label: '仓库类型', prop: 'type', width: 100, slot: 'type' },
  { label: '所属工厂', prop: 'factoryName', minWidth: 140 },
  { label: '状态', prop: 'status', width: 90, slot: 'status' },
  { label: '地址', prop: 'address', minWidth: 180 },
  { label: '备注', prop: 'remark', minWidth: 140 },
])

const typeLabel: Record<string, string> = {
  FINISHED: '成品仓',
  MATERIAL: '原料仓',
  SEMI_FINISHED: '半成品仓',
  SCRAP: '废品仓',
  OTHER: '其他',
}

const handleQuery = (params: WarehouseListRequest) => {
  Object.assign(queryData, params, { page: 1 })
  loadData()
}

const handleReset = () => {
  queryData.name = null
  queryData.code = null
  queryData.factoryId = null
  queryData.type = null
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
    ElMessage.warning('请选择要编辑的仓库')
    return
  }
  model.value = 'edit'
  visible.value = true
}

const handleStatus = async () => {
  const row = tableData.value?.records?.find(item => String(item.id) === selectedRowId.value)
  if (!row) {
    ElMessage.warning('请选择要切换状态的仓库')
    return
  }
  const target = isEnabledStatus(row.status) ? 'DISABLE' : 'ENABLE'
  const action = target === 'ENABLE' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}仓库 ${row.name} 吗？`,
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
    await changeWarehouseStatus(String(row.id), target)
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

const handleRowDblclick = (row: WarehouseVO) => {
  detailVisible.value = true
  selectedRowId.value = String(row.id)
}

const handleSubmit = async (form: WarehouseCreateRequest | WarehouseUpdateRequest) => {
  try {
    if (model.value === 'edit' && selectedRowId.value) {
      await updateWarehouse(selectedRowId.value, form as WarehouseUpdateRequest)
    } else {
      await addWarehouse(form as WarehouseCreateRequest)
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
  <div class="warehouse-container round">
    <PageHeader title="仓库管理" description="维护仓库资料、地址与启用状态">
      <template #search>
        <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
      </template>
      <template #toolbar>
        <ProToolbar :show-delete="false" show-status @add="handleAdd" @edit="handleEdit" @status="handleStatus"
          @refresh="handleRefresh" />
      </template>
    </PageHeader>
    <div class="table round">
      <ProTable ref="tableRef" :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.page" :page-size="queryData.pageSize"
        @update:page="(p: number) => { queryData.page = p; loadData() }"
        @update:pageSize="(s: number) => { queryData.pageSize = s; queryData.page = 1; loadData() }"
        @selectionChange="handleSelectionChange" @rowDblclick="handleRowDblclick">
        <template #type="{ row }">
          {{ typeLabel[row.type] ?? row.type }}
        </template>
        <template #status="{ row }">
          <el-tag :type="isEnabledStatus(row.status) ? 'success' : 'info'" size="small">
            {{ isEnabledStatus(row.status) ? '启用' : '停用' }}
          </el-tag>
        </template>
      </ProTable>
    </div>
  </div>

  <SaveDialog :visible="visible" :title="model === 'add' ? '新增仓库' : '修改仓库'" :mode="model"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))" @cancel="handleCancel"
    @submit="handleSubmit" />
  <DetailDialog :visible="detailVisible"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))"
    @cancel="detailVisible = false" />
</template>

<style scoped>
.warehouse-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warehouse-container .selector {
  width: 100%;
  background: #ffffff;
}

.warehouse-container .toolbar {
  width: 100%;
  background: #ffffff;
}

.warehouse-container .table {
  width: 100%;
  flex: 1;
  min-height: 0;
}
</style>