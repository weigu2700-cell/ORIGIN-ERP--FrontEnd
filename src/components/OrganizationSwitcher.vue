<script setup lang="ts">
import { captureSession, isSessionCurrent } from '@/utils/auth'
import { onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { OfficeBuilding, ArrowDown, Check } from '@element-plus/icons-vue'
import { useOrganizationStore } from '@/stores/organization'
import { useUserStore } from '@/stores/user'
const organizations = useOrganizationStore()
const user = useUserStore()
onMounted(() => {
  if (!organizations.configuration) void organizations.initialize()
})
async function switchOrganization(code: string) {
  if (code && code === user.organization?.code) return
  const snapshot = captureSession()
  try {
    await ElMessageBox.confirm('切换后需要重新登录，当前页面未提交的内容不会保留。', '切换组织', {
      confirmButtonText: '退出并切换',
      cancelButtonText: '留在当前组织',
      type: 'warning',
    })
  } catch {
    return
  }
  if (!isSessionCurrent(snapshot)) return
  organizations.choose(code)
  await user.logout(false)
}
</script>
<template>
  <el-dropdown trigger="click" @command="switchOrganization">
    <button
      class="organization-switcher"
      type="button"
      :aria-label="`当前组织 ${user.organization?.name || '加载中'}，选择或切换组织`"
    >
      <el-icon><OfficeBuilding /></el-icon>
      <span>{{ user.organization?.name || '当前组织' }}</span>
      <el-icon><ArrowDown /></el-icon>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="organization in organizations.recent"
          :key="organization.code"
          :command="organization.code"
          :disabled="organizations.configuration?.mode === 'single' && organization.code !== user.organization?.code"
        >
          <el-icon v-if="organization.code === user.organization?.code"><Check /></el-icon>
          {{ organization.name }}
          <small>· {{ organization.code }}</small>
        </el-dropdown-item>
        <el-dropdown-item v-if="organizations.configuration?.mode !== 'single'" command="" divided>
          使用其他组织编码
        </el-dropdown-item>
        <el-dropdown-item v-else disabled divided>当前部署仅支持此组织</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
<style scoped>
.organization-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  width: clamp(130px, 17vw, 210px);
  max-width: 210px;
  min-width: 0;
  padding: 6px 12px;
  background: var(--panel-background, #fff);
  border: 1px solid var(--border-color, #d6e0e6);
  border-radius: 7px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  font-size: 13px;
}
.organization-switcher .el-icon {
  flex: 0 0 auto;
}
.organization-switcher span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.organization-switcher:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
@media (max-width: 960px) {
  .organization-switcher {
    width: 144px;
    padding: 6px 9px;
  }
}
</style>
