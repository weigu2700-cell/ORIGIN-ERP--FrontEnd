<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Promotion, Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { getNotificationTemplate, getNotificationTemplates, publishNotification } from '@/api/eip/notification'
import type {
  NotificationTemplate,
  RecipientSelector,
  SystemNotificationPublishRequest,
} from '@/types/eip/notification'
import RecipientSelectorInput from '@/views/eip/notification/components/RecipientSelector.vue'
import { useTemplateVariables } from '@/composables/useTemplateVariables'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

type PublishMode = 'custom' | 'template'
const mode = ref<PublishMode>('custom')
const templates = ref<NotificationTemplate[]>([])
const selectedTemplate = ref<NotificationTemplate | null>(null)
const loadingTemplates = ref(false)
const submitting = ref(false)
const failedPayload = ref<SystemNotificationPublishRequest | null>(null)

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const form = reactive<SystemNotificationPublishRequest>({
  requestId: createRequestId(),
  type: 0,
  title: '',
  content: '',
  recipients: createSelector(),
  mergeMode: 'PRESET_ONLY',
  variables: {},
  businessType: '',
  businessId: undefined,
  businessNo: '',
})

const recipientSelection = ref<RecipientSelector>(createSelector())
function createSelector(): RecipientSelector {
  return {
    userIds: [],
    roleCodes: [],
    permissionCodes: [],
    departmentIds: [],
    allActiveUsers: false,
    includeChildDepartments: false,
    includeAdministrators: false,
  }
}

const variables = useTemplateVariables(
  () => selectedTemplate.value?.titleTemplate,
  () => selectedTemplate.value?.contentTemplate,
)

const setVariable = (name: string, value: string) => {
  form.variables = { ...form.variables, [name]: value }
}

const replaceVariables = (value: string) =>
  value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, name: string) => form.variables?.[name] || `{{${name}}}`)
const previewTitle = computed(() => replaceVariables(selectedTemplate.value?.titleTemplate ?? ''))
const previewContent = computed(() => replaceVariables(selectedTemplate.value?.contentTemplate ?? ''))

const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    templates.value = await getNotificationTemplates()
  } finally {
    loadingTemplates.value = false
  }
}

const chooseTemplate = async (id: string | number | undefined) => {
  if (id == null || id === '') {
    selectedTemplate.value = null
    return
  }
  selectedTemplate.value = await getNotificationTemplate(String(id))
  form.type = selectedTemplate.value.notificationType
  form.variables = Object.fromEntries(variables.value.map((name) => [name, form.variables?.[name] ?? '']))
  recipientSelection.value = createSelector()
}

const presetSummary = computed(() =>
  (selectedTemplate.value?.recipients ?? []).map((item) => `${item.selectorType}:${item.selectorValue}`).join('、'),
)

const payload = (): SystemNotificationPublishRequest => {
  const data: SystemNotificationPublishRequest = {
    requestId: form.requestId,
    type: form.type,
    recipients: recipientSelection.value,
    mergeMode: mode.value === 'template' ? form.mergeMode : 'OVERRIDE',
    variables: form.variables,
    businessType: form.businessType || undefined,
    businessId: form.businessId || undefined,
    businessNo: form.businessNo || undefined,
  }
  if (mode.value === 'template' && selectedTemplate.value) {
    data.templateId = selectedTemplate.value.id
  } else {
    data.title = form.title?.trim()
    data.content = form.content?.trim()
  }
  return data
}

const submit = async (retryPayload?: SystemNotificationPublishRequest) => {
  const data = retryPayload ?? payload()
  if (mode.value === 'custom' && (!data.title || !data.content)) {
    ElMessage.warning('请填写通知标题和内容')
    return
  }
  if (mode.value === 'template' && !selectedTemplate.value) {
    ElMessage.warning('请选择通知模板')
    return
  }
  submitting.value = true
  failedPayload.value = null
  try {
    await publishNotification(data)
    ElMessage.success('通知已提交发布')
    if (!retryPayload) {
      form.title = ''
      form.content = ''
      form.requestId = createRequestId()
    }
  } catch {
    failedPayload.value = data
    ElMessage.error('通知发布失败，可点击重试')
  } finally {
    submitting.value = false
  }
}

watch(mode, (value) => {
  failedPayload.value = null
  if (value === 'template' && !templates.value.length) void loadTemplates()
})

onMounted(() => void loadTemplates())
</script>

<template>
  <div class="publish-page">
    <PageHeader title="发布通知" description="向指定用户、角色或部门发送系统通知。">
      <template #toolbar>
        <el-button v-if="failedPayload" :loading="submitting" @click="submit(failedPayload)">
          <el-icon>
            <Refresh />
          </el-icon>
          重试
        </el-button>
        <el-button :loading="submitting" type="primary" @click="submit()">
          <el-icon>
            <Promotion />
          </el-icon>
          发布通知
        </el-button>
      </template>
    </PageHeader>
    <section class="publish-card">
      <el-radio-group v-model="mode" class="mode-tabs">
        <el-radio-button label="custom">自定义内容</el-radio-button>
        <el-radio-button label="template">使用模板</el-radio-button>
      </el-radio-group>

      <el-form label-position="top" class="publish-form">
        <div class="condition-grid">
          <template v-if="mode === 'template'">
            <el-form-item label="通知模板" class="condition-wide">
              <el-select
                :model-value="selectedTemplate?.id"
                placeholder="请选择模板"
                filterable
                :loading="loadingTemplates"
                style="width: 100%"
                @change="chooseTemplate"
              >
                <el-option
                  v-for="item in templates"
                  :key="item.id"
                  :label="`${item.name}（${item.code}）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-for="name in variables" :key="name" :label="name" class="condition-field">
              <el-input
                :model-value="form.variables?.[name] ?? ''"
                :placeholder="`请输入 ${name}`"
                @update:model-value="setVariable(name, $event)"
              />
            </el-form-item>
            <el-form-item v-if="selectedTemplate" label="正文预览" class="condition-wide">
              <div class="preview-box">
                <strong>{{ previewTitle }}</strong>
                <div v-html="sanitizeHtml(previewContent)" />
              </div>
            </el-form-item>
            <el-form-item label="收件人模式" class="condition-wide">
              <el-radio-group v-model="form.mergeMode">
                <el-radio label="PRESET_ONLY">仅模板预设</el-radio>
                <el-radio label="MERGE">合并手选</el-radio>
                <el-radio label="OVERRIDE">覆盖预设</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-alert
              v-if="form.mergeMode === 'PRESET_ONLY' && presetSummary"
              class="condition-wide"
              type="info"
              :closable="false"
              title="将使用模板预设收件人"
              :description="presetSummary"
            />
          </template>
          <el-form-item
            v-if="mode === 'custom' || form.mergeMode !== 'PRESET_ONLY'"
            label="收件人"
            class="condition-wide"
          >
            <RecipientSelectorInput v-model="recipientSelection" />
          </el-form-item>
          <el-form-item label="业务类型" class="condition-field"><el-input v-model="form.businessType" /></el-form-item>
          <el-form-item label="业务编号" class="condition-field"><el-input v-model="form.businessNo" /></el-form-item>
          <el-form-item label="业务 ID" class="condition-field"><el-input v-model="form.businessId" /></el-form-item>
        </div>
        <div v-if="mode === 'custom'" class="content-title">
          <el-input v-model="form.title" maxlength="100" placeholder="通知标题（必填）" />
        </div>
        <el-form-item v-if="mode === 'custom'" label="通知正文" required class="content-editor">
          <RichTextEditor v-model="form.content" placeholder="请输入通知正文，支持标题、列表、链接和图片" />
        </el-form-item>
      </el-form>
    </section>
  </div>
</template>

<style scoped>
.publish-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 12px;
}

.publish-card {
  width: 100%;
  box-sizing: border-box;
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-background);
  box-shadow: var(--shadow-panel);
}

.mode-tabs {
  margin-bottom: 16px;
}

.publish-form {
  width: 100%;
}

.condition-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0 16px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--page-background);
}

.condition-grid :deep(.el-form-item) {
  margin-bottom: 14px;
}

.condition-grid :deep(.el-form-item__label) {
  height: auto;
  padding-bottom: 5px;
  color: var(--text-secondary);
  line-height: 1.2;
  font-size: 12px;
}

.condition-field {
  grid-column: span 4;
}

.condition-wide {
  grid-column: 1 / -1;
}

.content-title {
  margin-top: 18px;
}

.content-editor {
  display: block;
  margin-top: 8px;
}

.content-editor :deep(.el-form-item__label) {
  display: block;
  float: none;
  width: auto !important;
  padding-bottom: 8px;
  text-align: left;
}

.content-editor :deep(.el-form-item__content) {
  display: block;
  width: 100%;
  margin-left: 0 !important;
}

.preview-box {
  width: 100%;
  padding: 12px 14px;
  border-radius: 6px;
  background: var(--page-background);
  color: var(--text-secondary);
}

.preview-box strong {
  color: var(--text-primary);
}

.preview-box p {
  margin: 8px 0 0;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .condition-field {
    grid-column: span 6;
  }
}

@media (max-width: 600px) {
  .publish-card,
  .condition-grid {
    padding: 14px;
  }

  .condition-field {
    grid-column: 1 / -1;
  }
}
</style>
