<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bell, Check, Document, InfoFilled, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import useNotificationStore from '@/stores/notification'
import { NotificationType } from '@/constants/enumCode'
import type { NotificationItem } from '@/types/eip/notification'

defineOptions({ name: 'NotificationPopover' })

const notificationStore = useNotificationStore()
const router = useRouter()
const visible = ref(false)
const actionLoading = ref(false)

const recentNotifications = computed(() => notificationStore.notificationList.slice(0, 6))
const hasNotifications = computed(() => recentNotifications.value.length > 0)

const typeLabel = (type: number) => NotificationType.labelOf(type) || '通知'

const typeIcon = (type: number) => {
  if (type === NotificationType.WARNING) return WarningFilled
  if (type === NotificationType.TASK) return Check
  if (type === NotificationType.BUSINESS) return Document
  return InfoFilled
}

const typeClass = (type: number) => {
  if (type === NotificationType.WARNING) return 'is-warning'
  if (type === NotificationType.TASK) return 'is-task'
  if (type === NotificationType.BUSINESS) return 'is-business'
  return 'is-system'
}

const formatTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const markOneRead = async (item: NotificationItem) => {
  if (item.isRead || actionLoading.value) return
  try {
    actionLoading.value = true
    await notificationStore.markOneRead(item.id)
  } catch {
    ElMessage.error('通知状态更新失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

const markAllRead = async () => {
  if (!notificationStore.hasUnread || actionLoading.value) return
  try {
    actionLoading.value = true
    await notificationStore.markAllRead()
  } catch {
    ElMessage.error('通知状态更新失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

const viewAll = () => {
  visible.value = false
  router.push({ name: 'notification-center' })
}
</script>

<template>
  <el-popover
    v-model:visible="visible"
    placement="bottom-end"
    :width="400"
    trigger="click"
    :teleported="true"
    popper-class="notification-popover-popper"
  >
    <template #reference>
      <el-badge
        class="notification-badge"
        :value="notificationStore.badgeText"
        :hidden="!notificationStore.hasUnread"
        :max="99"
      >
        <el-button class="header-icon-button" text circle aria-label="通知" aria-haspopup="dialog">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>
    </template>

    <section class="notification-panel" aria-label="通知中心">
      <header class="notification-header">
        <div>
          <h2>通知</h2>
          <span v-if="notificationStore.hasUnread" class="notification-unread-count">
            {{ notificationStore.unreadCount }} 条未读
          </span>
          <span v-else class="notification-unread-count">暂无未读</span>
        </div>
        <el-button
          v-if="notificationStore.hasUnread"
          class="mark-all-button"
          link
          type="primary"
          :loading="actionLoading"
          @click="markAllRead"
        >
          <el-icon><Check /></el-icon>
          全部已读
        </el-button>
      </header>

      <div v-if="notificationStore.loading" class="notification-state" aria-live="polite">
        <el-icon class="is-loading"><Bell /></el-icon>
        <span>正在加载通知…</span>
      </div>
      <div v-else-if="!hasNotifications" class="notification-state notification-empty">
        <div class="empty-icon"><Bell /></div>
        <span>暂时没有新通知</span>
        <small>新的消息会实时出现在这里</small>
      </div>
      <div v-else class="notification-list" role="list">
        <button
          v-for="item in recentNotifications"
          :key="item.id"
          type="button"
          class="notification-item"
          :class="{ 'is-unread': !item.isRead }"
          role="listitem"
          @click="markOneRead(item)"
        >
          <span class="notification-type-icon" :class="typeClass(item.type)" :title="typeLabel(item.type)">
            <el-icon><component :is="typeIcon(item.type)" /></el-icon>
          </span>
          <span class="notification-item-main">
            <span class="notification-item-topline">
              <span class="notification-item-title">{{ item.title || typeLabel(item.type) }}</span>
              <span class="notification-item-time">{{ formatTime(item.createTime) }}</span>
            </span>
            <span class="notification-item-content">{{ item.content || '暂无内容' }}</span>
            <span class="notification-item-meta">{{ typeLabel(item.type) }}</span>
          </span>
          <span v-if="!item.isRead" class="notification-unread-dot" aria-label="未读" />
        </button>
      </div>

      <footer class="notification-footer">
        <button type="button" class="view-all-button" @click="viewAll">
          查看全部通知
          <el-icon><Document /></el-icon>
        </button>
      </footer>
    </section>
  </el-popover>
</template>

<style scoped>
:global(.notification-popover-popper) {
  max-width: calc(100vw - 32px);
}

.notification-badge {
  display: inline-flex;
  vertical-align: middle;
}

.notification-badge .header-icon-button {
  width: 34px;
  height: 34px;
  color: var(--text-secondary);
  font-size: 17px;
}

.notification-badge .header-icon-button:hover,
.notification-badge .header-icon-button:focus-visible {
  color: var(--el-color-primary);
  background: var(--color-primary-soft);
  outline: none;
}

.notification-badge :deep(.el-badge__content) {
  top: 3px;
  right: 3px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border: 2px solid var(--panel-background);
  line-height: 13px;
  font-size: 10px;
  font-weight: 700;
}

.notification-panel {
  color: var(--text-primary);
}

.notification-header,
.notification-footer,
.notification-item-topline {
  display: flex;
  align-items: center;
}

.notification-header {
  justify-content: space-between;
  padding: 2px 2px 14px;
  border-bottom: 1px solid var(--border-color);
}

.notification-header h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
}

.notification-unread-count {
  display: inline-block;
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: 12px;
}

.mark-all-button {
  padding: 4px 0;
  font-size: 12px;
}

.mark-all-button .el-icon {
  margin-right: 3px;
}

.notification-list {
  max-height: 378px;
  padding: 3px 0;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  width: 100%;
  min-height: 68px;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 4px;
  border: 0;
  border-bottom: 1px solid var(--border-color);
  color: inherit;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.16s ease;
}

.notification-item:last-child {
  border-bottom: 0;
}

.notification-item:hover,
.notification-item:focus-visible {
  border-radius: 6px;
  outline: none;
  background: var(--color-primary-soft);
}

.notification-type-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  place-items: center;
  margin-top: 1px;
  border-radius: 9px;
  font-size: 16px;
}

.notification-type-icon.is-system {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.notification-type-icon.is-business {
  color: #0f766e;
  background: #dff6f2;
}

.notification-type-icon.is-warning {
  color: #b45309;
  background: #fff2d9;
}

.notification-type-icon.is-task {
  color: #6d4bc1;
  background: #eee9ff;
}

:global(.dark) .notification-type-icon.is-business {
  color: #7dd3c7;
  background: rgb(15 118 110 / 22%);
}

:global(.dark) .notification-type-icon.is-warning {
  color: #fbbf74;
  background: rgb(180 83 9 / 24%);
}

:global(.dark) .notification-type-icon.is-task {
  color: #c4b5fd;
  background: rgb(109 75 193 / 24%);
}

.notification-item-main {
  min-width: 0;
  flex: 1;
}

.notification-item-topline {
  justify-content: space-between;
  gap: 8px;
}

.notification-item-title {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-item-time,
.notification-item-meta {
  flex: 0 0 auto;
  color: var(--text-secondary);
  font-size: 11px;
}

.notification-item-content {
  display: -webkit-box;
  margin-top: 3px;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.notification-item-meta {
  display: block;
  margin-top: 5px;
  color: var(--color-primary);
}

.notification-unread-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  margin-top: 7px;
  border-radius: 50%;
  background: var(--el-color-danger);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}

.notification-state {
  min-height: 182px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
}

.notification-empty {
  flex-direction: column;
  gap: 4px;
}

.notification-empty small {
  color: var(--text-secondary);
  font-size: 11px;
}

.empty-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  margin-bottom: 5px;
  border-radius: 50%;
  color: var(--text-secondary);
  background: var(--color-primary-soft);
  font-size: 20px;
}

.notification-footer {
  justify-content: center;
  min-height: 42px;
  border-top: 1px solid var(--border-color);
}

.view-all-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  color: var(--color-primary);
  background: transparent;
  cursor: pointer;
  font-size: 12px;
}

.view-all-button:hover,
.view-all-button:focus-visible {
  color: var(--el-color-primary-dark-2);
  outline: none;
  text-decoration: underline;
}

@media (max-width: 560px) {
  .notification-panel {
    width: min(400px, calc(100vw - 32px));
  }

  .notification-item-time {
    display: none;
  }
}
</style>
