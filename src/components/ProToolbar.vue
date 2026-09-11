<script setup lang="ts">
import { Delete, Download, Edit, Plus, Refresh, Switch, Upload } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    showAdd?: boolean
    showEdit?: boolean
    showDelete?: boolean
    deleteLabel?: string
    showStatus?: boolean
    statusLabel?: string
    showImport?: boolean
    showExport?: boolean
    showRefresh?: boolean
  }>(),
  {
    showAdd: true,
    showEdit: true,
    showDelete: true,
    deleteLabel: '删除',
    showStatus: false,
    statusLabel: '切换状态',
    showImport: false,
    showExport: true,
    showRefresh: true,
  },
)

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'status'): void
  (e: 'import'): void
  (e: 'export'): void
  (e: 'refresh'): void
}>()
</script>

<template>
  <div class="pro-toolbar-container">
    <div class="pro-toolbar-main">
      <el-button v-if="props.showAdd" type="primary" class="pro-toolbar-btn pro-toolbar-btn--add" @click="emit('add')">
        <template #icon><Plus /></template>
        新增
      </el-button>
    </div>
    <span
      v-if="
        props.showAdd &&
        (props.showEdit || props.showDelete || props.showStatus || props.showExport || props.showRefresh)
      "
      class="pro-toolbar-divider"
    />
    <div class="pro-toolbar-secondary">
      <el-button v-if="props.showEdit" text class="pro-toolbar-btn" @click="emit('edit')">
        <template #icon><Edit /></template>
        修改
      </el-button>
      <el-button v-if="props.showDelete" text class="pro-toolbar-btn pro-toolbar-btn--delete" @click="emit('delete')">
        <template #icon><Delete /></template>
        {{ props.deleteLabel }}
      </el-button>
      <el-button v-if="props.showStatus" text class="pro-toolbar-btn pro-toolbar-btn--status" @click="emit('status')">
        <template #icon><Switch /></template>
        {{ props.statusLabel }}
      </el-button>
      <el-button v-if="props.showImport" text class="pro-toolbar-btn" @click="emit('import')">
        <template #icon><Upload /></template>
        导入
      </el-button>
      <el-button v-if="props.showExport" text class="pro-toolbar-btn" @click="emit('export')">
        <template #icon><Download /></template>
        导出
      </el-button>
      <el-tooltip v-if="props.showRefresh" content="刷新" placement="top">
        <el-button text circle class="pro-toolbar-btn pro-toolbar-btn--icon" aria-label="刷新" @click="emit('refresh')">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
    <div class="pro-toolbar-spacer"></div>
    <slot />
  </div>
</template>

<style scoped>
.pro-toolbar-container {
  width: 100%;
  min-height: 48px;
  height: auto;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--panel-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-panel);
  box-sizing: border-box;
}

.pro-toolbar-container .pro-toolbar-btn {
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  font-weight: 500;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.pro-toolbar-container .pro-toolbar-btn:hover,
.pro-toolbar-container .pro-toolbar-btn:focus-visible {
  background: var(--button-hover);
  color: var(--text-primary);
}

.pro-toolbar-container .pro-toolbar-btn .el-icon {
  font-size: 15px;
  margin-right: 2px;
}

.pro-toolbar-main,
.pro-toolbar-secondary {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pro-toolbar-divider {
  width: 1px;
  height: 20px;
  margin: 0 2px;
  background: #e5e7eb;
}

/* 只保留一个主操作，避免工具栏出现多色竞争 */
.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--add {
  min-width: 76px;
  background: var(--el-color-primary);
  color: #fff;
  box-shadow: none;
}

.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--add:hover,
.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--add:focus {
  background: var(--el-color-primary-dark-2);
}

.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--delete {
  color: #b42318;
}

.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--delete:hover,
.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--delete:focus-visible {
  background: #fef3f2;
  color: #a11b12;
}

.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--status {
  color: var(--el-color-primary);
}

.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--status:hover,
.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--status:focus-visible {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
}

.pro-toolbar-container .pro-toolbar-btn.pro-toolbar-btn--icon {
  width: 32px;
  padding: 0;
  color: #5f6368;
}

.pro-toolbar-container .pro-toolbar-spacer {
  flex: 1;
}
</style>
