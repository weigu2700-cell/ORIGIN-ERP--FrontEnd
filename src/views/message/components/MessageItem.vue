<script setup lang="ts">
import { computed } from 'vue'
import { Close, Download, Picture, RefreshRight, Warning } from '@element-plus/icons-vue'
import { isLocalMessage, type TimelineItem } from '@/types/im'
import ChatAvatar from './ChatAvatar.vue'
import { clock, fmtBytes } from '../utils'

const props = defineProps<{
  item: TimelineItem
  mine: boolean
  showName: boolean
  senderName: string
  senderId: string | null
}>()
const emit = defineEmits<{ retry: []; discard: []; cancel: []; download: []; preview: [] }>()

const local = computed(() => (isLocalMessage(props.item) ? props.item.local : null))
const ext = computed(() => (props.item.file?.name.split('.').pop() ?? '').toLowerCase())
const extClass = computed(() =>
  ['xlsx', 'pdf', 'docx', 'zip', 'png', 'jpg', 'jpeg', 'webp'].includes(ext.value) ? ext.value : 'other',
)
const progress = computed(() => (local.value?.state === 'uploading' ? local.value.progress : 0))
</script>

<template>
  <div v-if="item.type === 'SYSTEM'" class="sys-row">
    <span>{{ item.system?.description }}</span>
  </div>
  <div v-else class="msg-row" :class="{ mine, sending: local?.state === 'sending', failed: local?.state === 'failed' }">
    <ChatAvatar v-if="!mine" :name="senderName" :user-id="senderId ?? ''" :size="36" />
    <div class="body">
      <div v-if="showName && !mine" class="who">{{ senderName }}</div>

      <div v-if="item.type === 'TEXT'" class="bubble">{{ item.text }}</div>

      <div
        v-else-if="item.type === 'IMAGE'"
        class="image-card"
        role="button"
        tabindex="0"
        @click="emit('preview')"
        @keyup.enter="emit('preview')"
      >
        <el-icon class="ph"><Picture /></el-icon>
        <div v-if="local?.state === 'uploading'" class="img-mask">{{ progress }}%</div>
        <span class="cap">{{ item.file?.name }} · {{ fmtBytes(item.file?.size ?? 0) }}</span>
      </div>

      <div v-else class="file-card" :class="{ rejected: local?.state === 'rejected' }">
        <span class="ftype" :class="extClass">{{ ext.slice(0, 4).toUpperCase() }}</span>
        <div class="fmeta">
          <div class="fname" :title="item.file?.name">{{ item.file?.name }}</div>
          <div v-if="local?.state === 'uploading'" class="fsub">
            <span>{{ fmtBytes(item.file?.size ?? 0) }}</span>
            <span>· 上传中 {{ progress }}%</span>
          </div>
          <div v-else-if="local?.state === 'verifying'" class="fsub warn">正在安全检查…</div>
          <div v-else-if="local?.state === 'rejected'" class="fsub bad">{{ local.reason }}</div>
          <div v-else class="fsub">
            <span>{{ fmtBytes(item.file?.size ?? 0) }}</span>
            <span v-if="!local" class="ok">· 已通过检查</span>
          </div>
          <el-progress
            v-if="local?.state === 'uploading'"
            :percentage="progress"
            :show-text="false"
            :stroke-width="4"
          />
          <div v-else-if="local?.state === 'verifying'" class="verify-bar" />
        </div>
        <el-button
          v-if="local && ['uploading', 'verifying'].includes(local.state)"
          circle
          size="small"
          :icon="Close"
          aria-label="取消上传"
          @click="emit('cancel')"
        />
        <el-button
          v-else-if="local?.state === 'rejected'"
          circle
          size="small"
          :icon="Close"
          aria-label="移除"
          @click="emit('discard')"
        />
        <el-button
          v-else-if="!local"
          circle
          size="small"
          type="primary"
          plain
          :icon="Download"
          aria-label="下载"
          @click="emit('download')"
        />
      </div>

      <div class="meta">
        <template v-if="local?.state === 'sending'">发送中…</template>
        <template v-else-if="local?.state === 'failed'">
          <span class="bad">
            <el-icon><Warning /></el-icon>
            发送失败
          </span>
          <el-link v-if="item.type === 'TEXT'" type="primary" :underline="false" @click="emit('retry')">
            <el-icon><RefreshRight /></el-icon>
            重试
          </el-link>
          <el-link :underline="false" @click="emit('discard')">删除</el-link>
        </template>
        <template v-else>{{ clock(item.createdAt) }}</template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sys-row {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}
.sys-row span {
  color: var(--text-secondary);
  font-size: 12px;
  background: rgb(36 91 120 / 7%);
  padding: 3px 12px;
  border-radius: 10px;
  max-width: 80%;
  text-align: center;
}
.msg-row {
  display: flex;
  gap: 10px;
  margin: 10px 0;
  align-items: flex-start;
}
.msg-row.mine {
  flex-direction: row-reverse;
}
.body {
  display: flex;
  flex-direction: column;
  max-width: min(560px, 72%);
  min-width: 0;
}
.mine .body {
  align-items: flex-end;
}
.who {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 2px 3px;
}
.bubble {
  background: var(--panel-background);
  border-radius: 4px 14px 14px 14px;
  padding: 9px 13px;
  word-break: break-word;
  white-space: pre-wrap;
  box-shadow: 0 1px 2px rgb(22 38 49 / 6%);
  line-height: 1.55;
}
.mine .bubble {
  background: var(--color-primary);
  color: #fff;
  border-radius: 14px 4px 14px 14px;
}
.failed .bubble {
  background: #f3d6d6;
  color: #7a2b2b;
}
.sending .bubble,
.sending .file-card {
  opacity: 0.7;
}
.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  margin: 3px 2px 0;
}
.meta .bad {
  color: var(--el-color-danger);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.image-card {
  position: relative;
  width: 220px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: linear-gradient(135deg, #8fb3c4, #d99a2b 140%);
  display: grid;
  place-items: center;
  color: rgb(255 255 255 / 80%);
}
.image-card .ph {
  font-size: 42px;
}
.image-card .cap {
  position: absolute;
  left: 8px;
  bottom: 6px;
  right: 8px;
  color: #fff;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgb(0 0 0 / 50%);
}
.img-mask {
  position: absolute;
  inset: 0;
  background: rgb(24 56 75 / 55%);
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
}
.file-card {
  background: var(--panel-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  width: 280px;
}
.file-card.rejected {
  border-color: #e8c4c4;
}
.ftype {
  width: 38px;
  height: 44px;
  border-radius: 7px;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex: none;
  background: #6f7f89;
}
.ftype.xlsx {
  background: #2a8c6a;
}
.ftype.pdf {
  background: #c44f4f;
}
.ftype.docx {
  background: #3b6fb5;
}
.ftype.zip {
  background: #8b67c7;
}
.ftype.png,
.ftype.jpg,
.ftype.jpeg,
.ftype.webp {
  background: #d99a2b;
}
.fmeta {
  min-width: 0;
  flex: 1;
}
.fname {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fsub {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  gap: 6px;
  margin-top: 1px;
}
.fsub .ok {
  color: #2a8c6a;
}
.fsub.warn {
  color: #d99a2b;
}
.fsub.bad {
  color: var(--el-color-danger);
}
.verify-bar {
  height: 4px;
  border-radius: 2px;
  margin-top: 6px;
  background: repeating-linear-gradient(45deg, #d99a2b 0 8px, #ecc47a 8px 16px);
  background-size: 22px 22px;
  animation: verify-slide 1s linear infinite;
}
@keyframes verify-slide {
  to {
    background-position: 22px 0;
  }
}
</style>
