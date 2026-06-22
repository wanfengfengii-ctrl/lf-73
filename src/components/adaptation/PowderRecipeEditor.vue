<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Trash2, Leaf, Flame, Scale } from 'lucide-vue-next'
import { useEnvironmentAdaptation } from '@/composables/useEnvironmentAdaptation'
import type { PowderIngredient } from '@/types/incense'

const adaptation = useEnvironmentAdaptation()
const {
  ingredients,
  totalRatio,
  binderRatio,
  burnRateFactor,
  stabilityFactor,
  updateIngredient,
  addIngredient,
  removeIngredient,
  getAvailablePowders,
} = adaptation

const availablePowders = computed(() => getAvailablePowders())
const isBinder = (name: string) =>
  ['楠木粘粉', '榆树皮粉', '粘粉'].some((b) => name.includes(b))

function handleRatioChange(index: number, value: string) {
  const num = parseFloat(value) || 0
  updateIngredient(index, { ratio: Math.max(0, Math.min(100, num)) })
}

function handleNameChange(index: number, name: string) {
  const powder = availablePowders.value.find((p) => p.name === name)
  if (powder) {
    updateIngredient(index, {
      name: powder.name,
      burnRateFactor: powder.burnRateFactor,
      stabilityFactor: powder.stabilityFactor,
    })
  }
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-4 py-3 bg-gradient-to-r from-amber-50 to-stone-50 border-b border-stone-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Leaf class="w-5 h-5 text-amber-600" />
          <h3 class="font-semibold text-stone-800">香粉配方</h3>
        </div>
        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-1">
            <Flame class="w-3.5 h-3.5 text-orange-500" />
            <span class="text-stone-500">燃速</span>
            <span class="font-semibold text-amber-700">{{ burnRateFactor.toFixed(2) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <Scale class="w-3.5 h-3.5 text-green-600" />
            <span class="text-stone-500">稳定</span>
            <span class="font-semibold text-amber-700">{{ stabilityFactor.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="p-4 space-y-3">
      <div
        v-for="(ingredient, index) in ingredients"
        :key="index"
        class="flex items-center gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100"
      >
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          :class="isBinder(ingredient.name) ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-600'"
        >
          {{ ingredient.name.charAt(0) }}
        </div>

        <div class="flex-1 min-w-0">
          <select
            :value="ingredient.name"
            @change="(e) => handleNameChange(index, (e.target as HTMLSelectElement).value)"
            class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
          >
            <option v-for="p in availablePowders" :key="p.name" :value="p.name">
              {{ p.name }}
            </option>
          </select>
          <div class="flex items-center gap-2 mt-1.5">
            <input
              type="number"
              min="0"
              max="100"
              :value="ingredient.ratio"
              @input="(e) => handleRatioChange(index, (e.target as HTMLInputElement).value)"
              class="w-20 px-2 py-1 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
            />
            <span class="text-xs text-stone-500">%</span>
            <div class="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="isBinder(ingredient.name) ? 'bg-amber-500' : 'bg-stone-500'"
                :style="{ width: `${Math.min(ingredient.ratio, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <button
          @click="removeIngredient(index)"
          :disabled="ingredients.length <= 1"
          class="p-1.5 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>

      <button
        @click="addIngredient()"
        class="w-full py-2.5 flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 rounded-lg transition-colors"
      >
        <Plus class="w-4 h-4" />
        添加香粉
      </button>
    </div>

    <div class="px-4 py-3 bg-stone-50 border-t border-stone-100">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="text-stone-500">配方总计</span>
          <span
            class="font-bold px-2 py-0.5 rounded"
            :class="totalRatio === 100 ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'"
          >
            {{ totalRatio }}%
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-stone-500">粘粉占比</span>
          <span
            class="font-bold px-2 py-0.5 rounded"
            :class="binderRatio >= 10 && binderRatio <= 30 ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'"
          >
            {{ binderRatio.toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
