<script setup lang="ts">
import { Brush, Flame, Eraser, RotateCcw, Trash2 } from 'lucide-vue-next'
import { useDesignStore } from '@/stores/designStore'
import SliderInput from '@/components/ui/SliderInput.vue'
import type { ToolType } from '@/types/incense'
import {
  MIN_LINE_WIDTH,
  MAX_LINE_WIDTH,
  MIN_DENSITY,
  MAX_DENSITY,
} from '@/utils/constants'

const store = useDesignStore()

const tools: { type: ToolType; icon: any; label: string }[] = [
  { type: 'brush', icon: Brush, label: '画笔' },
  { type: 'ignition', icon: Flame, label: '起燃点' },
  { type: 'eraser', icon: Eraser, label: '橡皮擦' },
]

function selectTool(tool: ToolType) {
  store.setTool(tool)
}

function clearCanvas() {
  if (confirm('确定要清空画布吗？')) {
    store.clearPath()
  }
}

function undoLast() {
  if (store.points.length > 0) {
    const newPoints = store.points.slice(0, -1)
    store.setPoints(newPoints)
  }
}
</script>

<template>
  <div class="w-64 bg-white rounded-xl shadow-md p-5 border border-stone-100 flex flex-col gap-5">
    <div>
      <h3 class="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
        <span class="w-1 h-4 bg-amber-600 rounded-full"></span>
        绘图工具
      </h3>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="tool in tools"
          :key="tool.type"
          @click="selectTool(tool.type)"
          class="flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all"
          :class="{
            'bg-amber-50 border-2 border-amber-500 text-amber-700':
              store.currentTool === tool.type,
            'bg-stone-50 border-2 border-transparent text-stone-600 hover:bg-stone-100':
              store.currentTool !== tool.type,
          }"
        >
          <component :is="tool.icon" class="w-5 h-5" />
          <span class="text-xs font-medium">{{ tool.label }}</span>
        </button>
      </div>
    </div>

    <div class="border-t border-stone-100 pt-5">
      <h3 class="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-amber-600 rounded-full"></span>
        参数设置
      </h3>
      <div class="space-y-5">
        <SliderInput
          v-model="store.lineWidth"
          :min="MIN_LINE_WIDTH"
          :max="MAX_LINE_WIDTH"
          :step="1"
          label="香线宽度"
          unit="px"
        />
        <SliderInput
          v-model="store.density"
          :min="MIN_DENSITY"
          :max="MAX_DENSITY"
          :step="0.1"
          label="香粉密度"
          unit="g/cm³"
        />
      </div>
    </div>

    <div class="border-t border-stone-100 pt-5 mt-auto">
      <h3 class="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
        <span class="w-1 h-4 bg-stone-400 rounded-full"></span>
        操作
      </h3>
      <div class="flex gap-2">
        <button
          @click="undoLast"
          :disabled="store.points.length === 0"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw class="w-4 h-4" />
          撤销
        </button>
        <button
          @click="clearCanvas"
          :disabled="store.points.length === 0"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 class="w-4 h-4" />
          清空
        </button>
      </div>
    </div>
  </div>
</template>
