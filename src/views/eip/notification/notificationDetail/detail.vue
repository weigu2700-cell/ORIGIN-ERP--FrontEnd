<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, Bell, Check, CircleCheck, Document, InfoFilled, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import { getNotificationDetail } from '@/api/eip/notification'
import { NotificationType } from '@/constants/enumCode'
import useNotificationStore from '@/stores/notification'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import type { NotificationItem } from '@/types/eip/notification'

defineOptions({ name: 'NotificationDetail' })

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()
const notification = ref<NotificationItem | null>(null)
const loading = ref(false)
const error = ref(false)
const actionLoading = ref(false)

const notificationId = computed(() => String(route.params.id ?? ''))
const typeLabel = computed(() => NotificationType.labelOf(notification.value?.type ?? -1) || '通知')
const businessReference = computed(() => notification.value?.businessNo || notification.value?.businessId || '')

const typeIcon = computed(() => {
  if (notification.value?.type === NotificationType.WARNING) return WarningFilled
  if (notification.value?.type === NotificationType.BUSINESS) return Document
  if (notification.value?.type === NotificationType.TASK) return Check
  return InfoFilled
})

const typeClass = computed(() => {
  if (notification.value?.type === NotificationType.WARNING) return 'is-warning'
  if (notification.value?.type === NotificationType.BUSINESS) return 'is-business'
  if (notification.value?.type === NotificationType.TASK) return 'is-task'
  return 'is-system'
})

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

const loadDetail = async () => {
  if (!notificationId.value) {
    error.value = true
    return
  }
  loading.value = true
  error.value = false
  try {
    notification.value = await getNotificationDetail(notificationId.value)
  } catch {
    notification.value = null
    error.value = true
  } finally {
    loading.value = false
  }
}

const markRead = async () => {
  if (!notification.value || notification.value.isRead || actionLoading.value) return
  actionLoading.value = true
  try {
    await notificationStore.markOneRead(notification.value.id)
    notification.value = {
      ...notification.value,
      isRead: true,
      readTime: new Date().toISOString(),
    }
    ElMessage.success('已标记为已读')
  } catch {
    ElMessage.error('通知状态更新失败，请稍后重试')
  } finally {
    actionLoading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else void router.push({ name: 'notification-center' })
}

onMounted(() => {
  void loadDetail()
})
</script>

<template>
  <div class="notification-detail-page">
    <PageHeader title="通知详情" description="查看通知内容和处理状态。">
      <template #toolbar>
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button
          v-if="notification && !notification.isRead"
          type="primary"
          :loading="actionLoading"
          @click="markRead"
        >
          <el-icon><Check /></el-icon>
          标记已读
        </el-button>
      </template>
    </PageHeader>

    <section v-loading="loading" class="detail-card" aria-live="polite">
      <div v-if="error" class="detail-state">
        <el-icon><WarningFilled /></el-icon>
        <strong>通知加载失败</strong>
        <span>该通知可能不存在，或您无权查看。</span>
        <el-button type="primary" link @click="loadDetail">重新加载</el-button>
      </div>

      <template v-else-if="notification">
        <header class="detail-heading">
          <span class="notification-type-icon" :class="typeClass">
            <el-icon><component :is="typeIcon" /></el-icon>
          </span>
          <div class="detail-title">
            <div class="detail-title-line">
              <h1>{{ notification.title || typeLabel }}</h1>
              <span v-if="notification.isRead" class="read-status is-read">
                <el-icon><CircleCheck /></el-icon>
                已读
              </span>
              <span v-else class="read-status is-unread">
                <i />
                未读
              </span>
            </div>
            <div class="detail-meta">
              <el-tag size="small" effect="plain" :class="typeClass">{{ typeLabel }}</el-tag>
              <time :datetime="notification.createTime">{{ formatTime(notification.createTime) }}</time>
            </div>
          </div>
        </header>

        <div class="detail-content" v-html="sanitizeHtml(notification.content || '暂无内容')" />

        <dl class="detail-info">
          <div v-if="businessReference">
            <dt>业务编号</dt>
            <dd>{{ businessReference }}</dd>
          </div>
          <div v-if="notification.businessType">
            <dt>业务类型</dt>
            <dd>{{ notification.businessType }}</dd>
          </div>
          <div>
            <dt>通知时间</dt>
            <dd>{{ formatTime(notification.createTime) }}</dd>
          </div>
          <div>
            <dt>读取时间</dt>
            <dd>{{ formatTime(notification.readTime) }}</dd>
          </div>
        </dl>
      </template>

      <div v-else-if="!loading" class="detail-state">
        <el-icon><Bell /></el-icon>
        <span>暂无通知内容</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.notification-detail-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 12px;
}

.detail-card {
  min-height: 420px;
  padding: 28px 32px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-background);
  box-shadow: var(--shadow-panel);
}

.detail-heading {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--border-color);
}

.notification-type-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 12px;
  font-size: 22px;
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

.detail-title {
  min-width: 0;
  flex: 1;
}
.detail-title-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.detail-title h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 21px;
  font-weight: 600;
  line-height: 1.45;
}
.detail-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 7px;
  color: var(--text-secondary);
  font-size: 12px;
}
.detail-meta :deep(.el-tag) {
  border: 0;
}

.read-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.read-status.is-read {
  color: var(--el-color-success);
}
.read-status.is-unread {
  color: var(--el-color-danger);
}
.read-status.is-unread i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.detail-content {
  min-height: 150px;
  padding: 28px 4px;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.9;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  padding: 18px 20px;
  gap: 18px 32px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--page-background) 70%, var(--panel-background));
}

.detail-info div {
  min-width: 0;
}
.detail-info dt {
  margin-bottom: 5px;
  color: var(--text-secondary);
  font-size: 12px;
}
.detail-info dd {
  margin: 0;
  color: var(--text-primary);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.detail-state {
  display: flex;
  min-height: 350px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: var(--text-secondary);
}

.detail-state .el-icon {
  color: var(--el-color-warning);
  font-size: 28px;
}
.detail-state strong {
  color: var(--text-primary);
  font-size: 15px;
}
.detail-state span {
  font-size: 13px;
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

@media (max-width: 720px) {
  .detail-card {
    padding: 20px 18px;
  }
  .detail-info {
    grid-template-columns: 1fr;
  }
}
</style>
