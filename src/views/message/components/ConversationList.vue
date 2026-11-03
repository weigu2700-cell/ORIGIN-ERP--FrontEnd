<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Plus, Search, User, UserFilled } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { imApi } from '@/api/im'
import type { Contact } from '@/types/im'
import ChatAvatar from './ChatAvatar.vue'
import { errorText, isGroup, listTime, previewOf } from '../utils'

const emit = defineEmits<{ select: [id: string]; newDirect: []; newGroup: [] }>()
const chat = useChatStore()
const tab = ref<'chats' | 'contacts'>('chats')
const filter = ref<'all' | 'unread' | 'group'>('all')
const keyword = ref('')
const contacts = ref<Contact[]>([])
const loadingContacts = ref(false)

const rows = computed(() =>
  chat.list.filter((c) => {
    if (filter.value === 'unread' && !c.unreadCount) return false
    if (filter.value === 'group' && c.type !== 'GROUP') return false
    return !keyword.value.trim() || c.name.includes(keyword.value.trim())
  }),
)

const grouped = computed(() => {
  const map = new Map<string, Contact[]>()
  for (const c of contacts.value) {
    const dept = c.departmentName || '未分配部门'
    map.set(dept, [...(map.get(dept) ?? []), c])
  }
  return [...map.entries()]
})

let timer: ReturnType<typeof setTimeout> | null = null
async function loadContacts() {
  loadingContacts.value = true
  try {
    const page = await imApi.contacts({ keyword: keyword.value.trim() || undefined, limit: 100 })
    contacts.value = page.records
  } catch (error) {
    ElMessage.error(errorText(error))
  } finally {
    loadingContacts.value = false
  }
}
watch([tab, keyword], () => {
  if (tab.value !== 'contacts') return
  if (timer) clearTimeout(timer)
  timer = setTimeout(loadContacts, 250)
})

async function openContact(c: Contact) {
  try {
    const id = await chat.startDirect(c.userId)
    tab.value = 'chats'
    emit('select', id)
  } catch (error) {
    ElMessage.error(errorText(error))
  }
}
</script>

<template>
  <section class="conv-list">
    <header>
      <h1>消息</h1>
      <el-dropdown trigger="click" @command="(c: string) => (c === 'direct' ? emit('newDirect') : emit('newGroup'))">
        <el-button type="primary" :icon="Plus" circle aria-label="发起聊天" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="direct" :icon="User">发起单聊</el-dropdown-item>
            <el-dropdown-item command="group" :icon="UserFilled">创建群聊</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>
    <el-input
      v-model="keyword"
      :prefix-icon="Search"
      clearable
      :placeholder="tab === 'chats' ? '搜索会话' : '搜索姓名或部门'"
    />
    <el-segmented
      v-model="tab"
      class="tabs"
      :options="[
        { label: '消息', value: 'chats' },
        { label: '通讯录', value: 'contacts' },
      ]"
    />
    <template v-if="tab === 'chats'">
      <div class="filters">
        <button
          v-for="f in [
            ['all', '全部'],
            ['unread', '未读'],
            ['group', '群聊'],
          ] as const"
          :key="f[0]"
          type="button"
          :class="{ on: filter === f[0] }"
          @click="filter = f[0]"
        >
          {{ f[1] }}
        </button>
      </div>
      <el-scrollbar class="items">
        <div v-if="chat.disabledReason" class="hint">{{ chat.disabledReason }}</div>
        <div v-else-if="!chat.ready" class="hint">正在加载会话…</div>
        <div v-else-if="!rows.length" class="hint">
          {{ keyword ? '没有匹配的会话' : '还没有会话，点击右上角 + 发起聊天' }}
        </div>
        <button
          v-for="c in rows"
          :key="c.id"
          type="button"
          class="item"
          :class="{ on: c.id === chat.activeId }"
          @click="emit('select', c.id)"
        >
          <ChatAvatar
            :kind="isGroup(c) ? 'group' : 'user'"
            :name="c.name"
            :user-id="c.peerUserId ?? ''"
            :size="44"
            :dissolved="c.status === 'DISSOLVED'"
          />
          <div class="mid">
            <div class="top">
              <span class="nm">{{ c.name }}</span>
              <el-tag v-if="c.status === 'DISSOLVED'" size="small" type="info" effect="plain">已解散</el-tag>
              <span class="tm">{{ listTime(c.lastMessage?.createdAt ?? c.updatedAt) }}</span>
            </div>
            <div class="pv">
              <span class="txt">{{ previewOf(c.lastMessage, chat.nameOf, isGroup(c)) }}</span>
              <el-icon v-if="c.muted" class="mute"><Bell /></el-icon>
              <el-badge v-if="c.unreadCount" :value="c.unreadCount" :max="99" :type="c.muted ? 'info' : 'danger'" />
            </div>
          </div>
        </button>
      </el-scrollbar>
    </template>
    <el-scrollbar v-else v-loading="loadingContacts" class="items">
      <div v-if="!grouped.length && !loadingContacts" class="hint">没有匹配的同事</div>
      <template v-for="[dept, people] in grouped" :key="dept">
        <div class="dept">{{ dept }}</div>
        <button v-for="p in people" :key="p.userId" type="button" class="item" @click="openContact(p)">
          <ChatAvatar :name="p.displayName" :user-id="p.userId" :size="38" />
          <div class="mid">
            <div class="top">
              <span class="nm">{{ p.displayName }}</span>
            </div>
            <div class="pv">
              <span class="txt">{{ p.departmentName }}</span>
            </div>
          </div>
        </button>
      </template>
    </el-scrollbar>
  </section>
</template>

<style scoped>
.conv-list {
  display: flex;
  flex-direction: column;
  background: var(--panel-background);
  border-right: 1px solid var(--border-color);
  min-height: 0;
  height: 100%;
  padding: 14px 12px 0;
  gap: 10px;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}
h1 {
  font-size: 18px;
  color: var(--text-primary);
}
.tabs {
  width: 100%;
}
.tabs :deep(.el-segmented__group) {
  width: 100%;
}
.tabs :deep(.el-segmented__item) {
  flex: 1;
}
.filters {
  display: flex;
  gap: 4px;
}
.filters button {
  border: 0;
  background: none;
  padding: 3px 12px;
  border-radius: 14px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}
.filters button.on {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
}
.items {
  flex: 1;
  min-height: 0;
  margin: 0 -12px;
}
.item {
  display: flex;
  gap: 11px;
  padding: 11px 16px;
  align-items: center;
  width: 100%;
  border: 0;
  background: none;
  text-align: left;
  cursor: pointer;
  position: relative;
  font: inherit;
  color: inherit;
}
.item:hover {
  background: var(--button-hover);
}
.item.on {
  background: var(--color-primary-soft);
}
.item.on::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 2px;
  background: var(--color-primary);
}
.mid {
  flex: 1;
  min-width: 0;
}
.top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nm {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  color: var(--text-primary);
}
.tm {
  font-size: 12px;
  color: var(--text-secondary);
}
.pv {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 1px;
}
.txt {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mute {
  color: #9aa8b0;
}
.hint {
  padding: 30px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
.dept {
  padding: 6px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--button-hover);
}
</style>
