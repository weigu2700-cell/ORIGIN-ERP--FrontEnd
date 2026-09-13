<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowDown,
  Bell,
  Check,
  FullScreen,
  Menu as MenuIcon,
  Moon,
  Refresh,
  Search,
  Setting,
  Sunny,
} from '@element-plus/icons-vue'
import { ClickOutside as vClickOutside, ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.ts'
import useAppStore, { type ColorScheme } from '@/stores/app.ts'
import Breadcrumb from '@/layout/components/breadcrumb.vue'
import { usePermissionStore } from '@/stores/permission'
import type { MenuItem, MenuSearchItem } from '@/types/system/menu'
import { isClassIcon } from '@/utils/icon'

defineOptions({ name: 'AppHeader' })

const userStore = useUserStore()
const appStore = useAppStore()
const permissionStore = usePermissionStore()
const router = useRouter()

const userInfo = computed(() => userStore.userInfo)
const displayName = computed(() => userInfo.value.realName?.trim() || '用户')
const settingsVisible = ref(false)
const searchKey = ref('')
const searchVisible = ref(false)
const colorOptions: { key: ColorScheme; label: string; color: string }[] = [
  { key: 'office', label: 'Office 蓝', color: '#0078d4' },
  { key: 'blue', label: '湖水蓝', color: '#1a73e8' },
  { key: 'teal', label: '商务青', color: '#0f766e' },
  { key: 'violet', label: '雅致紫', color: '#6750a4' },
  { key: 'orange', label: '活力橙', color: '#c2410c' },
]

const flattenMenus = (menus: MenuItem[], parentTitle?: string): MenuSearchItem[] =>
  menus.flatMap((menu) => {
    const children = menu.children?.length ? flattenMenus(menu.children, menu.title) : []
    return children.length > 0
      ? children
      : [{ id: menu.id, title: menu.title, path: menu.path, icon: menu.icon, parentTitle }]
  })

const searchResults = computed(() => {
  const keyword = searchKey.value.trim().toLowerCase()
  if (!keyword) return []
  return flattenMenus(permissionStore.menuList)
    .filter((menu) => `${menu.title} ${menu.parentTitle ?? ''}`.toLowerCase().includes(keyword))
    .slice(0, 8)
})

const handleMenuSelect = (menu: MenuSearchItem) => {
  searchVisible.value = false
  searchKey.value = ''
  router.push(menu.path)
}

const closeSearch = () => {
  searchVisible.value = false
}

const handleRefresh = () => {
  window.location.reload()
}

const handleFullScreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

const handleUserMenuCommand = (command: 'profile' | 'clear-cache' | 'logout') => {
  if (command === 'profile') {
    router.push({ name: 'profile' })
    return
  }
  if (command === 'clear-cache') {
    window.sessionStorage.clear()
    ElMessage.success('页面缓存已清除')
    return
  }
  userStore.logout()
}
</script>

<template>
  <div class="header-container">
    <div class="left">
      <Breadcrumb />
    </div>
    <div class="right">
      <div v-click-outside="closeSearch" class="header-search">
        <el-popover
          v-model:visible="searchVisible"
          placement="bottom-end"
          :width="320"
          trigger="manual"
          :teleported="false"
        >
          <template #reference>
            <el-input
              v-model="searchKey"
              placeholder="搜索已授权菜单"
              clearable
              @focus="searchVisible = true"
              @click="searchVisible = true"
            >
              <template #suffix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </template>
          <div class="menu-search-results">
            <button
              v-for="item in searchResults"
              :key="item.id"
              type="button"
              class="menu-search-item"
              @click="handleMenuSelect(item)"
            >
              <span class="menu-search-title">
                <el-icon v-if="item.icon && !isClassIcon(item.icon)" class="menu-search-icon">
                  <component :is="item.icon" />
                </el-icon>
                <i v-else-if="item.icon" :class="['menu-search-icon', item.icon]" />
                <el-icon v-else class="menu-search-icon"><MenuIcon /></el-icon>
                <span>{{ item.title }}</span>
              </span>
              <span v-if="item.parentTitle" class="menu-search-parent">{{ item.parentTitle }}</span>
            </button>
            <div v-if="!searchKey.trim()" class="menu-search-empty">输入菜单名称开始搜索</div>
            <div v-else-if="searchResults.length === 0" class="menu-search-empty">未找到已授权菜单</div>
          </div>
        </el-popover>
      </div>
      <el-tooltip :content="appStore.themeMode === 'light' ? '切换深色' : '切换浅色'" placement="bottom">
        <el-button
          class="header-icon-button theme-toggle"
          text
          circle
          aria-label="切换主题"
          @click="appStore.toggleTheme"
        >
          <el-icon>
            <Moon v-if="appStore.themeMode === 'light'" />
            <Sunny v-else />
          </el-icon>
        </el-button>
      </el-tooltip>
      <div class="header-actions">
        <el-tooltip content="通知" placement="bottom">
          <el-button class="header-icon-button" text circle aria-label="通知">
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="刷新页面" placement="bottom">
          <el-button class="header-icon-button" text circle aria-label="刷新页面" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="全屏" placement="bottom">
          <el-button class="header-icon-button" text circle aria-label="全屏" @click="handleFullScreen">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="外观设置" placement="bottom">
          <el-button class="header-icon-button" text circle aria-label="外观设置" @click="settingsVisible = true">
            <el-icon><Setting /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
      <el-dropdown @command="handleUserMenuCommand">
        <span class="user-menu">
          <el-avatar :size="32" class="user-avatar">{{ displayName.slice(0, 1) }}</el-avatar>
          <span class="name">{{ displayName }}</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人中心</el-dropdown-item>
            <el-dropdown-item command="clear-cache">清除缓存</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
  <el-drawer v-model="settingsVisible" title="外观设置" size="320px">
    <div class="theme-settings">
      <section class="settings-section">
        <div class="settings-label">主题模式</div>
        <el-radio-group v-model="appStore.themeMode" class="mode-switch">
          <el-radio-button label="light">浅色</el-radio-button>
          <el-radio-button label="dark">深色</el-radio-button>
        </el-radio-group>
      </section>
      <section class="settings-section">
        <div class="settings-label">品牌配色</div>
        <div class="scheme-grid">
          <button
            v-for="option in colorOptions"
            :key="option.key"
            class="scheme-option"
            :class="{ 'is-active': appStore.colorScheme === option.key }"
            type="button"
            @click="appStore.setColorScheme(option.key)"
          >
            <span class="scheme-swatch" :style="{ backgroundColor: option.color }">
              <el-icon v-if="appStore.colorScheme === option.key"><Check /></el-icon>
            </span>
            <span>{{ option.label }}</span>
          </button>
        </div>
      </section>
      <p class="settings-note">配色会自动保存到当前浏览器，下次打开时继续使用。</p>
    </div>
  </el-drawer>
</template>

<style scoped>
.header-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .right {
    display: flex;
    align-items: center;
    gap: 14px;

    .header-search {
      width: 220px;
    }

    .theme-toggle {
      margin-left: -6px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      padding-right: 4px;
      border-right: 1px solid var(--border-color);
    }

    .header-icon-button {
      width: 34px;
      height: 34px;
      color: var(--text-secondary);
      font-size: 17px;
    }

    .header-icon-button:hover {
      color: var(--el-color-primary);
      background: var(--color-primary-soft);
    }

    .user-menu {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
      cursor: pointer;
      outline: none;
    }

    .user-avatar {
      background: var(--color-primary-soft);
      color: var(--el-color-primary-dark-2);
      font-weight: 600;
    }

    .name {
      max-width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.theme-settings {
  color: var(--text-primary);
}

.menu-search-results {
  min-height: 40px;
  max-height: 360px;
  overflow-y: auto;
}

.menu-search-item {
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.menu-search-item:hover,
.menu-search-item:focus-visible {
  background: var(--color-primary-soft);
  outline: none;
}
.menu-search-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-search-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-search-icon {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-size: 16px;
}
.menu-search-parent {
  flex: 0 0 auto;
  color: var(--text-secondary);
  font-size: 12px;
}
.menu-search-empty {
  padding: 18px 10px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

.settings-section {
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.settings-label {
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.mode-switch {
  width: 100%;
  display: flex;
}

.mode-switch :deep(.el-radio-button) {
  flex: 1;
}

.mode-switch :deep(.el-radio-button__inner) {
  width: 100%;
}

.scheme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.scheme-option {
  min-height: 72px;
  padding: 12px 10px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-background);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.scheme-option:hover,
.scheme-option.is-active {
  border-color: var(--el-color-primary);
  background: var(--color-primary-soft);
  color: var(--el-color-primary);
}

.scheme-swatch {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
}

.settings-note {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.7;
}
</style>
