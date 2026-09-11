<script setup lang="ts">
import type { BomVo } from '@/types/product/Bom'
import { formatDecimal } from '@/composables/useFormat'

const props = defineProps<{
  visible: boolean
  row?: BomVo | null
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
}>()

const handleClose = () => emit('cancel')
</script>

<template>
  <el-dialog :model-value="props.visible" title="BOM详情" width="1000px" align-center @close="handleClose">
    <el-descriptions v-if="props.row" :column="2" border>
      <el-descriptions-item label="BOM编号">{{ props.row.bomNo }}</el-descriptions-item>
      <el-descriptions-item label="物料编码">{{ props.row.materialCode || '-' }}</el-descriptions-item>
      <el-descriptions-item label="物料名称">{{ props.row.materialName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        {{ props.row.status === 'ENABLE' ? '启用' : props.row.status === 'DISABLE' ? '停用' : props.row.status }}
      </el-descriptions-item>
      <el-descriptions-item label="版本">{{ props.row.version }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ props.row.createTime }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ props.row.updateTime || '-' }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ props.row.remark || '-' }}</el-descriptions-item>
    </el-descriptions>

    <el-divider>明细</el-divider>

    <el-table :data="props.row?.bomItems ?? []" border>
      <el-table-column label="行号" prop="lineNo" width="80" align="center" />
      <el-table-column label="组成物料编码" prop="componentMaterialCode" width="200" />
      <el-table-column label="组成物料名称" prop="componentMaterialName" min-width="180" />
      <el-table-column label="数量" prop="quantity" width="100" align="right">
        <template #default="{ row }">{{ formatDecimal.default(row.quantity, 2) }}</template>
      </el-table-column>
      <el-table-column label="损耗率(%)" prop="lossRate" width="100" align="right">
        <template #default="{ row }">{{ formatDecimal.default(row.lossRate, 2) }}</template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="120" />
    </el-table>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped></style>
