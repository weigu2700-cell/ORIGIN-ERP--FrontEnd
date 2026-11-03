<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Search } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { imApi } from '@/api/im'
import type { Contact } from '@/types/im'
import ChatAvatar from './ChatAvatar.vue'
import { errorText } from '../utils'

const props = defineProps<{ modelValue: boolean; mode: 'direct' | 'group' | 'add'; conversationId?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; created: [id: string] }>()

const chat = useChatStore()
const kind = ref<'direct' | 'group'>('direct')
const keyword = ref('')
const people = ref<Contact[]>([])
const selected = ref<string[]>([])
const name = ref('')
const loading = ref(false)
const submitting = ref(false)

const adding = computed(() => props.mode === 'add')
const existing = computed(
  () => new Set((props.conversationId ? chat.members[props.conversationId] : [])?.map((m) => m.userId) ?? []),
)
const maxMembers = computed(() => chat.config?.maxGroupMembers ?? 200)
const need = computed(() => (adding.value ? 1 : 2))
const limit = computed(() => (adding.value ? 50 : maxMembers.value - 1))
const valid = computed(
  () =>
    selected.value.length >= need.value &&
    selected.value.length <= limit.value &&
    (adding.value || (name.value.trim().length > 0 && name.value.length <= 64)),
)
const grouped = computed(() => {
  const map = new Map<string, Contact[]>()
  for (const p of people.value)
    map.set(p.departmentName || '未分配部门', [...(map.get(p.departmentName || '未分配部门') ?? []), p])
  return [...map.entries()]
})
const title = computed(() => (adding.value ? '添加成员' : kind.value === 'direct' ? '发起单聊' : '创建群聊'))
const hintText = computed(() => {
  if (kind.value === 'group' && !adding.value && selected.value.length === 1)
    return '再选 1 人即可创建群聊；仅 2 人请使用单聊'
  return ''
})

let timer: ReturnType<typeof setTimeout> | null = null
async function load() {
  loading.value = true
  try {
    people.value = (await imApi.contacts({ keyword: keyword.value.trim() || undefined, limit: 100 })).records
  } catch (error) {
    ElMessage.error(errorText(error))
  } finally {
    loading.value = false
  }
}
watch(keyword, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(load, 250)
})
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    kind.value = props.mode === 'group' ? 'group' : 'direct'
    keyword.value = ''
    selected.value = []
    name.value = ''
    void load()
  },
)
watch(kind, () => (selected.value = []))

async function pick(person: Contact) {
  if (adding.value && existing.value.has(person.userId)) return
  if (kind.value === 'direct' && !adding.value) {
    try {
      const id = await chat.startDirect(person.userId)
      emit('update:modelValue', false)
      emit('created', id)
    } catch (error) {
      ElMessage.error(errorText(error))
    }
    return
  }
  const i = selected.value.indexOf(person.userId)
  if (i >= 0) selected.value.splice(i, 1)
  else if (selected.value.length < limit.value) selected.value.push(person.userId)
  else ElMessage.warning(`最多选择 ${limit.value} 人`)
}

async function submit() {
  if (!valid.value || submitting.value) return
  submitting.value = true
  try {
    if (adding.value && props.conversationId) {
      await chat.addMembers(props.conversationId, selected.value)
      ElMessage.success('已添加成员')
      emit('update:modelValue', false)
    } else {
      const id = await chat.createGroup(name.value.trim(), selected.value)
      ElMessage.success('群聊已创建')
      emit('update:modelValue', false)
      emit('created', id)
    }
  } catch (error) {
    ElMessage.error(errorText(error))
  } finally {
    submitting.value = false
  }
}

const nameOf = (id: string) => people.value.find((p) => p.userId === id)?.displayName ?? chat.nameOf(id)
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="720px"
    align-center
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="picker">
      <div class="left">
        <el-segmented
          v-if="!adding"
          v-model="kind"
          :options="[
            { label: '单聊', value: 'direct' },
            { label: '群聊', value: 'group' },
          ]"
          class="seg"
        />
        <el-input v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索姓名或部门" />
        <el-scrollbar v-loading="loading" class="people">
          <div v-if="!grouped.length && !loading" class="none">没有匹配的同事</div>
          <template v-for="[dept, list] in grouped" :key="dept">
            <div class="dept">{{ dept }}</div>
            <button
              v-for="p in list"
              :key="p.userId"
              type="button"
              class="row"
              :class="{ sel: selected.includes(p.userId), dis: adding && existing.has(p.userId) }"
              @click="pick(p)"
            >
              <ChatAvatar :name="p.displayName" :user-id="p.userId" :size="34" />
              <div class="who">
                {{ p.displayName }}
                <small>{{ adding && existing.has(p.userId) ? '已在群中' : p.departmentName }}</small>
              </div>
              <span v-if="kind === 'group' || adding" class="cb">
                <el-icon v-if="selected.includes(p.userId)"><Check /></el-icon>
              </span>
            </button>
          </template>
        </el-scrollbar>
      </div>
      <div class="right">
        <div v-if="kind === 'direct' && !adding" class="direct-tip">
          选择一位同事即可进入单聊。
          <br />
          已有会话会直接打开，不会重复创建。
        </div>
        <template v-else>
          <template v-if="!adding">
            <label>群名称（1～64 字）</label>
            <el-input v-model="name" maxlength="64" show-word-limit placeholder="例如：装配一组" />
          </template>
          <label>
            已选择 {{ selected.length }} 人{{ adding ? '（一次最多 50 人）' : `（需 2～${limit} 人，你自动成为群主）` }}
          </label>
          <div class="chips">
            <el-tag v-for="id in selected" :key="id" closable @close="selected.splice(selected.indexOf(id), 1)">
              {{ nameOf(id) }}
            </el-tag>
            <span v-if="!selected.length" class="none">从左侧选择成员</span>
          </div>
          <el-alert v-if="hintText" :title="hintText" type="warning" :closable="false" />
        </template>
      </div>
    </div>
    <template v-if="kind === 'group' || adding" #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!valid" :loading="submitting" @click="submit">
        {{ adding ? '添加' : '创建群聊' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.picker {
  display: grid;
  grid-template-columns: 330px 1fr;
  height: 400px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}
.left {
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  min-height: 0;
}
.people {
  flex: 1;
  min-height: 0;
  margin: 0 -10px;
}
.dept {
  padding: 6px 14px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--button-hover);
}
.row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 8px 14px;
  border: 0;
  background: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: var(--text-primary);
}
.row:hover {
  background: var(--button-hover);
}
.row.dis {
  opacity: 0.5;
  cursor: not-allowed;
}
.who small {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
}
.cb {
  margin-left: auto;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid #b7c3ca;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 12px;
}
.row.sel .cb {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.right {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.right label {
  font-size: 13px;
  color: var(--text-secondary);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
  flex: 1;
  overflow: auto;
}
.none {
  color: var(--text-secondary);
  font-size: 13px;
  padding: 20px;
  text-align: center;
}
.direct-tip {
  margin: auto;
  text-align: center;
  color: var(--text-secondary);
  line-height: 2;
}
.seg {
  width: 100%;
}
.seg :deep(.el-segmented__group) {
  width: 100%;
}
.seg :deep(.el-segmented__item) {
  flex: 1;
}
</style>
