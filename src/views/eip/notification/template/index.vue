<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Refresh, Search, Switch } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import {
  deleteNotificationTemplate,
  getNotificationTemplates,
  updateNotificationTemplateStatus,
} from '@/api/eip/notification'
import type { NotificationTemplate } from '@/types/eip/notification'

const keyword = ref('')
const records = ref<NotificationTemplate[]>([])
const loading = ref(false)
const router = useRouter()
const page = ref(1)
const pageSize = ref(10)
const filteredRecords = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  return value
    ? records.value.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(value))
    : records.value
})
const pagedRecords = computed(() =>
  filteredRecords.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
)

const columns: ProColumn<NotificationTemplate>[] = [
  { label: '编码', prop: 'code', minWidth: 150 },
  { label: '名称', prop: 'name', minWidth: 150 },
  { label: '类型', prop: 'notificationType', width: 90, slot: 'type' },
  { label: '预设收件人', prop: 'recipients', minWidth: 260, slot: 'recipients' },
  { label: '状态', prop: 'status', width: 90, slot: 'status' },
  { label: '操作', prop: 'actions', width: 190, fixed: 'right', slot: 'actions' },
]

const statusLabel = (status: number) => (Number(status) === 1 ? '启用' : '停用')

const typeLabel = (type: number) =>
  ({ 0: '系统', 1: '业务', 2: '预警', 3: '任务', 4: '自定义' })[Number(type)] ?? '通知'

const recipientSummary = (row: NotificationTemplate) =>
  (row.recipients ?? []).map((item) => `${item.selectorType}:${item.selectorValue}`).join('、') || '无预设收件人'

const load = async () => {
  loading.value = true
  try {
    records.value = await getNotificationTemplates()
    if ((page.value - 1) * pageSize.value >= records.value.length) page.value = 1
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  void router.push({ name: 'notification-template-create' })
}

const openEdit = (row: NotificationTemplate) => {
  void router.push({ name: 'notification-template-edit', params: { id: row.id } })
}

const toggleStatus = async (row: NotificationTemplate) => {
  const next = Number(row.status) === 1 ? 0 : 1
  await updateNotificationTemplateStatus(String(row.id), next === 1 ? 'ENABLE' : 'DISABLE')
  row.status = next
  ElMessage.success(next === 1 ? '模板已启用' : '模板已停用')
}

const remove = async (row: NotificationTemplate) => {
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.name}」吗？`, '删除确认', { type: 'warning' })
    await deleteNotificationTemplate(String(row.id))
    ElMessage.success('模板已删除')
    await load()
  } catch {
    // 用户取消确认时不提示；请求错误由拦截器统一处理。
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="template-page">
    <PageHeader title="通知模板" description="维护系统通知的标题、内容和预设收件人。">
      <template #search>
        <el-input
          v-model="keyword"
          clearable
          placeholder="搜索模板编码或名称"
          style="width: 260px"
          @update:model-value="page = 1"
        >
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
      </template>
      <template #toolbar>
        <el-button type="primary" @click="openCreate">
          <el-icon>
            <Plus />
          </el-icon>
          新建模板
        </el-button>
        <el-button text :loading="loading" @click="load">
          <el-icon>
            <Refresh />
          </el-icon>
          刷新
        </el-button>
      </template>
    </PageHeader>

    <section v-loading="loading" class="template-card">
      <ProTable
        :data="pagedRecords"
        :columns="columns"
        :total="filteredRecords.length"
        :page="page"
        :page-size="pageSize"
        :show-selection="false"
        @update:page="page = $event"
        @update:pageSize="
          (size) => {
            pageSize = size
            page = 1
          }
        "
      >
        <template #type="{ row }">{{ typeLabel(row.notificationType) }}</template>
        <template #recipients="{ row }">
          <span class="recipient-text" :title="recipientSummary(row)">{{ recipientSummary(row) }}</span>
        </template>
        <template #status="{ row }">
          <el-tag :type="Number(row.status) === 1 ? 'success' : 'info'" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <el-button text type="primary" @click="openEdit(row)">
            <el-icon>
              <Edit />
            </el-icon>
            编辑
          </el-button>
          <el-button text @click="toggleStatus(row)">
            <el-icon>
              <Switch />
            </el-icon>
            {{ Number(row.status) === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button text type="danger" @click="remove(row)">
            <el-icon>
              <Delete />
            </el-icon>
          </el-button>
        </template>
      </ProTable>
    </section>
  </div>
</template>

<style scoped>
.template-page {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}

.template-card {
  min-height: 0;
  flex: 1;
}

.recipient-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
