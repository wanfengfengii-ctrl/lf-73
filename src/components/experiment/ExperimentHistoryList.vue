<script setup lang="ts">
import { computed } from 'vue'
import { History, CheckCircle, AlertTriangle, Clock, Flame, Eye, Trash2, ChevronRight } from 'lucide-vue-next'
import { useExperimentStore } from '@/stores/experimentStore'
import { IGNITION_RESULT_LABELS, EXPERIMENT_STATUS_LABELS } from '@/types/incense'
import type { ExperimentStatus } from '@/types/incense'

const experimentStore = useExperimentStore()

const sortedExperiments = computed(() => {
  return [...experimentStore.completedExperiments].sort(
    (a, b) => b.createdAt - a.createdAt
  )
})

const totalCount = computed(() => experimentStore.completedExperiments.length)
const completedCount = computed(() => experimentStore.completedExperiments.filter(e => e.status === 'completed').length)
const reviewedCount = computed(() => experimentStore.reviewedExperiments.length)

function getStatusColor(status: ExperimentStatus) {
  const map: Record<ExperimentStatus, string> = {
    draft: 'bg-stone-100 text-stone-600 border-stone-200',
    recording: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-amber-100 text-amber-700 border-amber-200',
    reviewed: 'bg-green-100 text-green-700 border-green-200',
  }
  return map[status]
}

function getIgnitionResultColor(result: string) {
  const map: Record<string, string> = {
    full_success: 'text-green-600',
    partial_flameout: 'text-amber-600',
    complete_failure: 'text-red-600',
    delayed_ignition: 'text-blue-600',
  }
  return map[result] ?? 'text-stone-500'
}

function getIgnitionResultIcon(result: string) {
  if (result === 'full_success') return CheckCircle
  if (result === 'complete_failure') return AlertTriangle
  return Flame
}

function formatTime(timestamp: number) {
  const d = new Date(timestamp)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${mi}`
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

function isSelected(id: string) {
  return experimentStore.selectedExperimentId === id
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-4 py-3 bg-gradient-to-r from-stone-50 to-amber-50 border-b border-stone-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <History class="w-5 h-5 text-amber-600" />
          <h3 class="font-semibold text-stone-800">实验历史</h3>
        </div>
        <div class="flex items-center gap-3 text-xs text-stone-500">
          <span>共 <span class="font-semibold text-stone-700">{{ totalCount }}</span> 条</span>
          <span>已完成 <span class="font-semibold text-amber-600">{{ completedCount }}</span></span>
          <span>已复盘 <span class="font-semibold text-green-600">{{ reviewedCount }}</span></span>
        </div>
      </div>
    </div>

    <div class="p-4 space-y-2" v-if="sortedExperiments.length > 0">
      <div
        v-for="exp in sortedExperiments"
        :key="exp.id"
        :class="[
          'p-3 rounded-lg border hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer',
          isSelected(exp.id) ? 'border-amber-300 bg-amber-50/50' : 'border-stone-100'
        ]"
        @click="experimentStore.selectExperiment(exp.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-sm text-stone-800 truncate">{{ exp.name }}</span>
              <span :class="['text-[10px] px-1.5 py-0.5 rounded-full border font-medium', getStatusColor(exp.status)]">
                {{ EXPERIMENT_STATUS_LABELS[exp.status] }}
              </span>
            </div>
            <div class="flex items-center gap-1 text-xs text-stone-400 mb-2">
              <Clock class="w-3 h-3" />
              <span>{{ formatTime(exp.createdAt) }}</span>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1.5">
              <component
                :is="getIgnitionResultIcon(exp.actualResult.ignitionResult)"
                :class="['w-3.5 h-3.5', getIgnitionResultColor(exp.actualResult.ignitionResult)]"
              />
              <span :class="['text-xs font-medium', getIgnitionResultColor(exp.actualResult.ignitionResult)]">
                {{ IGNITION_RESULT_LABELS[exp.actualResult.ignitionResult as keyof typeof IGNITION_RESULT_LABELS] }}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-stone-500">
              <div class="flex items-center gap-1">
                <Flame class="w-3 h-3 text-stone-400" />
                <span>理论 {{ formatDuration(exp.theoreticalAnalysis.estimatedBurnTime) }}</span>
              </div>
              <div class="flex items-center gap-1" v-if="exp.actualResult.actualBurnTime != null">
                <Flame class="w-3 h-3 text-amber-400" />
                <span>实际 {{ formatDuration(exp.actualResult.actualBurnTime) }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              class="p-1.5 rounded-md hover:bg-amber-100 text-stone-400 hover:text-amber-600 transition-colors"
              @click.stop="experimentStore.selectExperiment(exp.id)"
            >
              <Eye class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 rounded-md hover:bg-red-100 text-stone-400 hover:text-red-500 transition-colors"
              @click.stop="experimentStore.deleteExperiment(exp.id)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="py-12 flex flex-col items-center justify-center text-stone-400">
      <History class="w-10 h-10 mb-3 text-stone-300" />
      <p class="text-sm">暂无实验记录，开始你的第一次实验吧</p>
    </div>
  </div>
</template>
