<script setup lang="ts">
defineOptions({ name: 'ListPageHeader' })

defineProps<{
  title: string
  description?: string
  summary?: string
}>()
</script>

<template>
  <header class="list-page-header">
    <div class="list-page-header__heading">
      <div>
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
      <span v-if="summary">{{ summary }}</span>
    </div>
    <div v-if="$slots.search || $slots.toolbar" class="list-page-header__controls">
      <div v-if="$slots.search" class="list-page-header__search"><slot name="search" /></div>
      <div v-if="$slots.toolbar" class="list-page-header__toolbar"><slot name="toolbar" /></div>
    </div>
  </header>
</template>

<style scoped>
.list-page-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 7px;
  background: color-mix(in srgb, var(--panel-background) 74%, var(--page-background));
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.list-page-header__heading,
.list-page-header__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.list-page-header__heading > div { flex: 1; min-width: 0; }
.list-page-header__heading h1 { margin: 0; color: var(--text-primary); font-size: 18px; font-weight: 600; line-height: 1.35; }
.list-page-header__heading p { margin: 2px 0 0; color: var(--text-secondary); font-size: 12px; }
.list-page-header__heading > span { color: var(--text-secondary); font-size: 12px; }

.list-page-header__controls {
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.list-page-header__search { flex: 0 1 auto; min-width: 0; }
.list-page-header__toolbar { flex: 0 0 auto; padding-left: 12px; border-left: 1px solid var(--border-color); }

.list-page-header__search :deep(.pro-search),
.list-page-header__toolbar :deep(.pro-toolbar-container) {
  width: auto;
  height: auto;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  flex-wrap: wrap;
}

@media (max-width: 760px) {
  .list-page-header__search { flex: 1 1 100%; }
  .list-page-header__toolbar { padding-left: 0; border-left: 0; }
}
</style>
