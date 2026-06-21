<script setup lang="ts">
import { Brush, Flame, Eraser, RotateCcw, RotateCw, Trash2, CornerDownRight, Wrench } from 'lucide-vue-next'
import { useDesignStore } from '@/stores/designStore'
import SliderInput from '@/components/ui/SliderInput.vue'
import type { ToolType } from '@/types/incense'
import {
  MIN_LINE_WIDTH,
  MAX_LINE_WIDTH,
  MIN_DENSITY,
  MAX_DENSITY,
  MIN_ERASER_SIZE,
  MAX_ERASER_SIZE,
} from '@/utils/constants'

const store = useDesignStore()

const tools: { type: ToolType; icon: any; label: string; description: string }[] = [
  { type: 'brush', icon: Brush, label: '画笔', description: '绘制新的香线路径' },
  { type: 'continue', icon: CornerDownRight, label: '续画', description: '从端点继续绘制' },
  { type: 'ignition', icon: Flame, label: '起燃点', description: '设置燃烧起始点' },
  { type: 'eraser', icon: Eraser, label: '橡皮擦', description: '擦除已有路径' },
]

function selectTool(tool: ToolType) {
  store.setTool(tool)
}

function clearCanvas() {
  if (confirm('确定要清空画布吗？所有笔画都会被清除。')) {
    store.clearAll()
  }
}

function undoLast() {
  store.undoStroke()
}

function redoLast() {
  store.redoStroke()
}

function repairAllBreaks() {
  if (store.analysis.breakPoints.length > 0) {
    store.repairAllBreakPoints()
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
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="tool in tools"
          :key="tool.type"
          @click="selectTool(tool.type)"
          class="flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all group relative"
          :class="{
            'bg-amber-50 border-2 border-amber-500 text-amber-700':
              store.currentTool === tool.type,
            'bg-stone-50 border-2 border-transparent text-stone-600 hover:bg-stone-100':
              store.currentTool !== tool.type,
          }"
        >
          <component :is="tool.icon" class="w-5 h-5" />
          <span class="text-xs font-medium">{{ tool.label }}</span>
          
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-stone-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {{ tool.description }}
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-stone-800"></div>
          </div>
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
        <SliderInput
          v-if="store.currentTool === 'eraser'"
          v-model="store.eraserSize"
          :min="MIN_ERASER_SIZE"
          :max="MAX_ERASER_SIZE"
          :step="1"
          label="橡皮擦大小"
          unit="px"
        />
      </div>
    </div>

    <div v-if="store.analysis.breakPoints.length > 0" class="border-t border-stone-100 pt-5">
      <h3 class="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
        <span class="w-1 h-4 bg-orange-500 rounded-full"></span>
        断点修复
      </h3>
      <div class="space-y-2">
        <p class="text-xs text-stone-600">
          检测到 <span class="font-semibold text-orange-600">{{ store.analysis.breakPoints.length }}</span> 处断点
        </p>
        <button
          @click="repairAllBreaks"
          class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
        >
          <Wrench class="w-4 h-4" />
          一键修复所有断点
        </button>
      </div>
    </div>

    <div class="border-t border-stone-100 pt-5 mt-auto">
      <h3 class="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
        <span class="w-1 h-4 bg-stone-400 rounded-full"></span>
        操作
      </h3>
      <div class="flex gap-2 mb-2">
        <button
          @click="undoLast"
          :disabled="!store.canUndo && store.strokes.length === 0 && store.currentStroke.length === 0"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw class="w-4 h-4" />
          撤销
        </button>
        <button
          @click="redoLast"
          :disabled="!store.canRedo"
          class="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCw class="w-4 h-4" />
          重做
        </button>
      </div>
      <button
        @click="clearCanvas"
        :disabled="store.strokes.length === 0 && store.currentStroke.length === 0"
        class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Trash2 class="w-4 h-4" />
        清空画布
      </button>
      <p class="text-xs text-stone-400 mt-2 text-center">
        当前 {{ store.strokeCount }} 笔 · 历史记录 {{ store.canUndo ? '有' : '无' }}
      </p>
    </div>
  </div>
</template>
