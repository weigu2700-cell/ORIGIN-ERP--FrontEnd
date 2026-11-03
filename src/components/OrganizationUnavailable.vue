<script setup lang="ts">
import { ref } from 'vue'
import { OfficeBuilding } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
const user = useUserStore()
const loading = ref(false)
const error = ref('')
async function retry() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    await user.getUserInfo()
  } catch {
    error.value = '暂时无法检查组织状态，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <section class="organization-welcome">
    <p class="eyebrow">组织主页</p>
    <h1>{{ user.organization?.name }}</h1>
    <p>欢迎回来，{{ user.userInfo.realName || user.userInfo.username }}</p>
    <div class="availability-card">
      <el-icon :size="32"><OfficeBuilding /></el-icon>
      <h2>当前组织暂未开放业务</h2>
      <p>
        组织开放后，你可以在这里处理订单、生产和库存。
        <br />
        也可以从顶部选择其他组织，重新登录。
      </p>
      <p v-if="error" role="alert">{{ error }}</p>
      <el-button type="primary" :loading="loading" @click="retry">重新检查</el-button>
    </div>
  </section>
</template>
<style scoped>
.organization-welcome {
  padding: clamp(20px, 4vw, 56px);
  color: var(--el-text-color-primary);
}
h1 {
  margin: 10px 0;
  font-size: 28px;
  overflow-wrap: anywhere;
}
.eyebrow {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.availability-card {
  margin-top: 32px;
  max-width: 660px;
  padding: 40px 32px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--panel-background);
}
.availability-card p {
  color: var(--el-text-color-secondary);
  line-height: 1.8;
}
h2 {
  font-size: 21px;
  font-weight: 600;
}
</style>
