<script setup lang="ts" generic="T extends object">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ProPagination from "@/components/ProPagination.vue";

export interface ProColumn<T extends object> {
  label: string
  prop: keyof T | string
  width?: number
  minWidth?: number
  sortable?: boolean
  fixed?: string
  align?: 'left' | 'center' | 'right'
  slot?: string
}

const props = withDefaults(defineProps<{
  data: T[]
  columns: ProColumn<T>[]
  total: number
  page: number
  pageSize: number
  pageSizes?: number[]
  showSelection?: boolean
}>(), {
  pageSizes: () => [10, 20, 50, 100],
  showSelection: true,
})

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'selectionChange', rows: T[]): void
  (e: 'rowDblclick', row: T): void
}>()

const handleSelectionChange = (rows: T[]) => emit('selectionChange', rows)

// 暴露给父组件：清空表格勾选状态（与外部 selectedRowId 状态保持同步）
const tableRef = ref<{ clearSelection: () => void }>()
defineExpose({
  clearSelection: () => tableRef.value?.clearSelection(),
})

// 把最后一列转为弹性列（min-width），吃掉剩余空间使表格撑满
const tableColumns = computed(() => {
  const cols = props.columns.map((c) => ({ ...c }))
  if (cols.length > 0) {
    const last = cols[cols.length - 1]!
    // 如果最后一列没有 minWidth，则将其 width 转为 minWidth
    if (last.minWidth == null) {
      last.minWidth = last.width ?? 100
      last.width = undefined
    }
  }
  return cols
})

// el-table 的 height 只接受明确的数字/px 值，字符串百分比会失效导致内容把分页器挤出
// 用 ResizeObserver 动态测量容器高度，减去分页器(46px)与间距(8px)后传给表格
const containerRef = ref<HTMLElement>()
const tableHeight = ref(100)

let resizeObserver: ResizeObserver | null = null

const updateTableHeight = () => {
  const el = containerRef.value
  if (!el) return
  tableHeight.value = Math.max(el.clientHeight - 54, 100)
}

onMounted(() => {
  updateTableHeight()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateTableHeight)
    if (containerRef.value) resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div ref="containerRef" class="pro-table-container">
    <el-table ref="tableRef" :data="props.data" :max-height="tableHeight" style="width: 100%" class="pro-table round"
      @selection-change="handleSelectionChange" @row-dblclick="(row: T) => emit('rowDblclick', row)">
      <el-table-column v-if="props.showSelection" type="selection" width="55" />
      <el-table-column v-for="column in tableColumns" :key="column.prop" :prop="column.prop" :label="column.label"
        :width="column.width" :min-width="column.minWidth" :sortable="column.sortable" :fixed="column.fixed"
        :align="column.align">
        <template v-if="column.slot && $slots[column.slot]" #default="{ row }">
          <slot :name="column.slot" :row="row" />
        </template>
      </el-table-column>
    </el-table>
    <ProPagination :total="props.total" :page="props.page" :page-size="props.pageSize" :page-sizes="props.pageSizes"
      @update:page="(p: number) => emit('update:page', p)"
      @update:pageSize="(s: number) => emit('update:pageSize', s)" />
  </div>
</template>

<style scoped>
.pro-table-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .pro-table {
    flex: 1;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-panel);
  }
}
</style>