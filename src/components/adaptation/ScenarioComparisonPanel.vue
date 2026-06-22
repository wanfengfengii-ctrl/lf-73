<script setup lang="ts">
import { computed } from 'vue'
import { BarChart3, Flame, AlertTriangle, Sparkles, Clock, CheckCircle, MapPin } from 'lucide-vue-next'
import { useEnvironmentAdaptationStore } from '@/stores/environmentAdaptationStore'

const store = useEnvironmentAdaptationStore()

const sortedScenarios = computed(() => {
  return [...store.scenarioAnalysis].sort(
    (a, b) => b.result.overallScore - a.result.overallScore
  )
})

const bestScenario = computed(() => sortedScenarios.value[0])

function getScoreColor(score: number) {
  if (score >= 85) return 'text-green-700 bg-green-50 border-green-200'
  if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-200'
  if (score >= 50) return 'text-orange-700 bg-orange-50 border-orange-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

function getBarColor(score: number) {
  if (score >= 85) return 'bg-green-500'
  if (score >= 70) return 'bg-amber-500'
  if (score >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-4 py-3 bg-gradient-to-r from-indigo-50 to-stone-50 border-b border-stone-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-indigo-600" />
          <h3 class="font-semibold text-stone-800">多场景适配对比</h3>
        </div>
        <div v-if="bestScenario" class="text-xs text-stone-500">
          最佳场景：<span class="font-semibold text-green-600">{{ bestScenario.name }}</span>
        </div>
      </div>
    </div>

    <div class="p-4 space-y-3">
      <div
        v-for="scenario in sortedScenarios"
        :key="scenario.name"
        class="p-3 rounded-lg border border-stone-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer group"
        @click="store.setEnvironment(scenario.params)"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div :class="['w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border', getScoreColor(scenario.result.overallScore)]">
              {{ scenario.result.overallScore.toFixed(0) }}
            </div>
            <div>
              <div class="font-medium text-sm text-stone-800 flex items-center gap-1.5">
                {{ scenario.name }}
                <CheckCircle v-if="scenario.name === bestScenario?.name" class="w-3.5 h-3.5 text-green-500" />
              </div>
              <div class="text-xs text-stone-500">{{ scenario.description }}</div>
            </div>
          </div>
          <MapPin class="w-4 h-4 text-stone-300 group-hover:text-amber-500 transition-colors" />
        </div>

        <div class="h-2 bg-stone-100 rounded-full overflow-hidden mb-2">
          <div
            :class="['h-full rounded-full transition-all duration-500', getBarColor(scenario.result.overallScore)]"
            :style="{ width: `${scenario.result.overallScore}%` }"
          ></div>
        </div>

        <div class="grid grid-cols-4 gap-2">
          <div class="text-center">
            <div class="flex items-center justify-center gap-0.5 text-xs text-stone-400 mb-0.5">
              <Flame class="w-3 h-3" />
              <span>稳定</span>
            </div>
            <div class="text-sm font-semibold text-stone-700">{{ scenario.result.combustionStability.toFixed(0) }}</div>
          </div>
          <div class="text-center">
            <div class="flex items-center justify-center gap-0.5 text-xs text-stone-400 mb-0.5">
              <AlertTriangle class="w-3 h-3" />
              <span>断火</span>
            </div>
            <div class="text-sm font-semibold text-stone-700">{{ scenario.result.flameoutProbability.toFixed(0) }}%</div>
          </div>
          <div class="text-center">
            <div class="flex items-center justify-center gap-0.5 text-xs text-stone-400 mb-0.5">
              <Sparkles class="w-3 h-3" />
              <span>灰线</span>
            </div>
            <div class="text-sm font-semibold text-stone-700">{{ scenario.result.ashLineQuality.toFixed(0) }}</div>
          </div>
          <div class="text-center">
            <div class="flex items-center justify-center gap-0.5 text-xs text-stone-400 mb-0.5">
              <Clock class="w-3 h-3" />
              <span>偏差</span>
            </div>
            <div class="text-sm font-semibold text-stone-700">±{{ scenario.result.burnTimeDeviation.toFixed(0) }}%</div>
          </div>
        </div>

        <div class="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <div class="flex items-center gap-3">
            <span>湿度 {{ scenario.params.humidity }}%</span>
            <span>温度 {{ scenario.params.temperature }}°C</span>
          </div>
          <div class="flex items-center gap-3">
            <span>气流 {{ scenario.params.airflow }}级</span>
            <span>灰床 {{ scenario.params.ashBedThickness }}mm</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
