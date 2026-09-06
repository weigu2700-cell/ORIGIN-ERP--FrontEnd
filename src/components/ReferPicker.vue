<script setup lang="ts">
import { reactive, ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { OfficeBuilding, CircleClose } from '@element-plus/icons-vue';

export interface ReferColumn {
  prop: string
  label: string
  width?: number
  minWidth?: number
}

interface ReferRow {
  [key: string]: any
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null | undefined
  displayText?: string
  title?: string
  placeholder?: string
  columns: ReferColumn[]
  fetcher: (params: Record<string, any>) => Promise<{ records: ReferRow[]; total: number }>
  valueKey?: string
  labelKey?: string
  searchField?: string
  searchPlaceholder?: string
  extraParams?: Record<string, any>
}>(), {
  title: '参照',
  placeholder: '请选择',
  valueKey: 'id',
  labelKey: 'name',
  searchField: 'name',
  searchPlaceholder: '请输入名称关键字',
  extraParams: () => ({}),
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
  (e: 'change', row: ReferRow | null): void
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const list = ref<ReferRow[]>([])
const total = ref(0)
// 输入框只读显示选中项的 label 文本
const inputDisplayText = ref('')

const query = reactive<Record<string, any>>({
  pageNum: 1,
  pageSize: 10,
})

// 动态搜索字段
const searchKey = computed(() => props.searchField)
const searchValue = computed({
  get: () => query[searchKey.value] ?? '',
  set: (val: string) => { query[searchKey.value] = val }
})

// 从行对象中取值，valueKey 取不到时兜底常见 id 字段名
// 注意：code 不作为兜底，避免工厂场景把业务编码（FT...）当成主键 id 传给后端导致 404
const getRowValue = (row: ReferRow): string | number | null => {
  const v = row[props.valueKey]
  if (v != null) return v
  for (const key of ['id', 'factoryId', 'deptId', 'roleId', 'menuId', 'userId']) {
    if (row[key] != null) return row[key]
  }
  return null
}

const openDialog = () => {
  dialogVisible.value = true
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await props.fetcher({ ...query, ...props.extraParams })
    list.value = res?.records ?? []
    total.value = res?.total ?? 0
    // 若已有选中值，回填显示文本
    if (props.modelValue != null && !inputDisplayText.value) {
      const hit = list.value.find(r => String(getRowValue(r)) === String(props.modelValue))
      if (hit) inputDisplayText.value = hit[props.labelKey]
    }
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const search = () => {
  query.pageNum = 1
  loadData()
}

const handlePageChange = (page: number) => {
  query.pageNum = page
  loadData()
}

const handleSizeChange = (size: number) => {
  query.pageSize = size
  query.pageNum = 1
  loadData()
}

const selectRow = (row: ReferRow) => {
  const value = getRowValue(row)
  inputDisplayText.value = row[props.labelKey] ?? ''
  emit('update:modelValue', value)
  emit('change', row)
  dialogVisible.value = false
}

const clearValue = () => {
  inputDisplayText.value = ''
  emit('update:modelValue', null)
  emit('change', null)
}

// 外部传入 displayText 时直接显示
watch(() => props.displayText, (val) => {
  if (val) inputDisplayText.value = val
}, { immediate: true })

// 外部清空 modelValue 时同步显示
watch(() => props.modelValue, (val) => {
  if (val == null) inputDisplayText.value = ''
})

// 对话框关闭时重置分页
watch(dialogVisible, (val) => {
  if (!val) {
    query.pageNum = 1
  }
})
</script>

<template>
  <el-input :model-value="inputDisplayText" :placeholder="placeholder" readonly @click="openDialog">
    <template #suffix>
      <el-icon v-if="inputDisplayText" class="refer-suffix-icon" @click.stop="clearValue">
        <CircleClose />
      </el-icon>
      <el-icon class="refer-suffix-icon" @click.stop="openDialog">
        <OfficeBuilding />
      </el-icon>
    </template>
  </el-input>

  <el-dialog v-model="dialogVisible" :title="title" width="640px" append-to-body>
    <div class="refer-search">
      <el-input v-model="searchValue" :placeholder="searchPlaceholder" clearable @keyup.enter="search"
        @clear="search" />
      <el-button type="primary" @click="search">查询</el-button>
    </div>
    <el-table :data="list" v-loading="loading" height="360" highlight-current-row @row-click="selectRow">
      <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width"
        :min-width="col.minWidth" />
    </el-table>
    <el-pagination v-if="total > 0" class="refer-pagination" :current-page="query.pageNum" :page-size="query.pageSize"
      :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
      @current-change="handlePageChange" @size-change="handleSizeChange" />
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="clearValue">清空</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.refer-search {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.refer-suffix-icon {
  cursor: pointer;
}

.refer-pagination {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>