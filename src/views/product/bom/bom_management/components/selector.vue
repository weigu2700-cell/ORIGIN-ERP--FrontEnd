<script setup lang="ts">
import ProSearch from '@/components/ProSearch.vue'
import MaterialRefer from '@/refer/MaterialRefer.vue'
import type { BomQuery } from '@/types/product/Bom'
import { reactive, ref, watch } from 'vue'
import { BomStatus } from '@/constants/enumCode'

const options = ref([
  { label: '草稿', value: BomStatus.DRAFT },
  { label: '启用', value: BomStatus.ACTIVE },
  { label: '停用', value: BomStatus.INACTIVE },
])

const props = defineProps<{
  queryData: BomQuery
}>()

const emit = defineEmits<{
  (e: 'query', params: BomQuery): void
  (e: 'reset'): void
}>()

const localQuery = reactive<BomQuery>({ ...props.queryData })

watch(
  () => props.queryData,
  (queryData) => Object.assign(localQuery, queryData),
  { deep: true },
)

const handleQuery = () => {
  emit('query', { ...localQuery })
}

const handleReset = () => {
  emit('reset')
}
</script>

<template>
  <ProSearch @search="handleQuery" @reset="handleReset">
    <div class="search-container">
      <el-input v-model="localQuery.bomNo" placeholder="请输入BOM编号"></el-input>
      <MaterialRefer v-model="localQuery.materialId" placeholder="请选择物料" />
      <el-select v-model="localQuery.status" placeholder="请选择状态" clearable>
        <el-option
          v-for="statusValue in options"
          :key="statusValue.value"
          :label="statusValue.label"
          :value="statusValue.value"
        ></el-option>
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
