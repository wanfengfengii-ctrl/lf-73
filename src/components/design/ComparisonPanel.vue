<script setup lang="ts">
import { ref, computed } from 'vue'
import { BarChart3, X, Check, ArrowUpDown, Ruler, Clock, GitBranch, AlertTriangle, Layers, Sparkles } from 'lucide-vue-next'
import { useSchemeStore } from '@/stores/schemeStore'
import type { IncenseScheme } from '@/types/incense'
import { PIXELS_PER_CM } from '@/utils/constants'

const schemeStore = useSchemeStore()
const schemes = computed(() => schemeStore.schemes)

const showComparison = ref(false)
const selectedSchemes = ref<string[]>([])

const comparisonSchemes = computed(() => {
  return schemes.value.filter((s) => selectedSchemes.value.includes(s.id))
})

const canCompare = computed(() => {
  return selectedSchemes.value.length >= 2
})

function toggleScheme(schemeId: string) {
  const index = selectedSchemes.value.indexOf(schemeId)
  if (index === -1) {
    if (selectedSchemes.value.length < 5) {
      selectedSchemes.value.push(schemeId)
    }
  } else {
    selectedSchemes.value.splice(index, 1)
  }
}

function openComparison() {
  if (canCompare.value) {
    showComparison.value = true
  }
}

function closeComparison() {
  showComparison.value = false
}

function formatLength(px: number): string {
  const cm = px / PIXELS_PER_CM
  if (cm >= 100) {
    return (cm / 100).toFixed(2) + 'm'
  }
  return cm.toFixed(1) + 'cm'
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '—'
  const minutes = seconds / 60
  if (minutes < 60) {
    return minutes.toFixed(1) + '分'
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  return hours + '时' + remainingMinutes + '分'
}

function getBestValue(values: number[], isHigherBetter: boolean = false): number {
  if (values.length === 0) return 0
  return isHigherBetter ? Math.max(...values) : Math.min(...values)
}

const comparisonMetrics = computed(() => {
  if (comparisonSchemes.value.length === 0) return []

  const metrics = [
    {
      key: 'totalLength',
      label: '路径长度',
      icon: Ruler,
      unit: 'cm',
      isHigherBetter: false,
      values: comparisonSchemes.value.map((s) => s.analysis.totalLength / PIXELS_PER_CM),
      format: (v: number) => v.toFixed(1) + ' cm',
    },
    {
      key: 'estimatedBurnTime',
      label: '燃烧时长',
      icon: Clock,
      unit: '分钟',
      isHigherBetter: true,
      values: comparisonSchemes.value.map((s) => s.analysis.estimatedBurnTime / 60),
      format: (v: number) => v.toFixed(1) + ' 分',
    },
    {
      key: 'intersectionCount',
      label: '交叉点数量',
      icon: GitBranch,
      unit: '个',
      isHigherBetter: false,
      values: comparisonSchemes.value.map((s) => s.analysis.intersectionCount),
      format: (v: number) => v.toString(),
    },
    {
      key: 'overlapCount',
      label: '重叠区域',
      icon: Layers,
      unit: '处',
      isHigherBetter: false,
      values: comparisonSchemes.value.map((s) => s.analysis.overlaps.length),
      format: (v: number) => v.toString(),
    },
    {
      key: 'breakRiskPoints',
      label: '风险点数量',
      icon: AlertTriangle,
      unit: '个',
      isHigherBetter: false,
      values: comparisonSchemes.value.map((s) => s.analysis.breakRiskPoints.length),
      format: (v: number) => v.toString(),
    },
    {
      key: 'strokeCount',
      label: '笔画数量',
      icon: Sparkles,
      unit: '笔',
      isHigherBetter: false,
      values: comparisonSchemes.value.map((s) => {
        if (s.path.strokes && s.path.strokes.length > 0) {
          return s.path.strokes.filter((stroke) => stroke.length > 0).length
        }
        return s.path.points.length > 0 ? 1 : 0
      }),
      format: (v: number) => v.toString(),
    },
    {
      key: 'lineWidth',
      label: '香线宽度',
      icon: Ruler,
      unit: 'px',
      isHigherBetter: false,
      values: comparisonSchemes.value.map((s) => s.path.lineWidth),
      format: (v: number) => v.toString() + ' px',
    },
    {
      key: 'density',
      label: '香粉密度',
      icon: Layers,
      unit: 'g/cm³',
      isHigherBetter: true,
      values: comparisonSchemes.value.map((s) => s.path.density),
      format: (v: number) => v.toFixed(1),
    },
  ]

  return metrics.map((metric) => ({
    ...metric,
    bestValue: getBestValue(metric.values, metric.isHigherBetter),
  }))
})

const recommendations = computed(() => {
  const recs: string[] = []

  if (comparisonSchemes.value.length < 2) return recs

  const timeIndex = comparisonMetrics.value.findIndex((m) => m.key === 'estimatedBurnTime')
  if (timeIndex !== -1) {
    const bestTimeIdx = comparisonMetrics.value[timeIndex].values.indexOf(
      comparisonMetrics.value[timeIndex].bestValue
    )
    if (bestTimeIdx !== -1) {
      recs.push(
        `「${comparisonSchemes.value[bestTimeIdx].name}」燃烧时间最长（${formatTime(comparisonSchemes.value[bestTimeIdx].analysis.estimatedBurnTime)}），建议优先选择。`
      )
    }
  }

  const riskIndex = comparisonMetrics.value.findIndex((m) => m.key === 'breakRiskPoints')
  if (riskIndex !== -1) {
    const minRisk = Math.min(...comparisonMetrics.value[riskIndex].values)
    if (minRisk === 0) {
      const safeSchemes = comparisonSchemes.value.filter(
        (s) => s.analysis.breakRiskPoints.length === 0
      )
      if (safeSchemes.length > 0) {
        recs.push(
          `${safeSchemes.map((s) => '「' + s.name + '」').join('、')} 无断火风险，燃烧更稳定。`
        )
      }
    }
  }

  const intersectionIndex = comparisonMetrics.value.findIndex((m) => m.key === 'intersectionCount')
  if (intersectionIndex !== -1) {
    const intersections = comparisonMetrics.value[intersectionIndex].values
    const maxIntersections = Math.max(...intersections)
    if (maxIntersections > 5) {
      const problematic = comparisonSchemes.value.filter(
        (s) => s.analysis.intersectionCount > 5
      )
      if (problematic.length > 0) {
        recs.push(
          `${problematic.map((s) => '「' + s.name + '」').join('、')} 交叉点较多，可能影响燃烧效果。`
        )
      }
    }
  }

  const overlapIndex = comparisonMetrics.value.findIndex((m) => m.key === 'overlapCount')
  if (overlapIndex !== -1) {
    const overlaps = comparisonMetrics.value[overlapIndex].values
    const hasOverlap = overlaps.some((o) => o > 0)
    if (hasOverlap) {
      const noOverlap = comparisonSchemes.value.filter(
        (s) => s.analysis.overlaps.length === 0
      )
      if (noOverlap.length > 0) {
        recs.push(
          `${noOverlap.map((s) => '「' + s.name + '」').join('、')} 无路径重叠，香粉用量更节省。`
        )
      }
    }
  }

  return recs
})

const maxBarWidth = 200

function getBarWidth(value: number, values: number[]): number {
  const max = Math.max(...values, 1)
  return (value / max) * maxBarWidth
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 border border-stone-100">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-stone-800 flex items-center gap-2">
        <span class="w-1 h-4 bg-blue-500 rounded-full"></span>
        多方案对比
      </h3>
      <button
        @click="openComparison"
        :disabled="!canCompare"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
        :class="{
          'bg-blue-600 text-white hover:bg-blue-700': canCompare,
          'bg-stone-200 text-stone-400 cursor-not-allowed': !canCompare,
        }"
      >
        <BarChart3 class="w-4 h-4" />
        对比分析 ({{ selectedSchemes.length }})
      </button>
    </div>

    <div v-if="schemes.length === 0" class="text-center py-6 text-stone-400">
      <BarChart3 class="w-10 h-10 mx-auto mb-2 opacity-50" />
      <p class="text-sm">暂无保存的方案</p>
      <p class="text-xs mt-1">保存方案后可进行多方案对比</p>
    </div>

    <div v-else class="space-y-2">
      <p class="text-xs text-stone-500 mb-2">选择 2-5 个方案进行对比：</p>
      <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
        <div
          v-for="scheme in schemes"
          :key="scheme.id"
          @click="toggleScheme(scheme.id)"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm"
          :class="{
            'border-blue-500 bg-blue-50': selectedSchemes.includes(scheme.id),
            'border-stone-200 bg-white hover:border-stone-300': !selectedSchemes.includes(scheme.id),
            'opacity-50 cursor-not-allowed': !selectedSchemes.includes(scheme.id) && selectedSchemes.length >= 5,
          }"
        >
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
            :class="{
              'border-blue-500 bg-blue-500': selectedSchemes.includes(scheme.id),
              'border-stone-300': !selectedSchemes.includes(scheme.id),
            }"
          >
            <Check
              v-if="selectedSchemes.includes(scheme.id)"
              class="w-3 h-3 text-white"
            />
          </div>
          <span class="truncate max-w-32">{{ scheme.name }}</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showComparison"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="closeComparison"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-stone-100">
            <div>
              <h3 class="text-lg font-semibold text-stone-800 flex items-center gap-2">
                <BarChart3 class="w-5 h-5 text-blue-600" />
                多方案对比分析
              </h3>
              <p class="text-sm text-stone-500 mt-0.5">
                已选择 {{ comparisonSchemes.length }} 个方案进行对比
              </p>
            </div>
            <button
              @click="closeComparison"
              class="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="overflow-auto max-h-[calc(85vh-180px)] p-4">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="border-b-2 border-stone-200">
                    <th class="text-left p-3 text-xs font-semibold text-stone-500 bg-stone-50 sticky left-0 z-10 min-w-[140px]">
                      对比项
                    </th>
                    <th
                      v-for="scheme in comparisonSchemes"
                      :key="scheme.id"
                      class="text-center p-3 text-xs font-semibold text-stone-700 bg-stone-50 min-w-[160px]"
                    >
                      <div class="flex flex-col items-center gap-2">
                        <img
                          v-if="scheme.thumbnail"
                          :src="scheme.thumbnail"
                          :alt="scheme.name"
                          class="w-16 h-16 rounded-lg object-cover border border-stone-200"
                        />
                        <span class="truncate max-w-[120px]">{{ scheme.name }}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(metric, idx) in comparisonMetrics"
                    :key="metric.key"
                    :class="{ 'bg-stone-50': idx % 2 === 0 }"
                  >
                    <td class="p-3 text-sm text-stone-600 sticky left-0 z-10" :class="{ 'bg-stone-50': idx % 2 === 0 }">
                      <div class="flex items-center gap-2">
                        <component :is="metric.icon" class="w-4 h-4 text-stone-400" />
                        <span class="font-medium text-stone-700">{{ metric.label }}</span>
                        <span class="text-xs text-stone-400">({{ metric.unit }})</span>
                      </div>
                    </td>
                    <td
                      v-for="(value, vIdx) in metric.values"
                      :key="vIdx"
                      class="p-3 text-center"
                    >
                      <div class="flex flex-col items-center gap-1">
                        <span
                          class="text-sm font-semibold"
                          :class="{
                            'text-green-600': value === metric.bestValue,
                            'text-stone-700': value !== metric.bestValue,
                          }"
                        >
                          {{ metric.format(value) }}
                          <ArrowUpDown
                            v-if="value === metric.bestValue"
                            class="inline w-3 h-3 ml-1"
                          />
                        </span>
                        <div class="w-full flex justify-center">
                          <div
                            class="h-2 rounded-full transition-all"
                            :class="{
                              'bg-green-400': value === metric.bestValue,
                              'bg-stone-300': value !== metric.bestValue,
                            }"
                            :style="{ width: getBarWidth(value, metric.values) + 'px' }"
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="recommendations.length > 0" class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 class="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Sparkles class="w-4 h-4" />
                智能建议
              </h4>
              <ul class="space-y-2">
                <li
                  v-for="(rec, idx) in recommendations"
                  :key="idx"
                  class="text-sm text-blue-700 flex items-start gap-2"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                  {{ rec }}
                </li>
              </ul>
            </div>
          </div>

          <div class="p-4 border-t border-stone-100 bg-stone-50 flex justify-end">
            <button
              @click="closeComparison"
              class="px-4 py-2 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
