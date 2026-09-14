<script setup lang="ts">
import Header from './components/header.vue'
import Aside from './components/sidebar.vue'
import Fold from './components/fold.vue'
import useAppStore from '@/stores/app.ts'

const appStore = useAppStore()
</script>

<template>
  <div :class="appStore.isFold ? 'basic-layout-collapse' : 'basic-layout'">
    <el-header class="header">
      <Header />
    </el-header>
    <el-aside class="aside">
      <div class="brand" :class="{ 'brand--collapsed': appStore.isFold }">
        <img class="brand-mark" src="/origin-manufacturing-logo-light.svg" alt="原点智造 ERP" />
        <div v-if="!appStore.isFold" class="brand-copy">
          <strong>原点智造 ERP</strong>
          <span>ORIGIN · 制造运营管理平台</span>
        </div>
      </div>
      <div v-if="!appStore.isFold" class="sidebar-caption">
        <span>业务导航</span>
        <span class="sidebar-caption-line" />
      </div>
      <Aside />
      <Fold />
    </el-aside>
    <el-main class="main">
      <router-view v-slot="{ Component, route }">
        <transition name="route-page">
          <div :key="route.fullPath" class="route-page">
            <component :is="Component" />
          </div>
        </transition>
      </router-view>
    </el-main>
  </div>
</template>

<style scoped>
.basic-layout,
.basic-layout-collapse {
  width: 100vw;
  height: 100dvh;
  display: grid;
  grid-template-rows: var(--header-height) 1fr;
  grid-template-areas:
    'aside header'
    'aside main';
  transition: all 0.2s;
}

.basic-layout {
  grid-template-columns: var(--aside-width) 1fr;
}

.basic-layout-collapse {
  grid-template-columns: var(--aside-collapse-width) 1fr;
}

.header {
  grid-area: header;
  background-color: var(--panel-background);
  border-bottom: 1px solid var(--border-color);
  width: 100%;
  height: 100%;
  padding: 0 28px;
  line-height: var(--header-height);
  box-shadow: 0 1px 0 rgb(15 23 42 / 2%);
}

.aside {
  grid-area: aside;
  background: var(--menu-surface);
  width: 100%;
  height: 100%;
  overflow: hidden;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}

.brand {
  position: relative;
  height: var(--header-height);
  flex: 0 0 var(--header-height);
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 20px;
  color: var(--menu-brand-text);
  overflow: hidden;
}

.brand::after {
  content: '';
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--color-accent);
  opacity: 0.84;
}

.brand--collapsed {
  justify-content: center;
  padding: 0;
}

.brand--collapsed::after {
  left: 16px;
  right: 16px;
}

.brand-mark {
  width: 31px;
  height: 31px;
  flex: 0 0 31px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  box-shadow: none;
}

.brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  white-space: nowrap;
}

.brand-copy strong {
  font-size: 15px;
  letter-spacing: 0.2px;
}

.brand-copy span {
  color: var(--menu-brand-muted);
  font-size: 10px;
}

.sidebar-caption {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px 8px;
  color: var(--menu-brand-muted);
  font-size: 10px;
  letter-spacing: 1px;
}

.sidebar-caption-line {
  height: 1px;
  flex: 1;
  background: rgb(255 255 255 / 13%);
}

.main {
  grid-area: main;
  position: relative;
  padding: 20px 24px 24px;
  background-color: var(--page-background);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
  transition: all 0.2s;
}

.route-page {
  height: 100%;
}

.route-page-enter-active,
.route-page-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.route-page {
  min-height: 100%;
}

.route-page-leave-active {
  position: absolute;
  inset: 20px 24px 24px;
}

.route-page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.route-page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .route-page-enter-active,
  .route-page-leave-active {
    transition: none;
  }
}
</style>
