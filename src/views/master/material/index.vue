<script setup lang="ts">
import Selector from "@/views/master/material/components/selector.vue";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTable, { type ProColumn } from "@/components/ProTable.vue"
import { onMounted, ref, reactive } from 'vue'
import {
  changeMaterialStatus,
  createMaterial,
  getMaterialList,
  updateMaterial
} from "@/api/master/material.ts";
import type {
  MaterialCreateRequest,
  MaterialListRequest,
  MaterialListResponse,
  MaterialUpdateRequest,
  MaterialVO
} from "@/types/master/material.ts";
import SaveDialog from "@/views/master/material/components/saveDialog.vue";
import DetailDialog from "@/views/master/material/components/detailDialog.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import BusinessStatusFilter from '@/components/BusinessStatusFilter.vue';

const queryData = reactive<MaterialListRequest>({
  page: 1,
  pageSize: 10,
  name: null,
  code: null,
  spec: null,
  type: null,
  status: null,
})

const tableData = ref<MaterialListResponse>()
const visible = ref(false)
const detailVisible = ref(false)
const model = ref<'add' | 'edit'>('add')
const selectedRowId = ref<string>()
const tableRef = ref<{ clearSelection: () => void }>()

const handleSelectionChange = (rows: MaterialVO[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined
}

const loadData = async () => {
  tableData.value = await getMaterialList(queryData)
}

const columns = ref<ProColumn[]>([
  { label: '状态', prop: 'status', width: 90, slot: 'status' },
  { label: '物料编码', prop: 'code', width: 240 },
  { label: '物料名称', prop: 'name', width: 220 },
  { label: '规格', prop: 'spec', width: 160 },
  { label: '类型', prop: 'type', width: 110, slot: 'type' },
  { label: '单位', prop: 'unit', width: 80 },
  { label: '安全库存', prop: 'safetyStock', width: 100 },
  { label: '备注', prop: 'remark', minWidth: 140 },
])

const typeLabel: Record<string, string> = {
  RAW_MATERIAL: '原材料',
  SEMI_FINISHED: '半成品',
  PACKAGING: '包装材料',
  CONSUMABLE: '耗材',
  OTHER: '其他',
}

const quickStatusOptions = [
  { label: '启用', value: 'ENABLE', tone: 'success' },
  { label: '停用', value: 'DISABLE' },
]

const handleQuery = (params: MaterialListRequest) => {
  Object.assign(queryData, params, { page: 1 })
  loadData()
}

const handleQuickStatus = (status: string | number | null) => {
  queryData.status = status as MaterialListRequest['status']
  handleQuery(queryData)
}

const handleReset = () => {
  queryData.name = null
  queryData.code = null
  queryData.spec = null
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
    ElMessage.warning('请选择要编辑的物料')
    return
  }
  model.value = 'edit'
  visible.value = true
}

const handleStatus = async () => {
  const row = tableData.value?.records?.find(item => String(item.id) === selectedRowId.value)
  if (!row) {
    ElMessage.warning('请选择要切换状态的物料')
    return
  }
  const target = row.status === 1 ? 'DISABLE' : 'ENABLE'
  const action = target === 'ENABLE' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}物料 ${row.name} 吗？`,
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
    // 物料状态变更 body 是原始字符串
    await changeMaterialStatus(String(row.id), target)
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

const handleRowDblclick = (row: MaterialVO) => {
  detailVisible.value = true
  selectedRowId.value = String(row.id)
}

const handleSubmit = async (form: MaterialCreateRequest | MaterialUpdateRequest) => {
  try {
    if (model.value === 'edit' && selectedRowId.value) {
      await updateMaterial(selectedRowId.value, form as MaterialUpdateRequest)
    } else {
      await createMaterial(form as MaterialCreateRequest)
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
  <div class="material-container round">
    <div class="selector round">
      <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
    </div>
    <div class="toolbar round">
      <ProToolbar :show-delete="false" show-status @add="handleAdd" @edit="handleEdit" @status="handleStatus"
        @refresh="handleRefresh">
        <BusinessStatusFilter :model-value="queryData.status ?? null" business-type="master"
          :options="quickStatusOptions" @change="handleQuickStatus" />
      </ProToolbar>
    </div>
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
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </ProTable>
    </div>
  </div>

  <SaveDialog :visible="visible" :title="model === 'add' ? '新增物料' : '修改物料'" :mode="model"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))" @cancel="handleCancel"
    @submit="handleSubmit" />
  <DetailDialog :visible="detailVisible"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))"
    @cancel="detailVisible = false" />
</template>

<style scoped>
.material-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-container .selector {
  width: 100%;
  background: #ffffff;
}

.material-container .toolbar {
  width: 100%;
  background: #ffffff;
}

.material-container .table {
  width: 100%;
  flex: 1;
  min-height: 0;
}
</style>
