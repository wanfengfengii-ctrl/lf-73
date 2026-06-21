<script setup lang="ts">
import { computed, ref } from 'vue'
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Timer } from 'lucide-vue-next'
import { useDesignStore } from '@/stores/designStore'

const store = useDesignStore()
const animationSpeed = ref(1)

const canPlay = computed(() => {
  return store.ignitionPoint !== null && store.strokes.length > 0 && store.analysis.isValid
})

const burnProgress = computed(() => {
  if (store.burnAnimation.duration === 0) return 0
  return (store.burnAnimation.currentTime / store.burnAnimation.duration) * 100
})

const remainingTime = computed(() => {
  const remaining = Math.max(0, store.burnAnimation.duration - store.burnAnimation.currentTime)
  return formatTime(remaining)
})

const totalTime = computed(() => {
  return formatTime(store.burnAnimation.duration)
})

function formatTime(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function togglePlay() {
  if (store.burnAnimation.isPlaying) {
    store.pauseBurnAnimation()
  } else {
    if (burnProgress.value >= 100) {
      store.resetBurnAnimation()
    }
    store.startBurnAnimation()
  }
}

function handleProgressChange(event: Event) {
  const target = event.target as HTMLInputElement
  const progress = parseFloat(target.value) / 100
  store.setBurnProgress(progress)
}

function skipBackward() {
  const newProgress = Math.max(0, burnProgress.value - 10) / 100
  store.setBurnProgress(newProgress)
}

function skipForward() {
  const newProgress = Math.min(100, burnProgress.value + 10) / 100
  store.setBurnProgress(newProgress)
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 border border-stone-100">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-stone-800 flex items-center gap-2">
        <span class="w-1 h-4 bg-orange-500 rounded-full"></span>
        燃烧模拟
      </h3>
      <div class="flex items-center gap-1 text-xs text-stone-500">
        <Timer class="w-3.5 h-3.5" />
        <span>预计: {{ totalTime }}</span>
      </div>
    </div>

    <div class="space-y-4">
      <div class="relative">
        <input
          type="range"
          :value="burnProgress"
          @input="handleProgressChange"
          min="0"
          max="100"
          step="0.1"
          :disabled="!canPlay"
          class="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :style="{
            background: `linear-gradient(to right, #F97316 0%, #F97316 ${burnProgress}%, #E7E5E4 ${burnProgress}%, #E7E5E4 100%)`,
          }"
        />
        <div class="flex justify-between text-xs text-stone-500 mt-1">
          <span>0%</span>
          <span>剩余: {{ remainingTime }}</span>
          <span>100%</span>
        </div>
      </div>

      <div class="flex items-center justify-center gap-2">
        <button
          @click="skipBackward"
          :disabled="!canPlay"
          class="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipBack class="w-4 h-4" />
        </button>

        <button
          @click="togglePlay"
          :disabled="!canPlay"
          class="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          :class="{
            'bg-orange-500 text-white hover:bg-orange-600': !store.burnAnimation.isPlaying,
            'bg-stone-700 text-white hover:bg-stone-800': store.burnAnimation.isPlaying,
          }"
        >
          <component :is="store.burnAnimation.isPlaying ? Pause : Play" class="w-5 h-5" />
          {{ store.burnAnimation.isPlaying ? '暂停' : '播放' }}
        </button>

        <button
          @click="skipForward"
          :disabled="!canPlay"
          class="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipForward class="w-4 h-4" />
        </button>

        <button
          @click="store.resetBurnAnimation"
          :disabled="!canPlay"
          class="p-2 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-3 pt-2 border-t border-stone-100">
        <span class="text-xs text-stone-500 flex-shrink-0">播放速度</span>
        <div class="flex gap-1 flex-1">
          <button
            v-for="speed in [0.5, 1, 2, 4]"
            :key="speed"
            @click="animationSpeed = speed"
            class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="{
              'bg-orange-100 text-orange-700': animationSpeed === speed,
              'bg-stone-100 text-stone-600 hover:bg-stone-200': animationSpeed !== speed,
            }"
          >
            {{ speed }}x
          </button>
        </div>
      </div>

      <div
        v-if="!canPlay"
        class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3"
      >
        <p v-if="!store.ignitionPoint">请先设置起燃点</p>
        <p v-else-if="store.strokes.length === 0">请先绘制香线路径</p>
        <p v-else-if="!store.analysis.isValid">请确保路径有效且连续</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f97316;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f97316;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
