<script setup lang="ts">
import type { MenuItem } from '@/types/system/menu'
import { isClassIcon } from '@/utils/icon'

defineOptions({ name: 'SidebarItems' })
defineProps<{ menus: MenuItem[]; compact?: boolean }>()
</script>

<template>
  <template v-for="menu in menus" :key="menu.path">
    <el-menu-item v-if="!menu.children?.length" :index="menu.path">
      <el-icon v-if="menu.icon && !isClassIcon(menu.icon)" class="menu-icon">
        <component :is="menu.icon" />
      </el-icon>
      <i v-else-if="menu.icon" :class="['menu-icon', menu.icon]" />
      <div v-if="compact" class="compact-label">{{ menu.title }}</div>
      <template #title><span>{{ menu.title }}</span></template>
    </el-menu-item>
    <el-sub-menu v-else :index="menu.path" popper-class="erp-menu-popper">
      <template #title>
        <el-icon v-if="menu.icon && !isClassIcon(menu.icon)" class="menu-icon">
          <component :is="menu.icon" />
        </el-icon>
        <i v-else-if="menu.icon" :class="['menu-icon', menu.icon]" />
        <div v-if="compact" class="compact-label">{{ menu.title }}</div>
        <span v-else>{{ menu.title }}</span>
      </template>
      <SidebarItems :menus="menu.children" />
    </el-sub-menu>
  </template>
</template>
