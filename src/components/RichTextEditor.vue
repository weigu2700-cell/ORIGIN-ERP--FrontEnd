<script setup lang="ts">
import { onBeforeUnmount, shallowRef } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    minHeight?: number
  }>(),
  { placeholder: '请输入正文', minHeight: 240 },
)

const model = defineModel<string>({ default: '' })
const editorRef = shallowRef<IDomEditor>()
const toolbarConfig: Partial<IToolbarConfig> = { excludeKeys: ['group-video', 'insertVideo'] }
const editorConfig: Partial<IEditorConfig> = { placeholder: props.placeholder }

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => editorRef.value?.destroy())
</script>

<template>
  <div class="rich-text-editor">
    <Toolbar :editor="editorRef" :default-config="toolbarConfig" mode="default" />
    <Editor
      v-model="model"
      :default-config="editorConfig"
      mode="default"
      :style="{ minHeight: `${props.minHeight}px` }"
      @on-created="handleCreated"
    />
  </div>
</template>

<style scoped>
.rich-text-editor {
  overflow: hidden;
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--panel-background);
}

.rich-text-editor :deep(.w-e-toolbar) {
  border-bottom: 1px solid var(--border-color);
}

.rich-text-editor :deep(.w-e-text-container) {
  background: var(--panel-background);
}
</style>
