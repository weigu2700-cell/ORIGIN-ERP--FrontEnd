<script setup lang="ts">
import type { ProColumn } from '@/components/ProTable.vue';
import ProTable from '@/components/ProTable.vue';
import type { CreateBomItemRequest, CreateBomRequest, GetPageBomRequest, GetPageBomResponse } from '@/types/product/Bom';
import { onMounted, ref } from 'vue'
import { createBom, getDetailBom, getPageBom } from '../../../../api/product/Bom.ts';
import Selector from './components/selector.vue';
import ProToolbar from '@/components/ProToolbar.vue';
import detailDialog from './components/detail.vue';
import saveDialog from './components/save.vue'
import type { BomVo } from '@/types/product/Bom';
import PageHeader from '@/components/PageHeader.vue'

const SelectionId = ref<string>()
const tableRef = ref<Element>()
const detailVisible = ref<boolean>(false)
const saveVisible = ref<boolean>(false)
const detailRow = ref<BomVo | null>(null)
const model = ref<'add' | 'edit'>('add')

const queryData = ref<GetPageBomRequest>({
  pageNum: 1,
  pageSize: 10,
  bomNo: null,
  materialId: null,
  status: null
})

const tableData = ref<GetPageBomResponse>({
  records: [],
  total: 0,
  size: 0,
  current: 0,
  optimizeCountSql: 'string',
  searchCount: ''
})

const tableDataDetail = ref<BomVo>({
  id: '',
  bomNo: '',
  materialId: '',
  materialCode: '',
  materialName: '',
  status: '',
  version: 0,
  remark: '',
  createTime: '',
  updateTime: '',
  bomItems: []
})

const columns = ref<ProColumn[]>([
  { label: '状态', prop: 'status', width: 100 },
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

const handleSelectionChange = (selection: any[]) => {
  SelectionId.value = selection[0]?.id
}

const handleRowDblclick = (row: BomVo) => {
  detailRow.value = row
  detailVisible.value = true
}

const handleSubmit = async (submitData: CreateBomRequest) => {
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
    status: null
  }
  loadData()
}

const handleAdd = () => {
  model.value = 'add'
  saveVisible.value = true
}

const saveRow = ref<BomVo | null>(null)

const handleEdit = async () => {
  if (!SelectionId.value) {
    console.warn('请先选择一条记录进行编辑')
    return
  }
  try {
    const res = await getDetailBom(SelectionId.value)
    saveRow.value = res
    model.value = 'edit'
    saveVisible.value = true
  } catch (error) {
    console.error('获取BOM详情失败', error)
  }
}

const handleDelete = () => {

}

const handleExport = () => {

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
      <template #search><Selector :queryData="queryData" @query="handleQuery" @reset="handleReset" /></template>
      <template #toolbar>
        <ProToolbar @add="handleAdd" @edit="handleEdit" @delete="handleDelete" @export="handleExport"
          @refresh="handleRefresh" />
      </template>
    </PageHeader>
    <section class="table">
      <ProTable ref="tableRef" :data="tableData?.records ?? []" :columns="columns"
        :total="Number(tableData?.total ?? 0)" :page="Number(queryData.pageNum)" :page-size="Number(queryData.pageSize)"
        @update:page="(p: number) => { queryData.pageNum = p; loadData() }"
        @update:pageSize="(s: number) => { queryData.pageSize = s; queryData.pageNum = 1; loadData() }"
        @selectionChange="handleSelectionChange" @rowDblclick="handleRowDblclick">
      </ProTable>
    </section>
  </div>
  <detailDialog :visible="detailVisible" :row="detailRow" @cancel="handleCancel" />
  <saveDialog :visible="saveVisible" :title="model === 'add' ? '新增' : '修改'" :model="model" :row="saveRow"
    @submit="handleSubmit" @cancel="handleCancel" />
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
