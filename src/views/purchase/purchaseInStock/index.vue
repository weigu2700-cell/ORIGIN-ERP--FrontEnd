<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'
import Selector from '@/views/purchase/purchaseInStock/components/selector.vue'
import ProToolbar from '@/components/ProToolbar.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import { reactive, ref } from 'vue'
import type { PurchaseInStock, PurchaseInStockQuery } from '@/types/purchase/purchaseInStock'
import type { PageResult } from '@/types/common'
import { getPagePurchaseInStock } from '@/api/purchase/purchaseInStock'

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
  { label: '采购订单号', prop: 'purchaseOrderNo', width: 150 },
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
</script>

<template>
  <div class="purchase-in-stock-container">
    <PageHeader title="采购入库" description="登记采购到货与仓库入库信息">
      <template #search>
        <Selector />
      </template>
      <template #toolbar>
        <ProToolbar />
      </template>
    </PageHeader>
    <div class="empty-panel">
      <ProTable :data="tableData?.records || []" :columns="columns" :total="tableData?.total || 0"
        :page="queryData.pageNum" :page-size="queryData.pageSize">

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

.empty-panel {
  flex: 1;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-color);
  background: var(--panel-background);
}
</style>