<script setup lang="ts">
import { computed } from 'vue'
import {
  FileCheck,
  Trophy,
  Lightbulb,
  Tag,
  ChevronRight,
  Droplets,
  Layers,
  Leaf,
  Hand,
  Info,
  Zap,
  RotateCcw,
  Star,
} from 'lucide-vue-next'
import { useExperimentStore } from '@/stores/experimentStore'
import { generateReview, calculateStabilityScore } from '@/composables/useExperimentReview'
import type { OptimizationSuggestion } from '@/types/incense'

const experimentStore = useExperimentStore()

const selectedExperiment = computed(() => experimentStore.selectedExperiment)

const hasReview = computed(() => !!selectedExperiment.value?.review)

const stabilityScore = computed(() => calculateStabilityScore(experimentStore.reviewedExperiments))

function generateNewReview() {
  if (!selectedExperiment.value) return
  const review = generateReview(selectedExperiment.value, experimentStore.experiments)
  experimentStore.addReview(selectedExperiment.value.id, review)
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'environment':
      return Droplets
    case 'ashbed':
      return Layers
    case 'recipe':
      return Leaf
    case 'technique':
      return Hand
    default:
      return Info
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'environment':
      return 'bg-sky-100 text-sky-700 border-sky-200'
    case 'ashbed':
      return 'bg-stone-100 text-stone-700 border-stone-200'
    case 'recipe':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'technique':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200'
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'environment':
      return '环境'
    case 'ashbed':
      return '灰床'
    case 'recipe':
      return '配方'
    case 'technique':
      return '操作'
    default:
      return '其他'
  }
}

function getScoreLevel(score: number) {
  if (score >= 85) return { label: '优秀', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
  if (score >= 70) return { label: '良好', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
  if (score >= 50) return { label: '一般', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' }
  return { label: '较差', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
}

function getScoreBarColor(score: number) {
  if (score >= 85) return 'bg-green-500'
  if (score >= 70) return 'bg-amber-500'
  if (score >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

function getPriorityDot(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-amber-500'
    case 'low':
      return 'bg-green-500'
    default:
      return 'bg-stone-400'
  }
}

function getPriorityBorder(priority: string) {
  switch (priority) {
    case 'high':
      return 'border-l-red-500'
    case 'medium':
      return 'border-l-amber-500'
    case 'low':
      return 'border-l-green-500'
    default:
      return 'border-l-stone-300'
  }
}

const sortedSuggestions = computed(() => {
  const suggestions = selectedExperiment.value?.review?.nextOptimizationSuggestions ?? []
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...suggestions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
})

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-4 py-3 bg-gradient-to-r from-teal-50 to-stone-50 border-b border-stone-100">
      <div class="flex items-center gap-2">
        <FileCheck class="w-5 h-5 text-teal-600" />
        <h3 class="font-semibold text-stone-800">复盘结论</h3>
      </div>
    </div>

    <div v-if="!selectedExperiment" class="p-8 text-center">
      <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
        <FileCheck class="w-8 h-8 text-stone-400" />
      </div>
      <div class="text-sm text-stone-500">选择实验以查看复盘结论</div>
    </div>

    <div v-else-if="!hasReview && selectedExperiment.status === 'completed'" class="p-4">
      <div class="text-center mb-4">
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-teal-100 flex items-center justify-center">
          <Zap class="w-8 h-8 text-teal-600" />
        </div>
        <div class="text-sm font-medium text-stone-700 mb-1">实验已完成，可生成复盘报告</div>
        <div class="text-xs text-stone-500">基于实验数据分析偏差并给出优化建议</div>
      </div>

      <button
        @click="generateNewReview"
        class="w-full px-4 py-2 text-sm text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-lg shadow-sm transition-all"
      >
        生成复盘报告
      </button>

      <div class="mt-4 p-3 rounded-lg border border-stone-100 bg-stone-50">
        <div class="flex items-center gap-2 mb-1">
          <Trophy class="w-4 h-4 text-amber-500" />
          <span class="text-xs text-stone-500">历史稳定性评分</span>
        </div>
        <div class="text-lg font-bold text-stone-700">{{ stabilityScore }}</div>
      </div>
    </div>

    <div v-else-if="hasReview" class="p-4 space-y-4">
      <div :class="['p-4 rounded-xl border', getScoreLevel(selectedExperiment!.review!.stabilityScore).bg, getScoreLevel(selectedExperiment!.review!.stabilityScore).border]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="['w-14 h-14 rounded-full flex items-center justify-center', getScoreLevel(selectedExperiment!.review!.stabilityScore).bg, getScoreLevel(selectedExperiment!.review!.stabilityScore).border, 'border-2']">
              <Trophy :class="['w-7 h-7', getScoreLevel(selectedExperiment!.review!.stabilityScore).color]" />
            </div>
            <div>
              <div class="text-xs text-stone-500">稳定性评分</div>
              <div :class="['text-2xl font-bold', getScoreLevel(selectedExperiment!.review!.stabilityScore).color]">
                {{ selectedExperiment!.review!.stabilityScore }}
                <span class="text-sm font-normal text-stone-400">/ 100</span>
              </div>
            </div>
          </div>
          <div :class="['px-3 py-1 rounded-full text-sm font-semibold', getScoreLevel(selectedExperiment!.review!.stabilityScore).bg, getScoreLevel(selectedExperiment!.review!.stabilityScore).color]">
            {{ getScoreLevel(selectedExperiment!.review!.stabilityScore).label }}
          </div>
        </div>
        <div class="mt-3 h-2.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-500', getScoreBarColor(selectedExperiment!.review!.stabilityScore)]"
            :style="{ width: `${selectedExperiment!.review!.stabilityScore}%` }"
          ></div>
        </div>
        <div class="mt-2 text-xs text-stone-500">基于最近实验的稳定性评估</div>
      </div>

      <div>
        <div class="flex items-center gap-2 mb-2">
          <Star class="w-4 h-4 text-amber-500" />
          <span class="text-sm font-semibold text-stone-800">总体结论</span>
        </div>
        <div class="p-4 rounded-lg bg-amber-50 border border-amber-100">
          <p class="text-sm text-stone-700 leading-relaxed">{{ selectedExperiment!.review!.overallConclusion }}</p>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center gap-2 mb-1">
          <Info class="w-4 h-4 text-teal-600" />
          <span class="text-sm font-semibold text-stone-800">详细分析</span>
        </div>
        <div class="p-3 rounded-lg border border-stone-100 bg-stone-50">
          <div class="text-xs font-medium text-stone-500 mb-1">断火分析</div>
          <p class="text-xs text-stone-700 leading-relaxed">{{ selectedExperiment!.review!.flameoutAnalysis }}</p>
        </div>
        <div class="p-3 rounded-lg border border-stone-100 bg-stone-50">
          <div class="text-xs font-medium text-stone-500 mb-1">灰线分析</div>
          <p class="text-xs text-stone-700 leading-relaxed">{{ selectedExperiment!.review!.ashLineAnalysis }}</p>
        </div>
      </div>

      <div v-if="selectedExperiment!.review!.experienceTags.length > 0">
        <div class="flex items-center gap-2 mb-2">
          <Tag class="w-4 h-4 text-teal-600" />
          <span class="text-sm font-semibold text-stone-800">经验标签</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tag in selectedExperiment!.review!.experienceTags"
            :key="tag"
            class="px-2.5 py-1 rounded-full text-xs font-medium border border-teal-200 bg-teal-50 text-teal-700"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <div v-if="sortedSuggestions.length > 0">
        <div class="flex items-center gap-2 mb-3">
          <Lightbulb class="w-4 h-4 text-amber-500" />
          <span class="text-sm font-semibold text-stone-800">下一步优化建议</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(suggestion, idx) in sortedSuggestions"
            :key="idx"
            :class="['p-3 rounded-lg border border-l-4 bg-white border-stone-100', getPriorityBorder(suggestion.priority)]"
          >
            <div class="flex items-start gap-3">
              <div
                :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border', getCategoryColor(suggestion.category)]"
              >
                <component :is="getCategoryIcon(suggestion.category)" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <div :class="['w-2 h-2 rounded-full flex-shrink-0', getPriorityDot(suggestion.priority)]"></div>
                  <span class="font-medium text-sm text-stone-800">{{ suggestion.title }}</span>
                  <span
                    :class="['px-1.5 py-0.5 text-xs rounded border', getCategoryColor(suggestion.category)]"
                  >
                    {{ getCategoryLabel(suggestion.category) }}
                  </span>
                </div>
                <p class="text-xs text-stone-600 leading-relaxed">{{ suggestion.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="pt-2 border-t border-stone-100">
        <div class="flex items-center justify-between text-xs text-stone-400">
          <span>报告生成时间</span>
          <span>{{ formatDate(selectedExperiment!.review!.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
