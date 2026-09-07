<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'
</script>

<template>
  <div class="purchase-in-stock-container">
    <PageHeader title="采购入库" description="登记采购到货与仓库入库信息" />
    <div class="empty-panel">
      <el-empty description="暂无采购入库记录" />
    </div>
  </div>
</template>

<style scoped>
.purchase-in-stock-container { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 10px; }
.empty-panel { flex: 1; display: grid; place-items: center; border: 1px solid var(--border-color); background: var(--panel-background); }
</style>
