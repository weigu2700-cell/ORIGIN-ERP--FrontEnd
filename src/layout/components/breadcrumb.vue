<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()

const breadcrumbList = computed(() => navigationStore.history.slice(-3))

const isCurrent = (path: string) => path === route.fullPath

const navigateTo = (path: string) => {
  if (!isCurrent(path)) router.push(path)
}
</script>

<template>
  <div class="navigation-breadcrumb">
    <span class="history-label">最近访问</span>
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="item in breadcrumbList" :key="item.path">
        <button
          class="breadcrumb-link"
          :title="item.title"
          :class="{ 'is-current': isCurrent(item.path) }"
          type="button"
          @click="navigateTo(item.path)"
        >
          {{ item.title }}
        </button>
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<style scoped>
.navigation-breadcrumb {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 0;
  overflow: hidden;
}

.navigation-breadcrumb :deep(.el-breadcrumb) {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  line-height: normal;
}
.navigation-breadcrumb :deep(.el-breadcrumb__item) {
  display: flex;
  align-items: center;
  min-width: 0;
  float: none;
}
.navigation-breadcrumb :deep(.el-breadcrumb__inner) {
  display: flex;
  min-width: 0;
  overflow: hidden;
}

/* 优先保留当前页面，较早的访问记录先收缩。 */
.navigation-breadcrumb :deep(.el-breadcrumb__item:last-child) {
  flex: 0 0 auto;
  max-width: 100%;
}
.navigation-breadcrumb :deep(.el-breadcrumb__separator) {
  flex: 0 0 auto;
  margin: 0 8px;
}
@media (max-width: 1440px) {
  .history-label {
    display: none;
  }
}
@media (max-width: 1100px) {
  .navigation-breadcrumb :deep(.el-breadcrumb__item:not(:last-child)) {
    display: none;
  }
}
.history-label {
  flex: 0 0 auto;
  color: var(--text-secondary);
  font-size: 12px;
}

.breadcrumb-link {
  display: block;
  min-width: 0;
  max-width: 128px;
  overflow: hidden;
  padding: 0;
  border: 0;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb-link:hover {
  color: var(--color-primary);
}

.breadcrumb-link.is-current {
  color: var(--text-primary);
  cursor: default;
  font-weight: 600;
}
</style>
