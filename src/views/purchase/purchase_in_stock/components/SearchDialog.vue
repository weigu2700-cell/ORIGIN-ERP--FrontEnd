<script setup lang="ts">
import { reactive, watch } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import SupplierRefer from '@/refer/SupplierRefer.vue'
import WarehouseRefer from '@/refer/WarehouseRefer.vue'
import type { PurchaseInStockQuery } from '@/types/purchase/purchaseInStock'
import { PurchaseInStockStatus, PurchaseInStockType } from '@/constants/enumCode'

const props = defineProps<{
  visible: boolean
  queryData: PurchaseInStockQuery
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'search', params: PurchaseInStockQuery): void
  (e: 'reset'): void
}>()

const localQuery = reactive<PurchaseInStockQuery>({ ...props.queryData })

watch(
  () => props.visible,
  (val) => {
    if (val) {
      Object.assign(localQuery, props.queryData)
    }
  },
)

const handleSearch = () => {
  emit('search', { ...localQuery })
  emit('update:visible', false)
}

const handleReset = () => {
  Object.assign(localQuery, {
    pageNum: props.queryData.pageNum,
    pageSize: props.queryData.pageSize,
    purchaseInStockNo: '',
    purchaseOrderNo: '',
    materialId: '',
    supplierId: '',
    warehouseId: '',
    storageLocation: '',
    operator: '',
    inType: '',
    productionDate: '',
    deliveryDate: '',
    status: '',
  })
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="高级查询"
    width="900px"
    :close-on-click-modal="false"
    align-center
    @close="handleClose"
  >
    <div class="search-dialog-form">
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">采购订单号</label>
            <el-input v-model="localQuery.purchaseOrderNo" placeholder="请输入采购订单号" clearable />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">入库单号</label>
            <el-input v-model="localQuery.purchaseInStockNo" placeholder="请输入入库单号" clearable />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">物料</label>
            <MaterialRefer v-model="localQuery.materialId" placeholder="请选择物料" />
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">供应商</label>
            <SupplierRefer v-model="localQuery.supplierId" placeholder="请选择供应商" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">仓库</label>
            <WarehouseRefer v-model="localQuery.warehouseId" placeholder="请选择仓库" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">储位</label>
            <el-input v-model="localQuery.storageLocation" placeholder="请输入储位" clearable />
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">操作人</label>
            <el-input v-model="localQuery.operator" placeholder="请输入操作人" clearable />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">入库类型</label>
            <el-select v-model="localQuery.inType" placeholder="请选择入库类型" clearable style="width: 100%">
              <el-option label="采购入库" :value="PurchaseInStockType.PURCHASE_NORMAL" />
              <el-option label="采购退货" :value="PurchaseInStockType.PURCHASE_RETURN" />
              <el-option label="赠品入库" :value="PurchaseInStockType.PURCHASE_GIFT" />
            </el-select>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">状态</label>
            <el-select v-model="localQuery.status" placeholder="请选择状态" clearable style="width: 100%">
              <el-option label="草稿" :value="PurchaseInStockStatus.DRAFT" />
              <el-option label="已审核" :value="PurchaseInStockStatus.APPROVED" />
              <el-option label="已上架" :value="PurchaseInStockStatus.UPLOADED" />
            </el-select>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">生产日期</label>
            <el-date-picker
              v-model="localQuery.productionDate"
              type="date"
              placeholder="请选择生产日期"
              clearable
              style="width: 100%"
            />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="form-item">
            <label class="form-label">到货日期</label>
            <el-date-picker
              v-model="localQuery.deliveryDate"
              type="date"
              placeholder="请选择到货日期"
              clearable
              style="width: 100%"
            />
          </div>
        </el-col>
      </el-row>
    </div>
    <template #footer>
      <el-button @click="handleReset">
        <template #icon>
          <el-icon>
            <Refresh />
          </el-icon>
        </template>
        重置
      </el-button>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSearch">
        <template #icon>
          <el-icon>
            <Search />
          </el-icon>
        </template>
        查询
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.search-dialog-form {
  padding: 4px 0;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.form-item :deep(.el-input),
.form-item :deep(.el-select) {
  width: 100%;
}
</style>
