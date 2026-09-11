<script setup lang="ts">
import type { ProColumn } from '@/components/ProTable.vue'
import ProTable from '@/components/ProTable.vue'
import type { BomAdd, BomQuery } from '@/types/product/Bom'
import type { PageResult } from '@/types/common'
import { computed, onMounted, ref } from 'vue'
import { activateBom, createBom, disableBom, getPageBom } from '../../../../api/product/Bom.ts'
import Selector from './components/selector.vue'
import ProToolbar from '@/components/ProToolbar.vue'
import detailDialog from './components/detail.vue'
import saveDialog from './components/save.vue'
import type { BomVo } from '@/types/product/Bom'
import PageHeader from '@/components/PageHeader.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({ name: 'BomManagementPage' })

const SelectionId = ref<string>()
const detailVisible = ref<boolean>(false)
const saveVisible = ref<boolean>(false)
const detailRow = ref<BomVo | null>(null)
const model = ref<'add' | 'edit'>('add')
const selectedRow = computed(
  () => tableData.value.records.find((row) => String(row.id) === String(SelectionId.value)) ?? null,
)
const normalizeStatus = (status?: string) =>
  (({ 草稿: 'DRAFT', 使用: 'ACTIVE', 启用: 'ACTIVE', 停用: 'INACTIVE' }) as Record<string, string>)[status ?? ''] ??
  status
const workflow = computed(() =>
  normalizeStatus(selectedRow.value?.status) === 'ACTIVE'
    ? { label: '停用 BOM', action: disableBom }
    : selectedRow.value
      ? { label: '启用 BOM', action: activateBom }
      : null,
)
const statusMap: Record<string, { label: string; type: 'info' | 'success' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  ACTIVE: { label: '启用', type: 'success' },
  INACTIVE: { label: '停用', type: 'danger' },
}

const queryData = ref<BomQuery>({
  pageNum: 1,
  pageSize: 10,
  bomNo: null,
  materialId: null,
  status: null,
})

const tableData = ref<PageResult<BomVo>>({
  records: [],
  total: 0,
  size: 0,
  current: 0,
  pages: 0,
})

const columns = ref<ProColumn<BomVo>[]>([
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: 'BOM编号', prop: 'bomNo', width: 200 },
  { label: '物料编码', prop: 'materialCode', width: 200 },
  { label: '物料名称', prop: 'materialName', minWidth: 200 },
  { label: '备注', prop: 'remark', minWidth: 150 },
  { label: '创建时间', prop: 'createTime', width: 180 },
  { label: '更新时间', prop: 'updateTime', width: 180 },
])

const loadData = async (): Promise<void> => {
  try {
    const res = await getPageBom(queryData.value)
    tableData.value = res
  } catch (error) {
    console.error('加载BOM列表失败', error)
  }
}

const handleSelectionChange = (selection: BomVo[]) => {
  SelectionId.value = selection[0]?.id
}

const handleRowDblclick = (row: BomVo) => {
  detailRow.value = row
  detailVisible.value = true
}

const handleSubmit = async (submitData: BomAdd) => {
  if (model.value === 'add') {
    try {
      await createBom(submitData)
      console.log('新增BOM数据提交', submitData)
      saveVisible.value = false
      loadData()
    } catch (error) {
      console.error('新增BOM失败', error)
    }
  } else if (model.value === 'edit') {
    try {
      await createBom(submitData)
      console.log('修改BOM数据提交', submitData)
      saveVisible.value = false
      loadData()
    } catch (error) {
      console.error('修改BOM失败', error)
    }
  }
}

const handleCancel = () => {
  detailVisible.value = false
  detailRow.value = null
  if (saveVisible.value != false) {
    saveVisible.value = false
  }
}

const handleQuery = () => {
  queryData.value.pageNum = 1
  loadData()
}

const handleReset = () => {
  queryData.value = {
    pageNum: 1,
    pageSize: 10,
    bomNo: null,
    materialId: null,
    status: null,
  }
  loadData()
}

const handleAdd = () => {
  model.value = 'add'
  saveVisible.value = true
}

const saveRow = ref<BomVo | null>(null)

const handleStatus = async () => {
  if (!selectedRow.value || !workflow.value) return void ElMessage.warning('请选择一条 BOM')
  const action = workflow.value
  try {
    await ElMessageBox.confirm(`确定${action.label}吗？`, 'BOM 状态切换', { type: 'warning' })
    await action.action(selectedRow.value.id)
    ElMessage.success(`${action.label}成功`)
    loadData()
  } catch {
    /* 用户取消或请求失败 */
  }
}

const handleRefresh = () => {
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="container">
    <PageHeader title="BOM 管理" description="维护产品物料清单与版本状态">
      <template #search>
        <Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" />
      </template>
      <template #toolbar>
        <ProToolbar
          :show-edit="false"
          :show-delete="false"
          :show-export="false"
          :show-status="!!workflow"
          :status-label="workflow?.label"
          @add="handleAdd"
          @status="handleStatus"
          @refresh="handleRefresh"
        />
      </template>
    </PageHeader>
    <section class="table">
      <ProTable
        ref="tableRef"
        :data="tableData?.records ?? []"
        :columns="columns"
        :total="Number(tableData?.total ?? 0)"
        :page="Number(queryData.pageNum)"
        :page-size="Number(queryData.pageSize)"
        @update:page="
          (p: number) => {
            queryData.pageNum = p
            loadData()
          }
        "
        @update:pageSize="
          (s: number) => {
            queryData.pageSize = s
            queryData.pageNum = 1
            loadData()
          }
        "
        @selectionChange="handleSelectionChange"
        @rowDblclick="handleRowDblclick"
      >
        <template #status="{ row }">
          <el-tag :type="statusMap[normalizeStatus(row.status) ?? '']?.type ?? 'info'">
            {{ statusMap[normalizeStatus(row.status) ?? '']?.label ?? row.status }}
          </el-tag>
        </template>
      </ProTable>
    </section>
  </div>
  <detailDialog :visible="detailVisible" :row="detailRow" @cancel="handleCancel" />
  <saveDialog
    :visible="saveVisible"
    :title="model === 'add' ? '新增' : '修改'"
    :model="model"
    :row="saveRow"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .query {
    width: 100%;
  }

  .toolbar {
    width: 100%;
  }

  .table {
    width: 100%;
    flex: 1;
  }
}
</style>
