<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Save, Trash2, Plus, FileText } from 'lucide-vue-next'
import { useDesignStore } from '@/stores/designStore'
import { useSchemeStorage } from '@/composables/useSchemeStorage'
import type { IncenseScheme } from '@/types/incense'
import { PIXELS_PER_CM } from '@/utils/constants'

const store = useDesignStore()
const { schemes, addScheme, deleteScheme, generateId, generateSchemeName, loadSchemes } = useSchemeStorage()

const schemeName = ref('')

const canSave = computed(() => {
  return store.analysis.isValid && store.allPoints.length > 1
})

function handleSave() {
  if (!canSave.value) return

  const name = schemeName.value.trim() || generateSchemeName()

  const scheme: IncenseScheme = {
    id: generateId(),
    name,
    path: JSON.parse(JSON.stringify(store.currentPath)),
    analysis: JSON.parse(JSON.stringify(store.analysis)),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  addScheme(scheme)
  schemeName.value = ''
}

function handleLoad(scheme: IncenseScheme) {
  store.loadScheme(scheme)
}

function handleDelete(scheme: IncenseScheme, event: Event) {
  event.stopPropagation()
  if (confirm(`确定要删除「${scheme.name}」吗？`)) {
    deleteScheme(scheme.id)
  }
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '—'
  const minutes = seconds / 60
  if (minutes < 60) {
    return minutes.toFixed(1) + '分'
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  return hours + '时' + remainingMinutes + '分'
}

function formatLength(px: number): string {
  const cm = px / PIXELS_PER_CM
  if (cm >= 100) {
    return (cm / 100).toFixed(2) + 'm'
  }
  return cm.toFixed(1) + 'cm'
}

onMounted(() => {
  loadSchemes()
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 border border-stone-100">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-stone-800 flex items-center gap-2">
        <span class="w-1 h-4 bg-amber-600 rounded-full"></span>
        我的方案
        <span class="text-xs font-normal text-stone-400">({{ schemes.length }})</span>
      </h3>
      
      <div class="flex items-center gap-2">
        <input
          v-model="schemeName"
          type="text"
          placeholder="方案名称"
          class="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-40"
        />
        <button
          @click="handleSave"
          :disabled="!canSave"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          :class="{
            'bg-amber-600 text-white hover:bg-amber-700': canSave,
            'bg-stone-200 text-stone-400 cursor-not-allowed': !canSave,
          }"
        >
          <Save class="w-4 h-4" />
          保存方案
        </button>
      </div>
    </div>

    <div class="relative">
      <div
        v-if="schemes.length === 0"
        class="flex flex-col items-center justify-center py-8 text-stone-400"
      >
        <FileText class="w-10 h-10 mb-2 opacity-50" />
        <p class="text-sm">暂无保存的方案</p>
        <p class="text-xs mt-1">设计完成后点击上方按钮保存</p>
      </div>

      <div v-else class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        <div
          v-for="scheme in schemes"
          :key="scheme.id"
          @click="handleLoad(scheme)"
          class="flex-shrink-0 w-48 p-3 rounded-lg border-2 border-stone-200 bg-stone-50 cursor-pointer transition-all hover:border-amber-400 hover:bg-amber-50 group"
        >
          <div class="flex items-start justify-between mb-2">
            <h4 class="text-sm font-medium text-stone-800 truncate flex-1">
              {{ scheme.name }}
            </h4>
            <button
              @click="handleDelete(scheme, $event)"
              class="opacity-0 group-hover:opacity-100 p-1 rounded text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0 ml-2"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
          
          <div class="flex justify-between text-xs text-stone-500 space-x-2">
            <span>长度: {{ formatLength(scheme.analysis.totalLength) }}</span>
            <span>时长: {{ formatTime(scheme.analysis.estimatedBurnTime) }}</span>
          </div>
          
          <div class="mt-2 flex items-center gap-1">
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="scheme.analysis.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
            >
              {{ scheme.analysis.isValid ? '有效' : '无效' }}
            </span>
            <span v-if="scheme.analysis.intersectionCount > 0" class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              {{ scheme.analysis.intersectionCount }} 交叉
            </span>
          </div>
        </div>

        <div
          class="flex-shrink-0 w-48 p-3 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400 cursor-pointer hover:border-amber-400 hover:text-amber-500 transition-all"
          @click="store.reset()"
        >
          <Plus class="w-6 h-6 mb-1" />
          <span class="text-xs">新建方案</span>
        </div>
      </div>
    </div>
  </div>
</template>
