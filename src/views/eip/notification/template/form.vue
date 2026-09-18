<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import RecipientSelectorInput from '@/views/eip/notification/components/RecipientSelector.vue'
import { useTemplateVariables } from '@/composables/useTemplateVariables'
import { createNotificationTemplate, getNotificationTemplate, updateNotificationTemplate } from '@/api/eip/notification'
import type { NotificationTemplate, NotificationTemplateRecipient, RecipientSelector } from '@/types/eip/notification'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const saving = ref(false)
const templateId = computed(() => String(route.params.id || ''))
const isEdit = computed(() => Boolean(templateId.value))

const createSelector = (): RecipientSelector => ({
  userIds: [],
  roleCodes: [],
  permissionCodes: [],
  departmentIds: [],
  allActiveUsers: false,
  includeChildDepartments: false,
  includeAdministrators: false,
})

const form = reactive<NotificationTemplate>({
  code: '',
  name: '',
  titleTemplate: '',
  contentTemplate: '',
  notificationType: 0,
  status: 1,
  remark: '',
  recipients: [],
})
const recipients = ref<RecipientSelector>(createSelector())
const variables = useTemplateVariables(
  () => form.titleTemplate,
  () => form.contentTemplate,
)

const selectorToRows = (selector: RecipientSelector): NotificationTemplateRecipient[] => [
  ...selector.userIds.map((selectorValue) => ({
    selectorType: 'USER' as const,
    selectorValue,
    includeChildren: false,
  })),
  ...selector.roleCodes.map((selectorValue) => ({
    selectorType: 'ROLE' as const,
    selectorValue,
    includeChildren: false,
  })),
  ...selector.permissionCodes.map((selectorValue) => ({
    selectorType: 'PERMISSION' as const,
    selectorValue,
    includeChildren: false,
  })),
  ...(selector.departmentIds.length
    ? [
        {
          selectorType: 'DEPARTMENT' as const,
          selectorValue: selector.departmentIds.join(','),
          includeChildren: selector.includeChildDepartments,
        },
      ]
    : []),
  ...(selector.allActiveUsers
    ? [{ selectorType: 'ALL_ACTIVE_USERS' as const, selectorValue: 'ALL_ACTIVE_USERS', includeChildren: false }]
    : []),
  ...(selector.includeAdministrators
    ? [{ selectorType: 'ADMINISTRATORS' as const, selectorValue: 'ADMINISTRATORS', includeChildren: false }]
    : []),
]

const rowsToSelector = (rows: NotificationTemplateRecipient[]) => {
  const selector = createSelector()
  for (const row of rows) {
    const values = row.selectorValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    if (row.selectorType === 'USER') selector.userIds.push(...values)
    if (row.selectorType === 'ROLE') selector.roleCodes.push(...values)
    if (row.selectorType === 'PERMISSION') selector.permissionCodes.push(...values)
    if (row.selectorType === 'DEPARTMENT') {
      selector.departmentIds.push(...values)
      selector.includeChildDepartments ||= row.includeChildren
    }
    if (row.selectorType === 'ALL_ACTIVE_USERS') selector.allActiveUsers = true
    if (row.selectorType === 'ADMINISTRATORS') selector.includeAdministrators = true
  }
  return selector
}

const load = async () => {
  if (!isEdit.value) return
  const data = await getNotificationTemplate(templateId.value)
  Object.assign(form, data)
  recipients.value = rowsToSelector(data.recipients ?? [])
}

const save = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const data = { ...form, recipients: selectorToRows(recipients.value) }
    if (isEdit.value) await updateNotificationTemplate(templateId.value, data)
    else await createNotificationTemplate(data)
    ElMessage.success(isEdit.value ? '模板已更新' : '模板已创建')
    void router.push({ name: 'Template' })
  } finally {
    saving.value = false
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="template-form-page">
    <PageHeader
      :title="isEdit ? '编辑通知模板' : '新建通知模板'"
      description="维护可复用的通知标题、正文和预设收件人。"
    >
      <template #toolbar>
        <el-button @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button :loading="saving" type="primary" @click="save">
          <el-icon><Check /></el-icon>
          保存模板
        </el-button>
      </template>
    </PageHeader>

    <section class="template-form-card">
      <el-form ref="formRef" :model="form" label-position="top">
        <div class="condition-grid">
          <el-form-item
            label="模板编码"
            prop="code"
            :rules="[{ required: true, message: '请输入模板编码', trigger: 'blur' }]"
            class="condition-field"
          >
            <el-input v-model="form.code" :disabled="isEdit" placeholder="例如 purchase.done" maxlength="64" />
          </el-form-item>
          <el-form-item
            label="模板名称"
            prop="name"
            :rules="[{ required: true, message: '请输入模板名称', trigger: 'blur' }]"
            class="condition-field"
          >
            <el-input v-model="form.name" placeholder="例如采购完成通知" maxlength="100" />
          </el-form-item>
          <el-form-item label="通知类型" class="condition-field">
            <el-select v-model="form.notificationType" placeholder="选择类型" style="width: 100%">
              <el-option label="系统" :value="0" />
              <el-option label="业务" :value="1" />
              <el-option label="预警" :value="2" />
              <el-option label="任务" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="预设收件人" class="condition-wide">
            <RecipientSelectorInput v-model="recipients" />
          </el-form-item>
          <el-form-item label="备注" class="condition-wide">
            <el-input v-model="form.remark" placeholder="模板用途说明（可选）" maxlength="200" />
          </el-form-item>
        </div>

        <div class="content-title">
          <el-input
            v-model="form.titleTemplate"
            placeholder="通知标题模板（必填），例如：采购单 {{no}} 已完成"
            maxlength="200"
          />
        </div>
        <el-form-item
          prop="contentTemplate"
          :rules="[{ required: true, message: '请输入模板正文', trigger: 'blur' }]"
          class="content-editor"
        >
          <RichTextEditor v-model="form.contentTemplate" placeholder="通知正文模板（必填），支持 {{name}} 等变量" />
        </el-form-item>
        <div v-if="variables.length" class="variable-list">
          <span>已识别变量</span>
          <el-tag v-for="name in variables" :key="name" size="small" effect="plain">{{ name }}</el-tag>
        </div>
      </el-form>
    </section>
  </div>
</template>

<style scoped>
.template-form-page {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}
.template-form-card {
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--panel-background);
  box-shadow: var(--shadow-panel);
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
  margin-top: 10px;
}
.content-editor :deep(.el-form-item__content) {
  display: block;
  width: 100%;
  margin-left: 0 !important;
}
.variable-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
}
@media (max-width: 900px) {
  .condition-field {
    grid-column: span 6;
  }
}
@media (max-width: 600px) {
  .template-form-card,
  .condition-grid {
    padding: 14px;
  }
  .condition-field {
    grid-column: 1 / -1;
  }
}
</style>
