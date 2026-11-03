<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Edit, Plus } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import type { GroupMember } from '@/types/im'
import ChatAvatar from './ChatAvatar.vue'
import { canManage, errorText, isGroup } from '../utils'

const emit = defineEmits<{ addMember: []; left: [] }>()
const chat = useChatStore()
const conv = computed(() => chat.active)
const members = computed(() => (conv.value ? (chat.members[conv.value.id] ?? []) : []))
const editing = ref(false)
const draft = ref('')
const peer = computed(() => (conv.value?.peerUserId ? chat.contactCache[conv.value.peerUserId] : undefined))

watch(
  () => conv.value?.id,
  () => (editing.value = false),
)

const role = computed(() => conv.value?.myRole ?? null)
const dissolved = computed(() => conv.value?.status === 'DISSOLVED')
const roleTag = (m: GroupMember) => (m.role === 'OWNER' ? '群主' : m.role === 'ADMIN' ? '管理员' : '')

/** 群主可管理所有人；管理员只能移除普通成员。 */
const canActOn = (m: GroupMember) =>
  !dissolved.value &&
  m.userId !== chat.myId &&
  (role.value === 'OWNER' || (role.value === 'ADMIN' && m.role === 'MEMBER'))

async function guard(task: () => Promise<unknown>, success: string) {
  try {
    await task()
    ElMessage.success(success)
  } catch (error) {
    ElMessage.error(errorText(error))
  }
}

async function confirmThen(
  title: string,
  text: string,
  ok: string,
  danger: boolean,
  task: () => Promise<unknown>,
  success: string,
) {
  try {
    await ElMessageBox.confirm(
      `${text}\n\n提交时携带群版本 v${conv.value?.version}，若群信息已被他人修改会提示刷新后重试。`,
      title,
      {
        confirmButtonText: ok,
        cancelButtonText: '取消',
        type: danger ? 'warning' : 'info',
        confirmButtonClass: danger ? 'el-button--danger' : undefined,
      },
    )
  } catch {
    return
  }
  await guard(task, success)
}

const saveName = () => {
  const value = draft.value.trim()
  if (!conv.value || !value) return
  void guard(async () => {
    await chat.rename(conv.value!.id, value)
    editing.value = false
  }, '群名已更新')
}

const promote = (m: GroupMember, r: 'ADMIN' | 'MEMBER') =>
  guard(() => chat.setRole(conv.value!.id, m.userId, r), r === 'ADMIN' ? '已设为管理员' : '已取消管理员')

const remove = (m: GroupMember) =>
  confirmThen(
    '移除成员',
    `移除后 ${m.displayName} 将立即失去该群历史与文件的访问权；已下载到设备的内容无法收回。`,
    '移除',
    true,
    () => chat.removeMember(conv.value!.id, m.userId),
    '已移除成员',
  )

const transfer = (m: GroupMember) =>
  confirmThen(
    '转让群主',
    `转让后你变为管理员，${m.displayName} 将拥有解散群聊和任免管理员的权限。`,
    '确认转让',
    false,
    () => chat.transfer(conv.value!.id, m.userId),
    '群主已转让',
  )

const dissolve = () =>
  confirmThen(
    '解散群聊',
    '解散后全部成员只能查看历史，不能再发送消息或下载新文件；此操作不可撤销。',
    '解散',
    true,
    () => chat.dissolve(conv.value!.id),
    '群聊已解散',
  )

const leave = () =>
  confirmThen(
    '退出群聊',
    '退出后你将无法再查看该群历史，重新加入也只能看到加入之后的消息。',
    '退出',
    true,
    async () => {
      await chat.leave(conv.value!.id)
      emit('left')
    },
    '已退出群聊',
  )

const ownerTransfer = async () => {
  const candidates = members.value.filter((m) => m.userId !== chat.myId)
  if (!candidates.length) return
  ElMessage.info('请在成员列表中选择要转让的成员，点击「转让」')
}

const mute = (value: boolean) =>
  guard(() => chat.setMuted(conv.value!.id, value), value ? '已开启免打扰' : '已关闭免打扰')
</script>

<template>
  <aside v-if="conv" class="info">
    <template v-if="isGroup(conv)">
      <div class="hero">
        <ChatAvatar kind="group" :name="conv.name" :size="72" :dissolved="dissolved" />
        <div v-if="editing" class="rename">
          <el-input v-model="draft" maxlength="64" size="small" @keyup.enter="saveName" />
          <el-button text type="primary" :icon="Check" aria-label="保存群名" @click="saveName" />
        </div>
        <div v-else class="name">
          <b>{{ conv.name }}</b>
          <el-button
            v-if="canManage(conv)"
            text
            :icon="Edit"
            aria-label="修改群名"
            @click="((draft = conv.name), (editing = true))"
          />
        </div>
        <span class="sub">
          {{ conv.memberCount }} 人 · {{ dissolved ? '已解散（只读）' : `群版本 v${conv.version}` }}
        </span>
      </div>
      <section class="sec">
        <h3>
          群成员（{{ conv.memberCount }}/{{ chat.config?.maxGroupMembers ?? 200 }}）
          <el-button v-if="canManage(conv)" class="add" text type="primary" :icon="Plus" @click="emit('addMember')">
            添加
          </el-button>
        </h3>
        <div v-for="m in members" :key="m.userId" class="mem">
          <ChatAvatar :name="m.displayName" :user-id="m.userId" :size="34" />
          <div class="nm">
            {{ m.displayName }}
            <el-tag v-if="roleTag(m)" size="small" :type="m.role === 'OWNER' ? 'warning' : 'primary'" effect="light">
              {{ roleTag(m) }}
            </el-tag>
            <span v-if="m.userId === chat.myId" class="me">我</span>
            <small>{{ m.departmentName }}</small>
          </div>
          <div v-if="canActOn(m)" class="acts">
            <template v-if="role === 'OWNER'">
              <el-button text size="small" type="primary" @click="promote(m, m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')">
                {{ m.role === 'ADMIN' ? '取消管理员' : '设为管理员' }}
              </el-button>
              <el-button text size="small" type="primary" @click="transfer(m)">转让</el-button>
            </template>
            <el-button text size="small" type="danger" @click="remove(m)">移除</el-button>
          </div>
        </div>
        <p v-if="!canManage(conv)" class="tip">
          {{ dissolved ? '群已解散，成员不可再变更' : '仅群主和管理员可以管理成员' }}
        </p>
      </section>
      <section class="sec">
        <div class="line">
          消息免打扰
          <el-switch :model-value="conv.muted" @change="(v: string | number | boolean) => mute(Boolean(v))" />
        </div>
        <p class="tip">静音只影响提醒，仍会累计未读</p>
      </section>
      <section class="sec danger">
        <p v-if="dissolved" class="tip">解散后成员只能查看历史，不能发送、下载新文件</p>
        <template v-else-if="role === 'OWNER'">
          <el-button @click="ownerTransfer">转让群主</el-button>
          <el-button type="danger" @click="dissolve">解散群聊</el-button>
        </template>
        <el-button v-else type="danger" plain @click="leave">退出群聊</el-button>
      </section>
    </template>
    <template v-else>
      <div class="hero">
        <ChatAvatar :name="conv.name" :user-id="conv.peerUserId ?? ''" :size="72" />
        <div class="name">
          <b>{{ conv.name }}</b>
        </div>
        <span class="sub">{{ peer?.departmentName }}</span>
      </div>
      <section class="sec">
        <div class="line">
          消息免打扰
          <el-switch :model-value="conv.muted" @change="(v: string | number | boolean) => mute(Boolean(v))" />
        </div>
      </section>
    </template>
  </aside>
</template>

<style scoped>
.info {
  background: var(--panel-background);
  border-left: 1px solid var(--border-color);
  overflow: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 18px 16px;
  text-align: center;
}
.name {
  display: flex;
  align-items: center;
  gap: 4px;
}
.name b {
  font-size: 17px;
  color: var(--text-primary);
}
.rename {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 200px;
}
.sub {
  color: var(--text-secondary);
  font-size: 12px;
}
.sec {
  padding: 14px 18px;
  border-top: 1px solid var(--border-color);
}
.sec h3 {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}
.sec h3 .add {
  margin-left: auto;
}
.mem {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 7px 0;
}
.nm {
  flex: 1;
  min-width: 0;
  color: var(--text-primary);
}
.nm small {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
}
.me {
  color: var(--text-secondary);
  font-size: 12px;
  margin-left: 2px;
}
.acts {
  display: none;
  gap: 0;
}
.mem:hover .acts,
.mem:focus-within .acts {
  display: flex;
}
.tip {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}
.line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-primary);
}
.danger {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.danger .el-button {
  margin: 0;
  width: 100%;
}
</style>
