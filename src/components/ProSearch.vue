<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
}>()
</script>

<template>
  <div class="pro-search round">
    <div class="pro-search__form">
      <slot />
    </div>
    <div class="pro-search__actions">
      <el-button type="primary" @click="emit('search')">
        <template #icon>
          <Search />
        </template>
        查询
      </el-button>
      <el-button type="normal" @click="emit('reset')">
        <template #icon>
          <Refresh />
        </template>
        重置
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.pro-search {
  height: 100%;
  width: 100%;
  min-height: 56px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--panel-background);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-panel);
  box-sizing: border-box;

  .pro-search__form {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pro-search__actions {
    flex-shrink: 0;
    display: flex;
    gap: 5px;
  }
}
</style>
