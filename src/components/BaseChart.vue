<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use, type ECharts, type EChartsCoreOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const props = withDefaults(defineProps<{
  option: EChartsCoreOption
  loading?: boolean
  empty?: boolean
  emptyText?: string
}>(), {
  loading: false,
  empty: false,
  emptyText: '暂无数据',
})

const chartEl = ref<HTMLElement>()
let chart: ECharts | undefined
let observer: ResizeObserver | undefined

const render = async () => {
  await nextTick()
  if (!chartEl.value || props.empty) return
  chart ??= init(chartEl.value)
  chart.setOption(props.option, { notMerge: true })
  chart.resize()
}

watch(() => [props.option, props.empty] as const, render, { deep: true })
watch(() => props.loading, loading => {
  if (loading) chart?.showLoading('default')
  else chart?.hideLoading()
})

onMounted(() => {
  render()
  if (chartEl.value) {
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(chartEl.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
})
</script>

<template>
  <div class="base-chart">
    <div v-show="!empty" ref="chartEl" class="base-chart__canvas" />
    <el-empty v-if="empty" :description="emptyText" :image-size="72" />
  </div>
</template>

<style scoped>
.base-chart { width: 100%; height: 100%; min-height: 260px; }
.base-chart__canvas { width: 100%; height: 100%; min-height: inherit; }
.base-chart :deep(.el-empty) { height: 100%; padding: 20px 0; }
</style>
