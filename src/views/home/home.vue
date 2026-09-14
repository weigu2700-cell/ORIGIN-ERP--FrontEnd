<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { EChartsCoreOption } from 'echarts/core'
import { ArrowRight, Box, DataAnalysis, Goods, Refresh, ShoppingCart, Van } from '@element-plus/icons-vue'
import BaseChart from '@/components/BaseChart.vue'
import { getDashboardOverview, type DashboardOverview } from '@/api/dashboard'
import { formatDate } from '@/composables/useFormat'

defineOptions({ name: 'BusinessDashboard' })

const loading = ref(false)
const loadError = ref(false)
const overview = ref<DashboardOverview>({
  metrics: {
    pendingDemand: 0,
    draftProduction: 0,
    productionInProgress: 0,
    draftPurchase: 0,
    purchaseInTransit: 0,
    salesToDeliver: 0,
  },
  productionStatus: [],
  recentOrders: [],
  failedRequests: 0,
})

const today = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date()),
)

const metrics = computed(() => [
  {
    label: '待生产需求',
    value: overview.value.metrics.pendingDemand,
    note: '等待安排生产',
    icon: DataAnalysis,
    tone: 'blue',
    path: '/product/productionDemand',
  },
  {
    label: '生产中订单',
    value: overview.value.metrics.productionInProgress,
    note: `另有 ${overview.value.metrics.draftProduction} 张草稿`,
    icon: Box,
    tone: 'violet',
    path: '/product/productionOrder',
  },
  {
    label: '采购在途',
    value: overview.value.metrics.purchaseInTransit,
    note: `${overview.value.metrics.draftPurchase} 张待审批`,
    icon: Van,
    tone: 'orange',
    path: '/purchase/purchaseOrder',
  },
  {
    label: '销售待发货',
    value: overview.value.metrics.salesToDeliver,
    note: '已确认销售订单',
    icon: ShoppingCart,
    tone: 'green',
    path: '/sales/salesOrder',
  },
])

const taskOption = computed<EChartsCoreOption>(() => ({
  color: ['#245b78'],
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 16, right: 24, top: 12, bottom: 8, containLabel: true },
  xAxis: {
    type: 'value',
    minInterval: 1,
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#dce7eb' } },
  },
  yAxis: {
    type: 'category',
    data: ['销售待发货', '采购待审批', '采购在途', '生产草稿', '生产中', '待生产需求'],
    axisTick: { show: false },
    axisLine: { show: false },
  },
  series: [
    {
      type: 'bar',
      barWidth: 14,
      itemStyle: { borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', color: '#475569' },
      data: [
        overview.value.metrics.salesToDeliver,
        overview.value.metrics.draftPurchase,
        overview.value.metrics.purchaseInTransit,
        overview.value.metrics.draftProduction,
        overview.value.metrics.productionInProgress,
        overview.value.metrics.pendingDemand,
      ],
    },
  ],
}))

const productionOption = computed<EChartsCoreOption>(() => ({
  color: ['#afc0c7', '#245b78', '#d99a2b', '#27845f', '#b85c58'],
  tooltip: { trigger: 'item', formatter: '{b}<br/>{c} 张（{d}%）' },
  legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748b' } },
  series: [
    {
      type: 'pie',
      radius: ['48%', '70%'],
      center: ['50%', '43%'],
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}\n{c}', color: '#49606d' },
      data: overview.value.productionStatus,
    },
  ],
}))

const productionEmpty = computed(() => overview.value.productionStatus.every((item) => item.value === 0))

const syncStatus = computed(() => {
  if (loadError.value) return '同步异常'
  if (overview.value.failedRequests) return '部分同步异常'
  return '数据连接正常'
})

const quickLinks = [
  {
    title: '生产需求',
    description: '安排待生产任务',
    path: '/product/productionDemand',
    icon: DataAnalysis,
  },
  {
    title: '生产订单',
    description: '跟踪生产执行',
    path: '/product/productionOrder',
    icon: Box,
  },
  {
    title: '采购订单',
    description: '处理采购进度',
    path: '/purchase/purchaseOrder',
    icon: ShoppingCart,
  },
  {
    title: '库存流水',
    description: '追踪库存变化',
    path: '/inventory/transaction',
    icon: Goods,
  },
]

const loadData = async () => {
  loading.value = true
  loadError.value = false
  try {
    overview.value = await getDashboardOverview()
    loadError.value = overview.value.failedRequests === 11
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="home-container" v-loading="loading">
    <section class="welcome-panel" :class="{ 'is-warning': loadError || overview.failedRequests }">
      <div>
        <p class="eyebrow">ORIGIN ERP / 业务工作台</p>
        <h1>今日业务概览</h1>
        <p class="welcome-date">{{ today }} · 数据来自当前业务单据</p>
      </div>
      <div class="welcome-actions">
        <span class="sync-status">
          <i :class="{ 'is-warning': loadError || overview.failedRequests }" />
          {{ syncStatus }}
        </span>
        <el-button :icon="Refresh" :loading="loading" @click="loadData">刷新数据</el-button>
      </div>
    </section>

    <el-alert
      v-if="loadError"
      title="工作台数据暂时无法加载，请检查后端服务"
      type="warning"
      show-icon
      :closable="false"
    />
    <el-alert
      v-else-if="overview.failedRequests"
      :title="`${overview.failedRequests} 项数据加载失败，其余数据已正常展示`"
      type="warning"
      show-icon
      :closable="false"
    />

    <section class="metric-grid" aria-label="核心待办">
      <router-link
        v-for="metric in metrics"
        :key="metric.label"
        :to="metric.path"
        class="metric-card"
        :class="{ 'is-actionable': metric.value > 0 }"
      >
        <span class="metric-icon" :class="`metric-icon--${metric.tone}`">
          <component :is="metric.icon" />
        </span>
        <span class="metric-content">
          <small>{{ metric.label }}</small>
          <strong>{{ metric.value.toLocaleString() }}</strong>
          <em>{{ metric.note }}</em>
        </span>
        <el-icon class="metric-card-arrow">
          <ArrowRight />
        </el-icon>
      </router-link>
    </section>

    <section class="chart-grid">
      <el-card class="dashboard-card" shadow="never">
        <template #header>
          <div class="card-heading">
            <div>
              <strong>核心业务待办</strong>
              <span>需要继续处理的生产、采购与销售单据</span>
            </div>
          </div>
        </template>
        <BaseChart :option="taskOption" :loading="loading" />
      </el-card>
      <el-card class="dashboard-card" shadow="never">
        <template #header>
          <div class="card-heading">
            <div>
              <strong>生产订单状态</strong>
              <span>全部生产订单的流程分布</span>
            </div>
          </div>
        </template>
        <BaseChart
          :option="productionOption"
          :loading="loading"
          :empty="productionEmpty && !loading"
          empty-text="暂无生产订单"
        />
      </el-card>
    </section>

    <section class="lower-grid">
      <el-card class="dashboard-card" shadow="never">
        <template #header>
          <div class="card-heading">
            <div>
              <strong>最近业务单据</strong>
              <span>最新生产订单与采购订单</span>
            </div>
          </div>
        </template>
        <div v-if="overview.recentOrders.length" class="order-list">
          <router-link v-for="item in overview.recentOrders" :key="item.id" :to="item.path" class="order-item">
            <i :class="`is-${item.tone}`" />
            <span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.detail }}</small>
            </span>
            <time>{{ formatDate.DateTime(item.time) }}</time>
          </router-link>
        </div>
        <el-empty v-else description="暂无业务单据" :image-size="64" />
      </el-card>
      <el-card class="dashboard-card" shadow="never">
        <template #header>
          <div class="card-heading">
            <div>
              <strong>常用入口</strong>
              <span>进入日常业务处理页面</span>
            </div>
          </div>
        </template>
        <div class="quick-links">
          <router-link v-for="link in quickLinks" :key="link.path" :to="link.path" class="quick-link">
            <span>
              <component :is="link.icon" />
            </span>
            <div>
              <strong>{{ link.title }}</strong>
              <small>{{ link.description }}</small>
            </div>
          </router-link>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-panel {
  position: relative;
  min-height: 128px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(118deg, #18384b 0%, #245b78 72%, #2f7084 100%);
  box-shadow: 0 12px 28px rgb(21 66 86 / 14%);
}

.welcome-panel::after {
  content: '';
  position: absolute;
  width: 280px;
  height: 280px;
  right: -90px;
  bottom: -190px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 50%;
  pointer-events: none;
}

.welcome-panel.is-warning {
  background: linear-gradient(118deg, #18384b 0%, #245b78 64%, #6e5b32 100%);
}

.eyebrow {
  margin: 0 0 5px;
  color: #f2c16a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

h1 {
  margin: 0;
  color: #fff;
  font-size: 26px;
  font-weight: 700;
}

.welcome-date {
  margin: 5px 0 0;
  color: rgb(255 255 255 / 70%);
  font-size: 12px;
}

.welcome-actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 14px;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgb(255 255 255 / 76%);
  font-size: 12px;
}

.sync-status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #70c89b;
}

.sync-status i.is-warning {
  background: #f2c16a;
}

.welcome-panel :deep(.el-button) {
  color: #fff;
  border-color: rgb(255 255 255 / 34%);
  background: rgb(255 255 255 / 10%);
}

.welcome-panel :deep(.el-button:hover),
.welcome-panel :deep(.el-button:focus-visible) {
  color: #18384b;
  border-color: #fff;
  background: #fff;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  position: relative;
  min-width: 0;
  min-height: 98px;
  padding: 17px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--panel-background);
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow-panel);
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
}

.metric-card:hover {
  border-color: #9db8c5;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgb(31 75 95 / 10%);
}

.metric-card.is-actionable {
  border-color: #c2d6dd;
}

.metric-card-arrow {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #9aadb6;
  font-size: 14px;
}

.metric-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  font-size: 18px;
}

.metric-icon--blue {
  color: #245b78;
  background: #e6f1f4;
}

.metric-icon--violet {
  color: #245b78;
  background: #e6f1f4;
}

.metric-icon--orange {
  color: #9a6612;
  background: #fff4de;
}

.metric-icon--green {
  color: #059669;
  background: #ecfdf5;
}

.metric-content {
  min-width: 0;
  padding-right: 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 3px 8px;
}

.metric-content small,
.metric-content em {
  color: var(--text-secondary);
  font-size: 11px;
  font-style: normal;
}

.metric-content strong {
  color: var(--text-primary);
  font-size: 23px;
  font-variant-numeric: tabular-nums;
}

.metric-card.is-actionable .metric-content strong {
  color: var(--color-primary);
}

.metric-content em {
  grid-column: 1 / -1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-grid,
.lower-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  gap: 14px;
}

.lower-grid {
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
}

.dashboard-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--panel-background);
  box-shadow: var(--shadow-panel);
}

.dashboard-card :deep(.el-card__header) {
  padding: 15px 18px;
  border-bottom: 1px solid var(--border-color);
}

.dashboard-card :deep(.el-card__body) {
  padding: 14px 18px;
}

.card-heading > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-heading strong {
  color: var(--text-primary);
  font-size: 15px;
}

.card-heading span {
  color: var(--text-secondary);
  font-size: 12px;
}

.chart-grid .dashboard-card {
  min-height: 340px;
}

.chart-grid .dashboard-card :deep(.el-card__body) {
  height: 286px;
}

.order-list {
  display: flex;
  flex-direction: column;
}

.order-item {
  min-height: 58px;
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  border-bottom: 1px solid var(--border-color);
  color: inherit;
  text-decoration: none;
}

.order-item:last-child {
  border-bottom: 0;
}

.order-item > i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
}

.order-item > i.is-purchase {
  background: #d97706;
}

.order-item > span {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-item strong {
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
}

.order-item small,
.order-item time {
  color: var(--text-secondary);
  font-size: 11px;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.quick-link {
  min-height: 76px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
}

.quick-link:hover {
  border-color: #9db8c5;
  background: var(--page-background);
}

.quick-link > span {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.quick-link > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.quick-link strong {
  color: var(--text-primary);
  font-size: 12px;
}

.quick-link small {
  color: var(--text-secondary);
  font-size: 10px;
}

@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-grid,
  .lower-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .metric-grid,
  .quick-links {
    grid-template-columns: 1fr;
  }

  .welcome-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-item {
    grid-template-columns: 8px 1fr;
  }

  .order-item time {
    display: none;
  }
}
</style>
