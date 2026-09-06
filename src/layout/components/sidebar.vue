<script setup lang="ts">
import { usePermissionStore } from "@/stores/permission.ts"
import { useRouter } from "vue-router"
import { computed } from "vue";
import SidebarItems from "./sidebarItems.vue";
import type { MenuItem } from "@/types/system/menu.ts";
import useAppStore from "@/stores/app.ts";

defineOptions({ name: 'AppSidebar' })

const props = withDefaults(defineProps<{
  menus?: MenuItem[]
  depth?: number
}>(), {
  depth: 0
})

const router = useRouter()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

const menuList = computed<MenuItem[]>(() => {
  const menus = props.menus ?? permissionStore.menuList
  // 工作台是最常用的入口，固定在一级菜单第一位；其余菜单保留后端返回顺序。
  if (props.depth !== 0) return menus
  const isWorkbench = (menu: MenuItem) => {
    const normalizedPath = menu.path.replace(/^\//, '')
    return menu.name === 'home'
      || normalizedPath === 'home'
      || menu.title === '工作台'
      || menu.title === '首页'
  }
  const workbenchIndex = menus.findIndex(isWorkbench)
  if (workbenchIndex <= 0) return menus
  const workbench = menus[workbenchIndex]
  if (!workbench) return menus
  return [workbench, ...menus.slice(0, workbenchIndex), ...menus.slice(workbenchIndex + 1)]
})

// 所有子菜单共享根菜单的折叠上下文，弹出层保留完整行布局。
const shouldCollapse = computed(() => appStore.isFold)
</script>

<template>
  <el-scrollbar class="sidebar-scrollbar">
    <el-menu class="erp-menu" :default-active="router.currentRoute.value.path" router :collapse="shouldCollapse">
      <SidebarItems :menus="menuList" :compact="shouldCollapse" />
    </el-menu>
  </el-scrollbar>
</template>

<style>
.sidebar-scrollbar {
  flex: 1;
  min-height: 0;
  background: var(--menu-surface);
}

.erp-menu,
.erp-menu-popper {
  --el-menu-bg-color: var(--menu-surface);
  --el-menu-text-color: var(--menu-text);
  --el-menu-active-color: var(--menu-brand-text);
  --el-menu-hover-bg-color: var(--menu-hover);
  --el-menu-item-height: 42px;
  --el-menu-sub-item-height: 40px;
  --el-menu-base-level-padding: 16px;
}

.erp-menu,
.erp-menu .el-menu {
  border-right: none;
}

.erp-menu .el-menu-item,
.erp-menu .el-sub-menu__title,
.erp-menu-popper .el-menu-item,
.erp-menu-popper .el-sub-menu__title {
  font-size: 13px;
  border-radius: 0;
}

.erp-menu .el-menu-item.is-active,
.erp-menu-popper .el-menu-item.is-active {
  background: var(--menu-active-bg);
}

.erp-menu .menu-icon,
.erp-menu-popper .menu-icon {
  width: 20px;
  margin-right: 8px;
  font-size: 17px;
  text-align: center;
  flex-shrink: 0;
}

.erp-menu.el-menu--collapse {
  width: var(--aside-collapse-width);
}

.erp-menu.el-menu--collapse > .el-menu-item .el-menu-tooltip__trigger,
.erp-menu.el-menu--collapse > .el-menu-item,
.erp-menu.el-menu--collapse > .el-sub-menu > .el-sub-menu__title {
  height: 58px;
  padding: 0 !important;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  line-height: normal;
}

.erp-menu.el-menu--collapse .menu-icon {
  margin: 0;
}

.erp-menu.el-menu--collapse .compact-label {
  display: block;
  width: 56px;
  overflow: hidden;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.erp-menu-popper .el-menu--popup {
  min-width: 180px;
  padding: 4px 0;
  border-radius: 3px;
}
</style>
