<script setup lang="ts">
import Selector from "@/views/master/material-supplier/components/selector.vue";
import ProToolbar from "@/components/ProToolbar.vue";
import ProTable, { type ProColumn } from "@/components/ProTable.vue"
import { onMounted, ref, reactive } from 'vue'
import { changeMaterialSupplierStatus, createMaterialSupplier, getMaterialSupplierList, updateMaterialSupplier } from "@/api/master/materialSupplier.ts";
import type {
  MaterialSupplierCreateRequest,
  MaterialSupplierListRequest,
  MaterialSupplierListResponse,
  MaterialSupplierUpdateRequest,
  MaterialSupplierVO
} from "@/types/master/materialSupplier.ts";
import SaveDialog from "@/views/master/material-supplier/components/saveDialog.vue";
import DetailDialog from "@/views/master/material-supplier/components/detailDialog.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { formatDecimal } from "@/composables/useFormat";
import PageHeader from '@/components/PageHeader.vue'

const queryData = reactive<MaterialSupplierListRequest>({
  page: 1,
  pageSize: 10,
  materialSupplierCode: null,
  materialId: null,
  supplierId: null,
  status: null,
})

const tableData = ref<MaterialSupplierListResponse>()
const visible = ref(false)
const detailVisible = ref(false)
const model = ref<'add' | 'edit'>('add')
const selectedRowId = ref<string>()
const tableRef = ref<{ clearSelection: () => void }>()

const handleSelectionChange = (rows: MaterialSupplierVO[]) => {
  selectedRowId.value = rows[0] ? String(rows[0].id) : undefined
}

const loadData = async () => {
  tableData.value = await getMaterialSupplierList(queryData)
}

const columns = ref<ProColumn[]>([
  { label: '关联编码', prop: 'materialSupplierCode', minWidth: 140 },
  { label: '物料名称', prop: 'materialName', minWidth: 140 },
  { label: '供应商', prop: 'supplierName', minWidth: 140 },
  { label: '采购价', prop: 'purchasePrice', width: 100, slot: 'purchasePrice' },
  { label: '交期(天)', prop: 'leadTimeDays', width: 90 },
  { label: '优选', prop: 'preferred', width: 80, slot: 'preferred' },
  { label: '状态', prop: 'status', width: 90, slot: 'status' },
  { label: '备注', prop: 'remark', minWidth: 140 },
])

const handleQuery = (params: MaterialSupplierListRequest) => {
  Object.assign(queryData, params, { page: 1 })
  loadData()
}

const handleReset = () => {
  queryData.materialSupplierCode = null
  queryData.materialId = null
  queryData.supplierId = null
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
    ElMessage.warning('请选择要编辑的关联记录')
    return
  }
  model.value = 'edit'
  visible.value = true
}

const handleStatus = async () => {
  const row = tableData.value?.records?.find(item => String(item.id) === selectedRowId.value)
  if (!row) {
    ElMessage.warning('请选择要切换状态的关联记录')
    return
  }
  const action = row.status === 1 ? '停用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}物料「${row.materialName ?? ''}」与供应商「${row.supplierName ?? ''}」的关联吗？`,
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
    // 物料供应商状态接口内部按当前状态切换
    await changeMaterialSupplierStatus(String(row.id))
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

const handleRowDblclick = (row: MaterialSupplierVO) => {
  detailVisible.value = true
  selectedRowId.value = String(row.id)
}

const handleSubmit = async (form: MaterialSupplierCreateRequest | MaterialSupplierUpdateRequest) => {
  try {
    if (model.value === 'edit' && selectedRowId.value) {
      await updateMaterialSupplier(selectedRowId.value, form as MaterialSupplierUpdateRequest)
    } else {
      await createMaterialSupplier(form as MaterialSupplierCreateRequest)
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
  <div class="material-supplier-container round">
    <PageHeader title="物料供应商" description="维护物料、供应商及采购价格关系">
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
        <template #purchasePrice="{ row }">
          {{ formatDecimal.default(row.purchasePrice, 2) }}
        </template>
        <template #preferred="{ row }">
          <el-tag :type="row.preferred === 1 ? 'warning' : 'info'" size="small">
            {{ row.preferred === 1 ? '优选' : '普通' }}
          </el-tag>
        </template>
        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </ProTable>
    </div>
  </div>

  <SaveDialog :visible="visible" :title="model === 'add' ? '新增物料供应商' : '修改物料供应商'" :mode="model"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))" @cancel="handleCancel"
    @submit="handleSubmit" />
  <DetailDialog :visible="detailVisible"
    :row="tableData?.records?.find(item => String(item.id) === String(selectedRowId))"
    @cancel="detailVisible = false" />
</template>

<style scoped>
.material-supplier-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.material-supplier-container .selector {
  width: 100%;
  background: #ffffff;
}

.material-supplier-container .toolbar {
  width: 100%;
  background: #ffffff;
}

.material-supplier-container .table {
  width: 100%;
  flex: 1;
  min-height: 0;
}
</style>
