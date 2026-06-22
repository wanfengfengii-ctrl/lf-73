<script setup lang="ts">
import { computed } from 'vue'
import { GitCompare, Flame, Clock, AlertTriangle, Sparkles, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-vue-next'
import { useExperimentStore } from '@/stores/experimentStore'
import { calculateDeviations } from '@/composables/useExperimentReview'
import type { ParameterDeviation } from '@/types/incense'

const store = useExperimentStore()

const selectedExperiment = computed(() => store.selectedExperiment)

const deviations = computed(() => {
  const exp = selectedExperiment.value
  if (!exp) return []
  if (exp.status !== 'completed' && exp.status !== 'reviewed') return []
  return calculateDeviations(exp)
})

function getSeverityColor(severity: 'low' | 'medium' | 'high') {
  const map = {
    low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
    high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500' },
  }
  return map[severity]
}

function getDeviationIcon(deviation: ParameterDeviation) {
  if (deviation.actual > deviation.theoretical) return TrendingUp
  if (deviation.actual < deviation.theoretical) return TrendingDown
  return Minus
}

function getDeviationIconColor(deviation: ParameterDeviation) {
  if (deviation.severity === 'high') return 'text-red-500'
  if (deviation.severity === 'medium') return 'text-amber-500'
  return 'text-green-500'
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-4 py-3 bg-gradient-to-r from-violet-50 to-stone-50 border-b border-stone-100">
      <div class="flex items-center gap-2">
        <GitCompare class="w-5 h-5 text-violet-600" />
        <h3 class="font-semibold text-stone-800">理论vs实际对比</h3>
      </div>
    </div>

    <div v-if="!selectedExperiment || selectedExperiment.status === 'draft' || selectedExperiment.status === 'recording'" class="p-8 text-center">
      <GitCompare class="w-10 h-10 text-stone-300 mx-auto mb-2" />
      <p class="text-sm text-stone-400">选择已完成的实验以查看对比</p>
    </div>

    <div v-else class="p-4 space-y-4">
      <div class="p-4 rounded-lg border border-stone-100 bg-stone-50/50">
        <div class="flex items-center gap-2 mb-3">
          <Clock class="w-4 h-4 text-violet-500" />
          <span class="text-sm font-medium text-stone-700">燃烧时长对比</span>
        </div>
        <div class="flex items-center justify-center gap-3 mb-3">
          <div class="flex-1 text-center p-3 bg-white rounded-lg border border-stone-100">
            <div class="text-xs text-stone-400 mb-1">理论值</div>
            <div class="text-lg font-bold text-violet-600">
              {{ selectedExperiment.theoreticalAnalysis.estimatedBurnTime.toFixed(1) }}
              <span class="text-xs font-normal text-stone-400">分钟</span>
            </div>
          </div>
          <ArrowRight class="w-5 h-5 text-stone-300 flex-shrink-0" />
          <div class="flex-1 text-center p-3 bg-white rounded-lg border border-stone-100">
            <div class="text-xs text-stone-400 mb-1">实际值</div>
            <div class="text-lg font-bold text-stone-800">
              {{ selectedExperiment.actualResult.actualBurnTime?.toFixed(1) ?? '—' }}
              <span class="text-xs font-normal text-stone-400">分钟</span>
            </div>
          </div>
        </div>
        <div v-if="deviations.find(d => d.parameter === 'burnTime')" class="flex items-center justify-center gap-2 mb-3">
          <component
            :is="getDeviationIcon(deviations.find(d => d.parameter === 'burnTime')!)"
            :class="['w-4 h-4', getDeviationIconColor(deviations.find(d => d.parameter === 'burnTime')!)]"
          />
          <span
            :class="['text-xs font-medium px-2 py-0.5 rounded-full border', getSeverityColor(deviations.find(d => d.parameter === 'burnTime')!.severity).bg, getSeverityColor(deviations.find(d => d.parameter === 'burnTime')!.severity).border, getSeverityColor(deviations.find(d => d.parameter === 'burnTime')!.severity).text]"
          >
            偏差 {{ deviations.find(d => d.parameter === 'burnTime')!.deviationPercent.toFixed(1) }}%
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-stone-400 w-8">理论</span>
          <div class="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full bg-violet-400 transition-all duration-500"
              :style="{ width: `${Math.min(100, (selectedExperiment.theoreticalAnalysis.estimatedBurnTime / Math.max(selectedExperiment.theoreticalAnalysis.estimatedBurnTime, selectedExperiment.actualResult.actualBurnTime ?? 0)) * 100)}%` }"
            ></div>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs text-stone-400 w-8">实际</span>
          <div class="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full bg-amber-500 transition-all duration-500"
              :style="{ width: `${selectedExperiment.actualResult.actualBurnTime ? Math.min(100, (selectedExperiment.actualResult.actualBurnTime / Math.max(selectedExperiment.theoreticalAnalysis.estimatedBurnTime, selectedExperiment.actualResult.actualBurnTime)) * 100) : 0}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-3">
          <AlertTriangle class="w-4 h-4 text-amber-500" />
          <span class="text-sm font-medium text-stone-700">参数偏差明细</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="dev in deviations.filter(d => d.parameter !== 'burnTime')"
            :key="dev.parameter"
            :class="['p-3 rounded-lg border flex items-center gap-3', getSeverityColor(dev.severity).bg, getSeverityColor(dev.severity).border]"
          >
            <div :class="['w-2 h-2 rounded-full flex-shrink-0', getSeverityColor(dev.severity).bar]"></div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <component :is="getDeviationIcon(dev)" :class="['w-3.5 h-3.5', getDeviationIconColor(dev)]" />
                <span class="text-sm font-medium text-stone-800">{{ dev.label }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-stone-500">
                <span class="font-medium text-violet-600">{{ dev.theoretical.toFixed(1) }}</span>
                <ArrowRight class="w-3 h-3 text-stone-300" />
                <span class="font-medium text-stone-700">{{ dev.actual.toFixed(1) }}</span>
              </div>
            </div>
            <span
              :class="['text-xs font-semibold px-2 py-0.5 rounded-full border', getSeverityColor(dev.severity).bg, getSeverityColor(dev.severity).border, getSeverityColor(dev.severity).text]"
            >
              {{ dev.deviationPercent.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <div v-if="selectedExperiment.actualResult.flameoutRecords.length > 0">
        <div class="flex items-center gap-2 mb-3">
          <Flame class="w-4 h-4 text-red-500" />
          <span class="text-sm font-medium text-stone-700">断火记录</span>
          <span class="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
            {{ selectedExperiment.actualResult.flameoutRecords.length }} 次
          </span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(record, idx) in selectedExperiment.actualResult.flameoutRecords"
            :key="idx"
            class="p-3 rounded-lg border border-red-100 bg-red-50/50 flex items-center gap-3"
          >
            <Flame class="w-4 h-4 text-red-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="text-sm text-stone-700">
                断火位置：进度 {{ (record.pathProgress * 100).toFixed(0) }}%
              </div>
              <div v-if="record.reason" class="text-xs text-stone-500 mt-0.5">{{ record.reason }}</div>
            </div>
          </div>
          <div v-if="deviations.find(d => d.parameter === 'flameoutProbability')" class="flex items-center justify-between p-3 rounded-lg border border-stone-100 bg-stone-50/50">
            <span class="text-xs text-stone-500">断火概率对比</span>
            <div class="flex items-center gap-2 text-xs">
              <span class="font-medium text-violet-600">{{ deviations.find(d => d.parameter === 'flameoutProbability')!.theoretical.toFixed(1) }}%</span>
              <ArrowRight class="w-3 h-3 text-stone-300" />
              <span class="font-medium text-stone-700">{{ deviations.find(d => d.parameter === 'flameoutProbability')!.actual.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedExperiment.actualResult.ashLineQualityScore !== null">
        <div class="flex items-center gap-2 mb-3">
          <Sparkles class="w-4 h-4 text-amber-500" />
          <span class="text-sm font-medium text-stone-700">灰线质量对比</span>
        </div>
        <div class="p-3 rounded-lg border border-stone-100 bg-stone-50/50">
          <div class="flex items-center justify-center gap-3 mb-3">
            <div class="flex-1 text-center">
              <div class="text-xs text-stone-400 mb-1">理论值</div>
              <div class="text-lg font-bold text-violet-600">
                {{ selectedExperiment.theoreticalAnalysis.ashLineQuality.toFixed(1) }}
              </div>
            </div>
            <ArrowRight class="w-5 h-5 text-stone-300 flex-shrink-0" />
            <div class="flex-1 text-center">
              <div class="text-xs text-stone-400 mb-1">实际值</div>
              <div class="text-lg font-bold text-stone-800">
                {{ selectedExperiment.actualResult.ashLineQualityScore.toFixed(1) }}
              </div>
            </div>
          </div>
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs text-stone-400 w-8">理论</span>
              <div class="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full bg-violet-400 transition-all duration-500"
                  :style="{ width: `${selectedExperiment.theoreticalAnalysis.ashLineQuality}%` }"
                ></div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-stone-400 w-8">实际</span>
              <div class="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full bg-amber-500 transition-all duration-500"
                  :style="{ width: `${selectedExperiment.actualResult.ashLineQualityScore}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
