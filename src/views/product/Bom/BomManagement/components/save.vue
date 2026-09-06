<script setup lang="ts">
import BaseSaveDialog from '@/components/BaseSaveDialog.vue';
import MaterialRefer from '@/refer/MaterialRefer.vue';
import type { BomVo, CreateBomRequest } from '@/types/product/Bom';
import { reactive, watch } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  visible: boolean;
  title: string;
  model: 'add' | 'edit';
  row?: BomVo | null;
}>();

const emit = defineEmits<{
  (e: 'submit', data: CreateBomRequest): void;
  (e: 'cancel'): void;
}>();

const submitData = reactive<CreateBomRequest>({
  materialId: '',
  bomItems: []
});

watch([() => props.visible, () => props.row], ([newVisible, newRow]) => {
  if (newVisible && props.model === 'edit' && newRow) {
    submitData.materialId = newRow.materialId;
    submitData.bomItems = newRow.bomItems.map((item, index) => ({
      lineNo: item.lineNo || (index + 1) * 10,
      componentMaterialId: item.componentMaterialId,
      componentMaterialName: item.componentMaterialName,
      quantity: item.quantity,
      lossRate: item.lossRate,
      remark: item.remark || ''
    }));
  } else if (newVisible && props.model === 'add') {
    submitData.materialId = '';
    submitData.bomItems = [];
  }
});

const addItemColumns = () => {
  submitData.bomItems.push({
    lineNo: submitData.bomItems.length + 1,
    componentMaterialId: '',
    componentMaterialName: '',
    quantity: 1,
    lossRate: 0,
    remark: ''
  });
};

const removeItem = (index: number) => {
  submitData.bomItems.splice(index, 1);
  submitData.bomItems.forEach((item, idx) => {
    item.lineNo = idx + 1;
  });
};

const handleSubmit = () => {
  if (!submitData.materialId) {
    ElMessage.warning('请选择物料');
    return;
  }
  if (submitData.bomItems.length === 0) {
    ElMessage.warning('请至少添加一条明细');
    return;
  }
  emit('submit', submitData);
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <BaseSaveDialog width="800" :visible="props.visible" :title="props.title" @submit="handleSubmit"
    @cancel="handleCancel">
    <el-form :model="submitData">
      <el-row>
        <el-col :span="24">
          <el-form-item label="物料">
            <MaterialRefer v-model="submitData.materialId" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-button type="primary" size="small" @click="addItemColumns">添加明细</el-button>

      <el-table :data="submitData.bomItems" border style="margin-top: 10px">
        <el-table-column label="行号" width="60" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="组件物料" min-width="140">
          <template #default="{ row }">
            <MaterialRefer v-model="row.componentMaterialId" :display-text="row.componentMaterialName" />
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.quantity" :min="1" :precision="0" size="small" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="损耗率(%)" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.lossRate" :min="0" :max="100" :precision="2" size="small"
              style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="140">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="请输入备注" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ $index }">
            <el-button type="text" size="small" @click="removeItem($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
  </BaseSaveDialog>
</template>

<style scoped></style>