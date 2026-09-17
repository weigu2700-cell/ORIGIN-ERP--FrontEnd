<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Bell, Check, InfoFilled, Refresh, WarningFilled, Document, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import ProPagination from '@/components/ProPagination.vue'
import { NotificationType } from '@/constants/enumCode'
import { getPageNotification } from '@/api/eip/notification'
import type { NotificationItem, NotificationPageResult, NotificationQuery } from '@/types/eip/notification'
import useNotificationStore from '@/stores/notification'

defineOptions({ name: 'NotificationCenter' })

type NotificationFilter = boolean | null

const notificationStore = useNotificationStore()
const query = reactive<{ pageNum: number; pageSize: number; isRead: NotificationFilter }>({
  pageNum: 1,
  pageSize: 10,
  isRead: null,
})
const records = ref<NotificationItem[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref(false)
const actionLoading = ref(false)
const newMessageHint = ref(false)
let requestSequence = 0

const unreadCount = computed(() => Math.max(0, Number(notificationStore.unreadCount) || 0))
const summary = computed(() => `共 ${total.value} 条 · ${unreadCount.value} 条未读`)
const filterOptions: Array<{ label: string; value: NotificationFilter }> = [
  { label: '全部', value: null },
  { label: '未读', value: false },
  { label: '已读', value: true },
]

const typeLabel = (type: number) => NotificationType.labelOf(type) || '通知'

const typeIcon = (type: number) => {
  if (type === NotificationType.WARNING) return WarningFilled
  if (type === NotificationType.BUSINESS) return Document
  if (type === NotificationType.TASK) return Check
  return InfoFilled
}

const typeClass = (type: number) => {
  if (type === NotificationType.WARNING) return 'is-warning'
  if (type === NotificationType.BUSINESS) return 'is-business'
  if (type === NotificationType.TASK) return 'is-task'
  return 'is-system'
}

const formatTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(/\//g, '-')
}

const businessReference = (item: NotificationItem) =>
  item.businessNo || (item.businessId != null ? String(item.businessId) : '')

const requestPage = async (): Promise<NotificationPageResult> => getPageNotification(query as NotificationQuery)

const loadPage = async (allowUnreadFallback = true) => {
  const sequence = ++requestSequence
  loading.value = true
  error.value = false
  newMessageHint.value = false
  try {
    const response = await requestPage()
    if (sequence !== requestSequence) return
    records.value = response.records ?? []
    total.value = Number(response.total ?? records.value.length)
    if (allowUnreadFallback && query.isRead === false && query.pageNum > 1 && records.value.length === 0) {
      query.pageNum -= 1
      await loadPage(false)
    }
  } catch {
    if (sequence === requestSequence) {
      records.value = []
      total.value = 0
      error.value = true
    }
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

const refresh = () => loadPage()

const selectFilter = (value: NotificationFilter) => {
  if (query.isRead === value) return
  query.isRead = value
  query.pageNum = 1
  void loadPage()
}

const handlePageChange = (page: number) => {
  query.pageNum = page
  void loadPage()
}

const handlePageSizeChange = (size: number) => {
  query.pageSize = size
  query.pageNum = 1
  void loadPage()
}

const viewNewMessages = () => {
  query.pageNum = 1
  void loadPage()
}

const markOneRead = async (item: NotificationItem) => {
  if (item.isRead || actionLoading.value) return
  actionLoading.value = true
  try {
    await notificationStore.markOneRead(item.id)
    await loadPage()
  } catch {
    ElMessage.error('通知状态更新失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

const markAllRead = async () => {
  if (!notificationStore.hasUnread || actionLoading.value) return
  actionLoading.value = true
  try {
    await notificationStore.markAllRead()
    await loadPage()
    ElMessage.success('已全部标记为已读')
  } catch {
    ElMessage.error('通知状态更新失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

const retry = () => void loadPage()

watch(
  () => notificationStore.revision,
  () => {
    if (query.pageNum === 1) void loadPage()
    else newMessageHint.value = true
  },
)

onMounted(() => {
  void refresh()
})
</script>

<template>
  <div class="notification-page">
    <PageHeader title="消息通知" description="集中查看系统、业务与任务消息，及时处理待办事项。" :summary="summary">
      <template #toolbar>
        <el-button text :loading="loading" aria-label="刷新通知" @click="refresh">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新
        </el-button>
        <el-button
          text
          type="primary"
          :loading="actionLoading"
          :disabled="!notificationStore.hasUnread"
          @click="markAllRead"
        >
          <el-icon>
            <Check />
          </el-icon>
          全部已读
        </el-button>
      </template>
    </PageHeader>

    <section class="notification-card" aria-label="消息列表">
      <div class="notification-toolbar">
        <div class="filter-tabs" role="tablist" aria-label="消息筛选">
          <button
            v-for="option in filterOptions"
            :key="String(option.value)"
            class="filter-tab"
            :class="{ 'is-active': query.isRead === option.value }"
            type="button"
            role="tab"
            :aria-selected="query.isRead === option.value"
            @click="selectFilter(option.value)"
          >
            {{ option.label }}
            <span v-if="option.value === false && unreadCount > 0" class="filter-count">{{ unreadCount }}</span>
          </button>
        </div>
        <span v-if="newMessageHint" class="new-message-hint" role="status">
          <i class="new-message-dot" />
          有新消息，返回第一页查看
          <button type="button" @click="viewNewMessages">查看</button>
        </span>
      </div>

      <div v-if="loading" class="notification-state" aria-live="polite">
        <el-icon class="is-loading">
          <Bell />
        </el-icon>
        <span>正在加载通知…</span>
      </div>
      <div v-else-if="error" class="notification-state notification-error">
        <el-icon>
          <WarningFilled />
        </el-icon>
        <span>通知加载失败，请检查网络后重试。</span>
        <el-button type="primary" link @click="retry">重新加载</el-button>
      </div>
      <div v-else-if="records.length === 0" class="notification-state notification-empty">
        <span class="empty-icon">
          <Bell />
        </span>
        <strong>
          {{ query.isRead === false ? '暂无未读消息' : query.isRead === true ? '暂无已读消息' : '暂无消息' }}
        </strong>
        <small>{{ query.isRead === false ? '新的通知会实时出现在这里' : '消息到达后会显示在这里' }}</small>
      </div>
      <div v-else class="notification-list" role="list">
        <article
          v-for="item in records"
          :key="item.id"
          class="notification-item"
          :class="{ 'is-unread': !item.isRead }"
          role="listitem"
        >
          <span class="notification-type-icon" :class="typeClass(item.type)" :title="typeLabel(item.type)">
            <el-icon>
              <component :is="typeIcon(item.type)" />
            </el-icon>
          </span>
          <div class="notification-main">
            <div class="notification-topline">
              <h2>{{ item.title || typeLabel(item.type) }}</h2>
              <time :datetime="item.createTime">{{ formatTime(item.createTime) }}</time>
            </div>
            <div class="notification-meta">
              <el-tag size="small" effect="plain" :class="typeClass(item.type)">{{ typeLabel(item.type) }}</el-tag>
              <span v-if="businessReference(item)" class="business-reference">
                业务编号：{{ businessReference(item) }}
              </span>
            </div>
            <p class="notification-content">{{ item.content || '暂无内容' }}</p>
          </div>
          <div class="notification-status">
            <span v-if="!item.isRead" class="unread-label">
              <i />
              未读
            </span>
            <span v-else class="read-label">
              <CircleCheck />
              已读
            </span>
            <el-button v-if="!item.isRead" link type="primary" :loading="actionLoading" @click="markOneRead(item)">
              标记已读
            </el-button>
          </div>
        </article>
      </div>

      <ProPagination
        v-if="!error && total > 0"
        :total="total"
        :page="query.pageNum"
        :page-size="query.pageSize"
        :page-sizes="[10, 20, 50]"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </section>
  </div>
</template>

<style scoped>
.notification-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 12px;
}

.notification-card {
  display: flex;
  min-height: 420px;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-background);
  box-shadow: var(--shadow-panel);
}

.notification-toolbar {
  display: flex;
  min-height: 54px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-color);
}

.filter-tabs {
  display: flex;
  align-self: stretch;
  gap: 20px;
}

.filter-tab {
  position: relative;
  border: 0;
  padding: 0 2px;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
}

.filter-tab::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: transparent;
  content: '';
}

.filter-tab.is-active {
  color: var(--el-color-primary);
  font-weight: 600;
}

.filter-tab.is-active::after {
  background: var(--el-color-primary);
}

.filter-count {
  display: inline-grid;
  min-width: 18px;
  height: 18px;
  margin-left: 4px;
  padding: 0 4px;
  place-items: center;
  border-radius: 10px;
  color: #fff;
  background: var(--el-color-danger);
  font-size: 11px;
  line-height: 18px;
}

.new-message-hint {
  color: var(--text-secondary);
  font-size: 12px;
}

.new-message-hint button {
  margin-left: 6px;
  border: 0;
  color: var(--el-color-primary);
  background: transparent;
  cursor: pointer;
}

.new-message-dot,
.unread-label i {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: var(--el-color-danger);
}

.notification-list {
  flex: 1;
}

.notification-item {
  display: flex;
  min-height: 112px;
  align-items: flex-start;
  gap: 13px;
  padding: 18px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.18s ease;
}

.notification-item:hover,
.notification-item.is-unread {
  background: color-mix(in srgb, var(--color-primary-soft) 42%, var(--panel-background));
}

.notification-type-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 11px;
  font-size: 19px;
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

.notification-main {
  min-width: 0;
  flex: 1;
}

.notification-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.notification-topline h2 {
  overflow: hidden;
  margin: 0;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-topline time {
  flex: 0 0 auto;
  color: var(--text-secondary);
  font-size: 12px;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 7px;
}

.notification-meta :deep(.el-tag) {
  border: 0;
}

.notification-meta :deep(.el-tag.is-business) {
  color: #0f766e;
  background: #dff6f2;
}

.notification-meta :deep(.el-tag.is-warning) {
  color: #a16207;
  background: #fff2d9;
}

.notification-meta :deep(.el-tag.is-task) {
  color: #6d4bc1;
  background: #eee9ff;
}

.notification-meta :deep(.el-tag.is-system) {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

:global(.dark) .notification-type-icon.is-business,
:global(.dark) .notification-meta :deep(.el-tag.is-business) {
  color: #7dd3c7;
  background: rgb(15 118 110 / 22%);
}

:global(.dark) .notification-type-icon.is-warning,
:global(.dark) .notification-meta :deep(.el-tag.is-warning) {
  color: #fbbf74;
  background: rgb(180 83 9 / 24%);
}

:global(.dark) .notification-type-icon.is-task,
:global(.dark) .notification-meta :deep(.el-tag.is-task) {
  color: #c4b5fd;
  background: rgb(109 75 193 / 24%);
}

.business-reference {
  color: var(--text-secondary);
  font-size: 12px;
}

.notification-content {
  margin: 9px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.notification-status {
  display: flex;
  min-width: 72px;
  flex-direction: column;
  align-items: flex-end;
  gap: 9px;
}

.unread-label,
.read-label {
  color: var(--el-color-danger);
  font-size: 12px;
  white-space: nowrap;
}

.read-label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--text-secondary);
}

.read-label svg {
  width: 13px;
  height: 13px;
}

.notification-state {
  display: flex;
  min-height: 300px;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.notification-state .el-icon {
  font-size: 26px;
  color: var(--color-primary);
}

.notification-state.notification-error .el-icon {
  color: var(--el-color-danger);
}

.notification-empty .empty-icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 18px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 28px;
}

.notification-empty strong {
  color: var(--text-primary);
  font-size: 14px;
}

.notification-empty small {
  color: var(--text-secondary);
  font-size: 12px;
}

.notification-card > :deep(.pro-pagination) {
  margin: 8px;
}

@media (max-width: 680px) {
  .notification-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 0;
    padding-top: 10px;
  }

  .filter-tabs {
    min-height: 44px;
  }

  .new-message-hint {
    padding-bottom: 10px;
  }

  .notification-item {
    padding: 14px;
  }

  .notification-status {
    min-width: 62px;
  }

  .notification-topline {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
