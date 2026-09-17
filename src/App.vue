<script setup lang="ts">
import useAppStore from '@/stores/app.ts'

// 预先应用已保存的主题，保证登录页和业务页刷新后保持一致。
useAppStore()
</script>

<template>
  <router-view />
</template>

<style scoped></style>

<style>
.el-dialog {
  min-width: 480px;
}
</style>
