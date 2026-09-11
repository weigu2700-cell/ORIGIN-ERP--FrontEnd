<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'
import Selector from '@/views/purchase/purchase_in_stock/components/selector.vue'
import ProToolbar from '@/components/ProToolbar.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import { reactive, ref, onMounted } from 'vue'
import type { PurchaseInStock, PurchaseInStockQuery } from '@/types/purchase/purchaseInStock'
import type { PageResult } from '@/types/common'
import { getPagePurchaseInStock } from '@/api/purchase/purchaseInStock'

const selectedId = ref<string>()
const tableRef = ref<Element>()


const tableData = ref<PageResult<PurchaseInStock>>({
  records: [],
  total: 0,
  size: 0,
  current: 0,
  pages: 0,
})

const queryData = reactive<PurchaseInStockQuery>({
  pageNum: 1,
  pageSize: 10,
  purchaseInStockNo: '',
  purchaseOrderNo: '',
  materialId: '',
  supplierId: '',
  warehouseId: '',
  storageLocation: '',
  operator: '',
  inType: '',
  productionDate: '',
  deliveryDate: ''
})

const columns = ref<ProColumn<PurchaseInStock>[]>([
  { label: '入库单号', prop: 'purchaseInStockNo', width: 160 },
  { label: '采购订单号', prop: 'purchaseOrderNo', width: 160 },
  { label: '供应商名称', prop: 'supplierName', minWidth: 140 },
  { label: '供应商编码', prop: 'supplierCode', width: 120 },
  { label: '物料名称', prop: 'materialName', minWidth: 140 },
  { label: '物料编码', prop: 'materialCode', width: 120 },
  { label: '仓库名称', prop: 'warehouseName', width: 120 },
  { label: '仓库编码', prop: 'warehouseCode', width: 120 },
  { label: '储位', prop: 'storageLocation', width: 100 },
  { label: '入库类型', prop: 'inType', width: 100 },
  { label: '入库数量', prop: 'inQuantity', width: 100 },
  { label: '单价', prop: 'unitPrice', width: 100 },
  { label: '总金额', prop: 'totalAmount', width: 120 },
  { label: '生产日期', prop: 'productionDate', width: 120 },
  { label: '到货日期', prop: 'deliveryDate', width: 120 },
  { label: '有效期至', prop: 'expiryDate', width: 120 },
  { label: '备注', prop: 'remark', minWidth: 160 },
  { label: '创建时间', prop: 'createTime', width: 160 },
  { label: '更新时间', prop: 'updateTime', width: 160 },
])

const loadData = async () => {
  const res = await getPagePurchaseInStock(queryData)
  tableData.value = {
    records: res.records,
    total: res.total,
    size: res.size,
    current: res.current,
    pages: res.pages ?? Math.ceil(res.total / res.size),
  }
}

const handleSelectionChange = (val: PurchaseInStock[]) => {
  selectedId.value = val[0]?.id ?? ''
}

const handleRowDblclick = (row: PurchaseInStock) => {
  selectedId.value = row.id
}

const handleSearch = (params: PurchaseInStockQuery) => {
  Object.assign(queryData, params)
  loadData()
}

const handleReset = () => {
  Object.assign(queryData, {
    pageNum: 1,
    pageSize: 10,
    purchaseInStockNo: '',
    purchaseOrderNo: '',
    materialId: '',
    supplierId: '',
    warehouseId: '',
    storageLocation: '',
    operator: '',
    inType: '',
    productionDate: '',
    deliveryDate: ''
  })
  loadData()
}



onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="purchase-in-stock-container">
    <PageHeader title="采购入库" description="登记采购到货与仓库入库信息">
      <template #search>
        <Selector class="selector" :query-data="queryData" @search="handleSearch" @reset="handleReset" />
      </template>
      <template #toolbar>
        <ProToolbar />
      </template>
    </PageHeader>
    <div class="table-panel">
      <ProTable ref="tableRef" :data="tableData?.records ?? []" :columns="columns" :total="tableData?.total ?? 0"
        :page="queryData.pageNum" :page-size="queryData.pageSize"
        @update:page="(p: number) => { queryData.pageNum = p; loadData() }"
        @update:pageSize="(s: number) => { queryData.pageSize = s; queryData.pageNum = 1; loadData() }"
        @selectionChange="handleSelectionChange" @rowDblclick="handleRowDblclick">

      </ProTable>
    </div>
  </div>
</template>

<style scoped>
.purchase-in-stock-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selector {
  width: 100%;
}

.table-panel {
  flex: 1;
  border: 1px solid var(--border-color);
  background: var(--panel-background);
  overflow: hidden;
}
</style>