<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Paperclip, Picture, Promotion, Lock } from '@element-plus/icons-vue'

const props = defineProps<{
  disabled?: boolean
  readonlyReason?: string
  maxChars: number
  maxFileMb: number
  offline: boolean
}>()
const emit = defineEmits<{ send: [text: string]; files: [files: File[]] }>()

const text = ref('')
const fileInput = ref<HTMLInputElement>()
const imageInput = ref<HTMLInputElement>()
const over = computed(() => [...text.value].length > props.maxChars)
const canSend = computed(() => !props.disabled && text.value.trim().length > 0 && !over.value)

function submit() {
  if (!canSend.value) {
    if (over.value) ElMessage.warning(`单条消息最多 ${props.maxChars} 个字符`)
    return
  }
  emit('send', text.value)
  text.value = ''
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    submit()
  }
}

function picked(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) emit('files', [...input.files])
  input.value = ''
}

function dropped(event: DragEvent) {
  if (event.dataTransfer?.files.length) emit('files', [...event.dataTransfer.files])
}
</script>

<template>
  <div v-if="readonlyReason" class="composer readonly">
    <el-icon><Lock /></el-icon>
    {{ readonlyReason }}
  </div>
  <div v-else class="composer" @dragover.prevent @drop.prevent="dropped">
    <div class="tools">
      <el-tooltip content="发送文件" placement="top">
        <el-button text circle :icon="Paperclip" aria-label="发送文件" @click="fileInput?.click()" />
      </el-tooltip>
      <el-tooltip content="发送图片" placement="top">
        <el-button text circle :icon="Picture" aria-label="发送图片" @click="imageInput?.click()" />
      </el-tooltip>
      <input ref="fileInput" type="file" multiple hidden @change="picked" />
      <input ref="imageInput" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden @change="picked" />
    </div>
    <textarea
      v-model="text"
      class="input"
      rows="3"
      :placeholder="offline ? '网络已断开，消息发送后会标记失败，可稍后重试' : '输入消息，Enter 发送，Shift+Enter 换行'"
      aria-label="消息输入框"
      @keydown="onKey"
    />
    <div class="foot">
      <span class="hint" :class="{ bad: over }">
        {{ over ? `已超出 ${[...text].length - maxChars} 个字符` : `单文件不超过 ${maxFileMb} MB，可拖拽文件到此处` }}
      </span>
      <el-button type="primary" :icon="Promotion" :disabled="!canSend" @click="submit">发送</el-button>
    </div>
  </div>
</template>

<style scoped>
.composer {
  background: var(--panel-background);
  border-top: 1px solid var(--border-color);
  padding: 8px 20px 12px;
}
.composer.readonly {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  padding: 16px;
}
.tools {
  display: flex;
  gap: 2px;
  margin-bottom: 2px;
}
.input {
  width: 100%;
  border: 0;
  outline: 0;
  resize: none;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  line-height: 1.5;
}
.foot {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hint {
  flex: 1;
  color: var(--text-secondary);
  font-size: 12px;
}
.hint.bad {
  color: var(--el-color-danger);
}
</style>
