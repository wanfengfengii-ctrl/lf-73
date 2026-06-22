<script setup lang="ts">
import { computed } from 'vue'
import { Activity, AlertTriangle, Sparkles, Clock, Trophy, Zap, Flame } from 'lucide-vue-next'
import { useEnvironmentAdaptationStore } from '@/stores/environmentAdaptationStore'

const store = useEnvironmentAdaptationStore()

const scoreLevel = computed(() => {
  const score = store.adaptationResult.overallScore
  if (score >= 85) return { label: '优秀', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
  if (score >= 70) return { label: '良好', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
  if (score >= 50) return { label: '一般', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' }
  return { label: '较差', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
})

function getMetricColor(value: number, isInverted = false) {
  const v = isInverted ? 100 - value : value
  if (v >= 80) return { text: 'text-green-700', bg: 'bg-green-500', lightBg: 'bg-green-100' }
  if (v >= 60) return { text: 'text-amber-700', bg: 'bg-amber-500', lightBg: 'bg-amber-100' }
  if (v >= 40) return { text: 'text-orange-700', bg: 'bg-orange-500', lightBg: 'bg-orange-100' }
  return { text: 'text-red-700', bg: 'bg-red-500', lightBg: 'bg-red-100' }
}

function handleOptimize() {
  store.applyOptimizedRecipe()
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-4 py-3 bg-gradient-to-r from-green-50 to-amber-50 border-b border-stone-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Activity class="w-5 h-5 text-green-600" />
          <h3 class="font-semibold text-stone-800">适配分析</h3>
        </div>
        <button
          @click="handleOptimize"
          class="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-md shadow-sm transition-all"
        >
          <Zap class="w-3.5 h-3.5" />
          智能调优
        </button>
      </div>
    </div>

    <div class="p-4">
      <div :class="['p-4 rounded-xl border mb-4', scoreLevel.bg, scoreLevel.border]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="['w-14 h-14 rounded-full flex items-center justify-center', scoreLevel.bg, scoreLevel.border, 'border-2']">
              <Trophy :class="['w-7 h-7', scoreLevel.color]" />
            </div>
            <div>
              <div class="text-xs text-stone-500">综合适配评分</div>
              <div :class="['text-2xl font-bold', scoreLevel.color]">
                {{ store.adaptationResult.overallScore.toFixed(0) }}
                <span class="text-sm font-normal text-stone-400">/ 100</span>
              </div>
            </div>
          </div>
          <div :class="['px-3 py-1 rounded-full text-sm font-semibold', scoreLevel.bg, scoreLevel.color]">
            {{ scoreLevel.label }}
          </div>
        </div>
        <div class="mt-3 h-2.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-500', getMetricColor(store.adaptationResult.overallScore).bg]"
            :style="{ width: `${store.adaptationResult.overallScore}%` }"
          ></div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div :class="['p-3 rounded-lg border', getMetricColor(store.adaptationResult.combustionStability).lightBg, 'border-stone-100']">
          <div class="flex items-center gap-1.5 mb-1">
            <Flame class="w-4 h-4 text-orange-500" />
            <span class="text-xs text-stone-600">燃烧稳定性</span>
          </div>
          <div :class="['text-xl font-bold', getMetricColor(store.adaptationResult.combustionStability).text]">
            {{ store.adaptationResult.combustionStability.toFixed(0) }}%
          </div>
          <div class="mt-2 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-500', getMetricColor(store.adaptationResult.combustionStability).bg]"
              :style="{ width: `${store.adaptationResult.combustionStability}%` }"
            ></div>
          </div>
        </div>

        <div :class="['p-3 rounded-lg border', getMetricColor(store.adaptationResult.flameoutProbability, true).lightBg, 'border-stone-100']">
          <div class="flex items-center gap-1.5 mb-1">
            <AlertTriangle class="w-4 h-4 text-red-500" />
            <span class="text-xs text-stone-600">断火概率</span>
          </div>
          <div :class="['text-xl font-bold', getMetricColor(store.adaptationResult.flameoutProbability, true).text]">
            {{ store.adaptationResult.flameoutProbability.toFixed(0) }}%
          </div>
          <div class="mt-2 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-500', getMetricColor(100 - store.adaptationResult.flameoutProbability).bg]"
              :style="{ width: `${store.adaptationResult.flameoutProbability}%` }"
            ></div>
          </div>
        </div>

        <div :class="['p-3 rounded-lg border', getMetricColor(store.adaptationResult.ashLineQuality).lightBg, 'border-stone-100']">
          <div class="flex items-center gap-1.5 mb-1">
            <Sparkles class="w-4 h-4 text-amber-500" />
            <span class="text-xs text-stone-600">灰线成型</span>
          </div>
          <div :class="['text-xl font-bold', getMetricColor(store.adaptationResult.ashLineQuality).text]">
            {{ store.adaptationResult.ashLineQuality.toFixed(0) }}%
          </div>
          <div class="mt-2 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-500', getMetricColor(store.adaptationResult.ashLineQuality).bg]"
              :style="{ width: `${store.adaptationResult.ashLineQuality}%` }"
            ></div>
          </div>
        </div>

        <div :class="['p-3 rounded-lg border', getMetricColor(store.adaptationResult.burnTimeDeviation, true).lightBg, 'border-stone-100']">
          <div class="flex items-center gap-1.5 mb-1">
            <Clock class="w-4 h-4 text-blue-500" />
            <span class="text-xs text-stone-600">燃烧偏差</span>
          </div>
          <div :class="['text-xl font-bold', getMetricColor(store.adaptationResult.burnTimeDeviation, true).text]">
            ±{{ store.adaptationResult.burnTimeDeviation.toFixed(0) }}%
          </div>
          <div class="mt-2 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-500', getMetricColor(100 - store.adaptationResult.burnTimeDeviation * 2).bg]"
              :style="{ width: `${Math.min(store.adaptationResult.burnTimeDeviation * 2, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
