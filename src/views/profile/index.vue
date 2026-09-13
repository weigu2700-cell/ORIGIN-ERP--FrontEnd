<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, Grid, Lock, OfficeBuilding, Phone, Refresh, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getSystemActivity, recordSystemActivity, type ActivityCounts } from '@/utils/systemActivity'

defineOptions({ name: 'ProfilePage' })

const userStore = useUserStore()
const refreshing = ref(false)
const activityCounts = ref<ActivityCounts>({})
const userInfo = computed(() => userStore.userInfo)
const displayName = computed(() => userInfo.value.realName?.trim() || userInfo.value.username || '用户')
const initials = computed(() => displayName.value.slice(0, 1).toUpperCase())

const accountItems = computed(() => [
  { label: '登录账号', value: userInfo.value.username || '-', icon: User },
  { label: '所属部门', value: userInfo.value.deptName || '未分配部门', icon: OfficeBuilding },
  { label: '联系电话', value: userInfo.value.phone || '暂未维护', icon: Phone },
])

const activityDays = computed(() => {
  const days: Array<{ date: string; count: number; level: number }> = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 83)
  for (let index = 0; index < 84; index += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const count = activityCounts.value[key] ?? 0
    days.push({ date: key, count, level: count === 0 ? 0 : Math.min(Math.ceil(count / 2), 4) })
  }
  return days
})

const activityTotal = computed(() => activityDays.value.reduce((total, day) => total + day.count, 0))
const activeDays = computed(() => activityDays.value.filter((day) => day.count > 0).length)

const refreshProfile = async () => {
  refreshing.value = true
  const success = await userStore.getUserInfo()
  refreshing.value = false
  if (success) ElMessage.success('个人信息已刷新')
}

onMounted(() => {
  recordSystemActivity()
  activityCounts.value = getSystemActivity()
})
</script>

<template>
  <div class="profile-page">
    <section class="profile-hero">
      <div class="hero-orb hero-orb--one"></div>
      <div class="hero-orb hero-orb--two"></div>
      <div class="profile-intro">
        <el-avatar :size="72" class="profile-avatar">{{ initials }}</el-avatar>
        <div>
          <p class="eyebrow">个人中心</p>
          <h1>{{ displayName }}，你好</h1>
          <p class="hero-description">管理你的账户信息与登录安全设置。</p>
        </div>
      </div>
      <el-button class="refresh-button" :loading="refreshing" plain @click="refreshProfile">
        <el-icon>
          <Refresh />
        </el-icon>
        刷新信息
      </el-button>
    </section>

    <main class="profile-content">
      <section class="profile-card account-card">
        <header class="card-header">
          <div>
            <p class="card-kicker">ACCOUNT</p>
            <h2>账户信息</h2>
          </div>
          <el-tag type="success" effect="light" round>
            <el-icon>
              <CircleCheck />
            </el-icon>
            当前账户正常
          </el-tag>
        </header>
        <div class="account-grid">
          <div v-for="item in accountItems" :key="item.label" class="account-item">
            <span class="account-icon">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
            </span>
            <div>
              <span class="account-label">{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </div>
      </section>

      <aside class="profile-card security-card">
        <header class="card-header">
          <div>
            <p class="card-kicker">SECURITY</p>
            <h2>账户安全</h2>
          </div>
          <el-icon class="security-lock">
            <Lock />
          </el-icon>
        </header>
        <div class="security-status">
          <span class="security-ring">
            <el-icon>
              <CircleCheck />
            </el-icon>
          </span>
          <div>
            <strong>账户状态良好</strong>
            <p>建议定期更新密码，避免与其他系统共用。</p>
          </div>
        </div>
        <el-alert title="密码修改请联系系统管理员" type="info" :closable="false" show-icon />
      </aside>

      <section class="profile-card tips-card">
        <header class="card-header">
          <div>
            <p class="card-kicker">WORKSPACE</p>
            <h2>使用提示</h2>
          </div>
          <el-icon class="tips-icon">
            <Grid />
          </el-icon>
        </header>
        <ul class="tips-list">
          <li>
            <span>01</span>
            使用顶部搜索可快速定位菜单与业务功能。
          </li>
          <li>
            <span>02</span>
            可在右上角外观设置中选择主题与品牌配色。
          </li>
          <li>
            <span>03</span>
            如需变更部门、角色或手机号，请联系系统管理员。
          </li>
        </ul>
      </section>

      <section class="profile-card activity-card">
        <header class="card-header activity-header">
          <div>
            <p class="card-kicker">ACTIVITY</p>
            <h2>系统访问热力图</h2>
            <p class="activity-subtitle">最近 12 周的本浏览器 ERP 访问频次</p>
          </div>
          <div class="activity-summary">
            <span>
              <strong>{{ activityTotal }}</strong>
              次访问
            </span>
            <span>
              <strong>{{ activeDays }}</strong>
              个活跃日
            </span>
          </div>
        </header>
        <div class="heatmap-wrap">
          <div class="weekday-labels" aria-hidden="true">
            <span>一</span>
            <span>三</span>
            <span>五</span>
          </div>
          <div class="heatmap-grid">
            <span
              v-for="day in activityDays"
              :key="day.date"
              class="heatmap-cell"
              :class="`heatmap-cell--${day.level}`"
              :title="`${day.date}：${day.count} 次访问`"
            ></span>
          </div>
        </div>
        <footer class="heatmap-footer">
          <span>较少</span>
          <span class="heatmap-legend" aria-label="访问频次颜色图例">
            <i v-for="level in 5" :key="level" :class="`heatmap-cell--${level - 1}`"></i>
          </span>
          <span>较多</span>
          <span class="heatmap-note">数据仅保存在当前浏览器</span>
        </footer>
      </section>
    </main>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100%;
  max-width: 100%;
  margin: 0 auto 28px;
}

.profile-hero {
  position: relative;
  min-height: 176px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 34px 40px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(118deg, var(--color-primary), #3483e8 58%, #72aef2);
  box-shadow: 0 12px 30px rgb(21 84 162 / 18%);
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  background: rgb(255 255 255 / 10%);
  pointer-events: none;
}

.hero-orb--one {
  width: 250px;
  height: 250px;
  right: -70px;
  top: -130px;
}

.hero-orb--two {
  width: 170px;
  height: 170px;
  right: 180px;
  bottom: -110px;
}

.profile-intro {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar {
  color: var(--color-primary);
  background: #fff;
  font-size: 27px;
  font-weight: 700;
  box-shadow: 0 5px 16px rgb(0 0 0 / 12%);
}

.eyebrow,
.card-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 1.4px;
  font-weight: 700;
  opacity: 0.72;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 7px;
  font-size: 26px;
  letter-spacing: 0.2px;
}

.hero-description {
  margin-bottom: 0;
  color: rgb(255 255 255 / 82%);
  font-size: 14px;
}

.refresh-button {
  position: relative;
  z-index: 1;
  color: #fff;
  border-color: rgb(255 255 255 / 55%);
  background: rgb(255 255 255 / 10%);
}

.refresh-button:hover {
  color: #fff;
  border-color: #fff;
  background: rgb(255 255 255 / 20%);
}

.profile-content {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(290px, 0.9fr);
  gap: 18px;
  margin-top: 18px;
}

.profile-card {
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--panel-background);
  box-shadow: 0 4px 12px rgb(15 23 42 / 3%);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.card-header h2 {
  margin-bottom: 0;
  color: var(--text-primary);
  font-size: 18px;
}

.card-kicker {
  color: var(--color-primary);
  opacity: 1;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.account-item {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 10px;
  background: var(--page-background);
}

.account-icon {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 9px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 11%, transparent);
}

.account-item div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.account-label {
  color: var(--text-secondary);
  font-size: 12px;
}

.account-item strong {
  overflow: hidden;
  color: var(--text-primary);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.security-card {
  display: flex;
  flex-direction: column;
}

.security-lock,
.tips-icon {
  color: var(--color-primary);
  font-size: 22px;
}

.security-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.security-ring {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 50%;
  color: #32a56a;
  background: #edfbf3;
  font-size: 22px;
}

.security-status strong {
  color: var(--text-primary);
  font-size: 14px;
}

.security-status p {
  margin: 5px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.tips-card {
  grid-column: 1 / -1;
}

.tips-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tips-list li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.65;
}

.tips-list span {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.activity-card {
  grid-column: 1 / -1;
}

.activity-header {
  align-items: flex-end;
  margin-bottom: 18px;
}

.activity-subtitle {
  margin: 7px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.activity-summary {
  display: flex;
  gap: 18px;
  color: var(--text-secondary);
  font-size: 12px;
}

.activity-summary strong {
  margin-right: 4px;
  color: var(--text-primary);
  font-size: 20px;
}

.heatmap-wrap {
  display: flex;
  gap: 9px;
  width: 100%;
  min-height: 176px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--page-background);
}

.weekday-labels {
  display: grid;
  grid-template-rows: repeat(7, 20px);
  gap: 5px;
  padding: 2px 3px 0 0;
  color: var(--text-secondary);
  font-size: 10px;
  line-height: 20px;
}

.weekday-labels span:nth-child(1) {
  grid-row: 2;
}

.weekday-labels span:nth-child(2) {
  grid-row: 4;
}

.weekday-labels span:nth-child(3) {
  grid-row: 6;
}

.heatmap-grid {
  display: grid;
  flex: 1;
  grid-auto-flow: column;
  grid-auto-columns: minmax(20px, 1fr);
  grid-template-rows: repeat(7, 20px);
  gap: 5px;
}

.heatmap-cell,
.heatmap-legend i {
  display: block;
  min-width: 0;
  height: 20px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--border-color) 65%, transparent);
}

.heatmap-cell--1 {
  background: color-mix(in srgb, var(--color-primary) 28%, var(--panel-background));
}

.heatmap-cell--2 {
  background: color-mix(in srgb, var(--color-primary) 48%, var(--panel-background));
}

.heatmap-cell--3 {
  background: color-mix(in srgb, var(--color-primary) 72%, var(--panel-background));
}

.heatmap-cell--4 {
  background: var(--color-primary);
}

.heatmap-footer {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 14px 0 0 27px;
  color: var(--text-secondary);
  font-size: 11px;
}

.heatmap-legend {
  display: flex;
  gap: 3px;
}

.heatmap-legend i {
  width: 12px;
  height: 12px;
}

.heatmap-note {
  margin-left: auto;
}

@media (max-width: 820px) {
  .profile-hero {
    align-items: flex-start;
    gap: 22px;
    flex-direction: column;
    padding: 28px 24px;
  }

  .profile-content {
    grid-template-columns: 1fr;
  }

  .account-grid,
  .tips-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .profile-intro {
    align-items: flex-start;
    gap: 14px;
  }

  .profile-avatar {
    flex: 0 0 auto;
  }

  h1 {
    font-size: 22px;
  }

  .profile-card {
    padding: 20px;
  }
}
</style>
