<script setup lang="ts">
import { computed } from 'vue'
import { Trophy, Target, Zap, Clock, CheckCircle, TrendingUp, RotateCcw, ArrowRight, Star } from 'lucide-vue-next'
import type { PracticeScore, PracticeRecord } from '@/types/incense'
import { GRADE_LABELS } from '@/types/incense'
import { SCORE_CATEGORIES } from '@/utils/constants'

const props = defineProps<{
  score: PracticeScore
  practice: PracticeRecord
}>()

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'next'): void
  (e: 'viewReport'): void
}>()

const gradeColor = computed(() => {
  const colors: Record<string, string> = {
    S: 'from-amber-400 via-yellow-400 to-orange-500',
    A: 'from-green-400 via-emerald-400 to-teal-500',
    B: 'from-blue-400 via-cyan-400 to-sky-500',
    C: 'from-purple-400 via-violet-400 to-indigo-500',
    D: 'from-orange-400 via-amber-400 to-yellow-500',
    F: 'from-red-400 via-rose-400 to-pink-500',
  }
  return colors[props.score.grade] || 'from-gray-400 to-gray-500'
})

const gradeEmoji = computed(() => {
  const emojis: Record<string, string> = {
    S: '🏆',
    A: '🌟',
    B: '👍',
    C: '💪',
    D: '📚',
    F: '🌱',
  }
  return emojis[props.score.grade] || '📝'
})

const scoreColor = computed(() => {
  const p = props.score.percentage
  if (p >= 90) return 'text-amber-500'
  if (p >= 80) return 'text-green-500'
  if (p >= 70) return 'text-blue-500'
  if (p >= 60) return 'text-purple-500'
  return 'text-red-500'
})

const categoryData = computed(() => [
  {
    key: 'accuracy',
    label: SCORE_CATEGORIES.accuracy.label,
    score: props.score.accuracyScore,
    icon: Target,
    weight: SCORE_CATEGORIES.accuracy.weight,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  {
    key: 'technique',
    label: SCORE_CATEGORIES.technique.label,
    score: props.score.techniqueScore,
    icon: Zap,
    weight: SCORE_CATEGORIES.technique.weight,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  {
    key: 'timing',
    label: SCORE_CATEGORIES.timing.label,
    score: props.score.timingScore,
    icon: Clock,
    weight: SCORE_CATEGORIES.timing.weight,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  {
    key: 'completeness',
    label: SCORE_CATEGORIES.completeness.label,
    score: props.score.completenessScore,
    icon: CheckCircle,
    weight: SCORE_CATEGORIES.completeness.weight,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
  },
])

const timeSpentMinutes = computed(() => {
  return Math.round(props.practice.timeSpent / 60000)
})

function getStepScoreClass(stepScore: { score: number; maxScore: number }) {
  const ratio = stepScore.score / stepScore.maxScore
  if (ratio >= 0.9) return 'bg-green-500'
  if (ratio >= 0.7) return 'bg-blue-500'
  if (ratio >= 0.5) return 'bg-yellow-500'
  return 'bg-red-500'
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <div class="text-6xl mb-4">{{ gradeEmoji }}</div>
      <h2 class="text-3xl font-bold text-stone-800 mb-2">练习完成！</h2>
      <p class="text-stone-600">{{ practice.templateName }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div class="lg:col-span-1">
        <div
          :class="[
            'relative bg-gradient-to-br rounded-2xl p-8 text-white text-center shadow-xl',
            gradeColor,
          ]"
        >
          <div class="absolute top-4 right-4 flex items-center gap-1">
            <Star class="w-5 h-5 fill-white" />
            <span class="text-sm font-medium">{{ GRADE_LABELS[score.grade] }}</span>
          </div>
          <div class="text-8xl font-bold mb-2">{{ score.grade }}</div>
          <div class="text-2xl font-semibold mb-2">
            <span :class="scoreColor">{{ score.totalScore }}</span>
            <span class="text-white/70"> / {{ score.maxScore }}</span>
          </div>
          <div class="text-white/80 text-lg">{{ score.percentage }}% 完成度</div>
          <div class="mt-6 pt-6 border-t border-white/20">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-white/70">用时</div>
                <div class="font-semibold">{{ timeSpentMinutes }} 分钟</div>
              </div>
              <div>
                <div class="text-white/70">提示使用</div>
                <div class="font-semibold">{{ practice.hintsUsed }} 次</div>
              </div>
              <div>
                <div class="text-white/70">错误数</div>
                <div class="font-semibold">{{ practice.mistakes.length }} 个</div>
              </div>
              <div>
                <div class="text-white/70">完成步骤</div>
                <div class="font-semibold">{{ practice.completedSteps.length }} 步</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
          <h3 class="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-amber-500" />
            能力维度评分
          </h3>
          <div class="space-y-4">
            <div
              v-for="cat in categoryData"
              :key="cat.key"
              class="flex items-center gap-4"
            >
              <div :class="['w-10 h-10 rounded-xl flex items-center justify-center', cat.bgColor]">
                <component :is="cat.icon" :class="['w-5 h-5', cat.color]" />
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-stone-700">{{ cat.label }}</span>
                  <span :class="['text-sm font-bold', cat.color]">{{ cat.score }}分</span>
                </div>
                <div class="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    :class="['h-full rounded-full transition-all duration-700', cat.bgColor.replace('100', '500')]"
                    :style="{ width: `${cat.score}%` }"
                  ></div>
                </div>
              </div>
              <div class="text-xs text-stone-400 w-16 text-right">
                权重 {{ Math.round(cat.weight * 100) }}%
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
          <h3 class="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
            <Trophy class="w-5 h-5 text-amber-500" />
            各步骤得分
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div
              v-for="stepScore in score.stepScores"
              :key="stepScore.stepId"
              class="bg-stone-50 rounded-xl p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-stone-500 truncate">步骤</span>
                <span class="text-sm font-bold text-stone-800">
                  {{ stepScore.score }}/{{ stepScore.maxScore }}
                </span>
              </div>
              <div class="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  :class="['h-full rounded-full', getStepScoreClass(stepScore)]"
                  :style="{ width: `${(stepScore.score / stepScore.maxScore) * 100}%` }"
                ></div>
              </div>
              <div v-if="stepScore.deductions.length > 0" class="mt-2">
                <div
                  v-for="(ded, idx) in stepScore.deductions.slice(0, 2)"
                  :key="idx"
                  class="text-xs text-red-500 flex items-start gap-1"
                >
                  <span>-{{ ded.points }}</span>
                  <span class="truncate">{{ ded.reason }}</span>
                </div>
              </div>
              <div v-if="stepScore.bonuses.length > 0" class="mt-1">
                <div
                  v-for="(bonus, idx) in stepScore.bonuses.slice(0, 2)"
                  :key="idx"
                  class="text-xs text-green-500 flex items-start gap-1"
                >
                  <span>+{{ bonus.points }}</span>
                  <span class="truncate">{{ bonus.reason }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button
        @click="emit('retry')"
        class="w-full sm:w-auto px-8 py-3 rounded-xl border-2 border-stone-300 text-stone-700 font-medium hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
      >
        <RotateCcw class="w-5 h-5" />
        再次练习
      </button>
      <button
        @click="emit('viewReport')"
        class="w-full sm:w-auto px-8 py-3 rounded-xl border-2 border-amber-400 text-amber-600 font-medium hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
      >
        <TrendingUp class="w-5 h-5" />
        查看学习报告
      </button>
      <button
        @click="emit('next')"
        class="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        继续学习
        <ArrowRight class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
