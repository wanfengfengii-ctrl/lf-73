<script setup lang="ts">
import { computed } from 'vue'
import {
  Lightbulb,
  Info,
  Droplets,
  Layers,
  Leaf,
  Hand,
  ChevronRight,
} from 'lucide-vue-next'
import { useEnvironmentAdaptationStore } from '@/stores/environmentAdaptationStore'
import type { OptimizationSuggestion } from '@/types/incense'

const store = useEnvironmentAdaptationStore()

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

function getPriorityConfig(priority: string) {
  switch (priority) {
    case 'high':
      return {
        label: '高',
        color: 'bg-red-500',
        textColor: 'text-red-600',
        border: 'border-l-red-500',
        bg: 'bg-red-50',
      }
    case 'medium':
      return {
        label: '中',
        color: 'bg-amber-500',
        textColor: 'text-amber-600',
        border: 'border-l-amber-500',
        bg: 'bg-amber-50',
      }
    case 'low':
      return {
        label: '低',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        border: 'border-l-green-500',
        bg: 'bg-green-50',
      }
    default:
      return {
        label: '低',
        color: 'bg-stone-500',
        textColor: 'text-stone-600',
        border: 'border-l-stone-300',
        bg: 'bg-stone-50',
      }
  }
}

function applySuggestion(suggestion: OptimizationSuggestion) {
  if (!suggestion.parameter || suggestion.targetValue === undefined) return

  const param = suggestion.parameter
  if (param === 'humidity' || param === 'temperature' || param === 'airflow' || param === 'ashBedThickness') {
    store.updateEnvironment({ [param]: suggestion.targetValue })
  } else if (param === 'totalRatio') {
    const diff = suggestion.targetValue - suggestion.currentValue!
    if (store.ingredients.length > 0) {
      const perItem = diff / store.ingredients.length
      store.ingredients.forEach((_, i) => {
        store.updateIngredient(i, { ratio: store.ingredients[i].ratio + perItem })
      })
    }
  } else if (param === 'binderRatio') {
    const binderNames = ['楠木粘粉', '榆树皮粉', '粘粉']
    const binderIndex = store.ingredients.findIndex((i) =>
      binderNames.some((b) => i.name.includes(b))
    )
    if (binderIndex >= 0) {
      const total = store.ingredients.reduce((sum, i) => sum + i.ratio, 0)
      const newBinderRatio = (suggestion.targetValue / 100) * total
      store.updateIngredient(binderIndex, { ratio: newBinderRatio })
    }
  } else {
    const ingredientIndex = store.ingredients.findIndex((i) => i.name === param)
    if (ingredientIndex >= 0 && suggestion.targetValue !== undefined) {
      store.updateIngredient(ingredientIndex, { ratio: suggestion.targetValue })
    }
  }
}

const suggestionsByPriority = computed(() => {
  const high = store.suggestions.filter((s) => s.priority === 'high')
  const medium = store.suggestions.filter((s) => s.priority === 'medium')
  const low = store.suggestions.filter((s) => s.priority === 'low')
  return { high, medium, low }
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-4 py-3 bg-gradient-to-r from-purple-50 to-amber-50 border-b border-stone-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Lightbulb class="w-5 h-5 text-amber-500" />
          <h3 class="font-semibold text-stone-800">调优建议</h3>
        </div>
        <div class="flex items-center gap-1 text-xs text-stone-500">
          <span>共</span>
          <span class="font-bold text-amber-700">{{ store.suggestions.length }}</span>
          <span>条</span>
        </div>
      </div>
    </div>

    <div v-if="store.suggestions.length === 0" class="p-8 text-center">
      <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
        <Info class="w-8 h-8 text-green-600" />
      </div>
      <div class="text-sm font-medium text-stone-700">当前配置状态良好</div>
      <div class="text-xs text-stone-500 mt-1">无需进行额外调整</div>
    </div>

    <div v-else class="p-4 space-y-4 max-h-96 overflow-y-auto">
      <div v-if="suggestionsByPriority.high.length > 0">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-red-500"></div>
          <span class="text-xs font-semibold text-red-600">高优先级</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(suggestion, idx) in suggestionsByPriority.high"
            :key="'high-' + idx"
            :class="[
              'p-3 rounded-lg border border-l-4 bg-red-50/50 border-stone-100 hover:shadow-sm transition-all',
              getPriorityConfig(suggestion.priority).border,
            ]"
          >
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border',
                  getCategoryColor(suggestion.category),
                ]"
              >
                <component :is="getCategoryIcon(suggestion.category)" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-sm text-stone-800">{{ suggestion.title }}</span>
                  <span
                    :class="['px-1.5 py-0.5 text-xs rounded border', getCategoryColor(suggestion.category)]"
                  >
                    {{ getCategoryLabel(suggestion.category) }}
                  </span>
                </div>
                <p class="text-xs text-stone-600 leading-relaxed">{{ suggestion.description }}</p>
                <button
                  v-if="suggestion.targetValue !== undefined"
                  @click="applySuggestion(suggestion)"
                  class="mt-2 flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  一键应用
                  <ChevronRight class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="suggestionsByPriority.medium.length > 0">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-amber-500"></div>
          <span class="text-xs font-semibold text-amber-600">中优先级</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(suggestion, idx) in suggestionsByPriority.medium"
            :key="'medium-' + idx"
            :class="[
              'p-3 rounded-lg border border-l-4 bg-amber-50/50 border-stone-100 hover:shadow-sm transition-all',
              getPriorityConfig(suggestion.priority).border,
            ]"
          >
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border',
                  getCategoryColor(suggestion.category),
                ]"
              >
                <component :is="getCategoryIcon(suggestion.category)" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-sm text-stone-800">{{ suggestion.title }}</span>
                  <span
                    :class="['px-1.5 py-0.5 text-xs rounded border', getCategoryColor(suggestion.category)]"
                  >
                    {{ getCategoryLabel(suggestion.category) }}
                  </span>
                </div>
                <p class="text-xs text-stone-600 leading-relaxed">{{ suggestion.description }}</p>
                <button
                  v-if="suggestion.targetValue !== undefined"
                  @click="applySuggestion(suggestion)"
                  class="mt-2 flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  一键应用
                  <ChevronRight class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="suggestionsByPriority.low.length > 0">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-green-500"></div>
          <span class="text-xs font-semibold text-green-600">低优先级</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(suggestion, idx) in suggestionsByPriority.low"
            :key="'low-' + idx"
            :class="[
              'p-3 rounded-lg border border-l-4 bg-green-50/50 border-stone-100 hover:shadow-sm transition-all',
              getPriorityConfig(suggestion.priority).border,
            ]"
          >
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border',
                  getCategoryColor(suggestion.category),
                ]"
              >
                <component :is="getCategoryIcon(suggestion.category)" class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-sm text-stone-800">{{ suggestion.title }}</span>
                  <span
                    :class="['px-1.5 py-0.5 text-xs rounded border', getCategoryColor(suggestion.category)]"
                  >
                    {{ getCategoryLabel(suggestion.category) }}
                  </span>
                </div>
                <p class="text-xs text-stone-600 leading-relaxed">{{ suggestion.description }}</p>
                <button
                  v-if="suggestion.targetValue !== undefined"
                  @click="applySuggestion(suggestion)"
                  class="mt-2 flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  一键应用
                  <ChevronRight class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
