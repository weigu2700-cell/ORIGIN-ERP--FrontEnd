<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue';
import MaterialRefer from '@/refer/MaterialRefer.vue';
import type { GetPageBomRequest } from '@/types/product/Bom';
import { ref } from 'vue';

const options = ref([
  { label: '草稿', value: 'DRAFT' },
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' }
])

const props = defineProps<{
  queryData: GetPageBomRequest
}>()

const emit = defineEmits<{
  (e: 'query', params: GetPageBomRequest): void
  (e: 'reset'): void
}>()

const handleQuery = () => {
  emit('query', props.queryData)
}

const handleReset = () => {
  emit('reset')
}
</script>

<template>
  <ProSearch @search="handleQuery" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="props.queryData.bomNo" placeholder="请输入BOM编号"></el-input>
      <MaterialRefer v-model="props.queryData.materialId" placeholder="请选择物料" />
      <el-select v-model="props.queryData.status" placeholder="请选择状态" clearable>
        <el-option v-for="statusValue in options" :key="statusValue.value" :label="statusValue.label"
          :value="statusValue.value">
        </el-option>
      </el-select>
    </div>
  </ProSearch>
</template>

<style scoped>
.search-container {
  display: flex;
  gap: 10px;
}
</style>