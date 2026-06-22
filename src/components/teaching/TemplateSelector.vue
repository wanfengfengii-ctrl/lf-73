<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen, Star, Clock, ChevronRight, Lock } from 'lucide-vue-next'
import type { TeachingTemplate } from '@/types/incense'
import { DIFFICULTY_LABELS } from '@/types/incense'
import { useTeaching } from '@/composables/useTeaching'

const emit = defineEmits<{
  (e: 'select', template: TeachingTemplate): void
}>()

const { templates, getPracticeStats } = useTeaching()

const stats = computed(() => getPracticeStats())

const groupedTemplates = computed(() => ({
  beginner: templates.value.filter((t) => t.difficulty === 'beginner'),
  intermediate: templates.value.filter((t) => t.difficulty === 'intermediate'),
  advanced: templates.value.filter((t) => t.difficulty === 'advanced'),
}))

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-amber-100 text-amber-800 border-amber-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
}

const difficultyGradients = {
  beginner: 'from-green-400 to-emerald-500',
  intermediate: 'from-amber-400 to-orange-500',
  advanced: 'from-red-400 to-rose-500',
}

function isUnlocked(template: TeachingTemplate): boolean {
  if (template.prerequisites.length === 0) return true
  return template.prerequisites.every((prereq) =>
    stats.value.masteredTemplates.includes(prereq) ||
    templates.value.some((t) => t.name === prereq && stats.value.masteredTemplates.includes(t.id))
  )
}

function isMastered(templateId: string): boolean {
  return stats.value.masteredTemplates.includes(templateId)
}

function getTotalEstimatedTime(template: TeachingTemplate): number {
  return template.steps.reduce((sum, s) => sum + s.estimatedTime, 0)
}

function selectTemplate(template: TeachingTemplate) {
  if (isUnlocked(template)) {
    emit('select', template)
  }
}
</script>

<template>
  <div class="p-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-stone-800 mb-2">香篆教学课程</h2>
      <p class="text-stone-600">选择适合您的课程，开始系统学习香篆制作技艺</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
        <div class="text-3xl font-bold text-amber-600">{{ stats.totalPractices }}</div>
        <div class="text-sm text-stone-500">完成练习</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
        <div class="text-3xl font-bold text-green-600">{{ stats.averageScore }}</div>
        <div class="text-sm text-stone-500">平均分数</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
        <div class="text-3xl font-bold text-purple-600">{{ stats.bestScore }}</div>
        <div class="text-sm text-stone-500">最高分数</div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
        <div class="text-3xl font-bold text-blue-600">{{ stats.totalTimeSpent }}</div>
        <div class="text-sm text-stone-500">累计练习(分钟)</div>
      </div>
    </div>

    <div class="space-y-8">
      <div v-for="(group, difficulty) in groupedTemplates" :key="difficulty" class="space-y-4">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium border',
              difficultyColors[difficulty as keyof typeof difficultyColors],
            ]"
          >
            {{ DIFFICULTY_LABELS[difficulty] }}
          </div>
          <div class="flex-1 h-px bg-stone-200"></div>
          <span class="text-sm text-stone-400">{{ group.length }} 个课程</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="template in group"
            :key="template.id"
            @click="selectTemplate(template)"
            :class="[
              'relative bg-white rounded-xl p-6 border-2 transition-all duration-300 cursor-pointer',
              isUnlocked(template)
                ? 'border-stone-200 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1'
                : 'border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed',
            ]"
          >
            <div
              v-if="isMastered(template.id)"
              class="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md"
            >
              <Star class="w-4 h-4 text-white fill-white" />
            </div>

            <div
              v-if="!isUnlocked(template)"
              class="absolute inset-0 bg-stone-900/5 rounded-xl flex items-center justify-center"
            >
              <div class="bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
                <Lock class="w-4 h-4 text-stone-500" />
                <span class="text-sm text-stone-600">需要先完成前置课程</span>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                :class="[
                  'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-md',
                  difficultyGradients[difficulty as keyof typeof difficultyGradients],
                ]"
              >
                {{ template.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-lg text-stone-800 mb-1 truncate">
                  {{ template.name }}
                </h3>
                <p class="text-sm text-stone-500 mb-3 line-clamp-2">
                  {{ template.description }}
                </p>
                <div class="flex items-center gap-4 text-xs text-stone-400">
                  <div class="flex items-center gap-1">
                    <BookOpen class="w-3 h-3" />
                    <span>{{ template.steps.length }} 个步骤</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    <span>约 {{ getTotalEstimatedTime(template) }} 分钟</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-stone-100">
              <div class="flex items-center justify-between">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="(objective, idx) in template.learningObjectives.slice(0, 2)"
                    :key="idx"
                    class="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded"
                  >
                    {{ objective }}
                  </span>
                  <span
                    v-if="template.learningObjectives.length > 2"
                    class="text-xs text-stone-400"
                  >
                    +{{ template.learningObjectives.length - 2 }}
                  </span>
                </div>
                <ChevronRight
                  :class="[
                    'w-5 h-5 transition-transform',
                    isUnlocked(template) ? 'text-stone-400 group-hover:text-amber-500' : 'text-stone-300',
                  ]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
