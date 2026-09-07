<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  summary?: string
}>()
</script>

<template>
  <header class="page-title">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="description">{{ description }}</p>
    </div>
    <span v-if="summary">{{ summary }}</span>
    <slot />
  </header>
</template>

<style scoped>
.page-title {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 2px 8px;
  border-bottom: 1px solid var(--border-color);
}

.page-title > div { flex: 1; min-width: 0; }
h1 { margin: 0; color: var(--text-primary); font-size: 18px; font-weight: 600; line-height: 1.4; }
p { margin: 2px 0 0; color: var(--text-secondary); font-size: 12px; }
.page-title > span { flex: none; color: var(--text-secondary); font-size: 12px; }
</style>
