<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Ruler, XCircle, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { useDesignStore } from '@/stores/designStore'
import DataCard from '@/components/ui/DataCard.vue'
import { PIXELS_PER_CM } from '@/utils/constants'

const store = useDesignStore()

const formattedLength = computed(() => {
  const lengthInCm = store.analysis.totalLength / PIXELS_PER_CM
  if (lengthInCm >= 100) {
    return (lengthInCm / 100).toFixed(2) + ' 米'
  }
  return lengthInCm.toFixed(1) + ' 厘米'
})

const formattedBurnTime = computed(() => {
  const seconds = store.analysis.estimatedBurnTime
  if (seconds <= 0) return '—'
  if (seconds < 60) {
    return Math.round(seconds) + ' 秒'
  }
  const minutes = seconds / 60
  if (minutes < 60) {
    return minutes.toFixed(1) + ' 分钟'
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  return hours + ' 小时 ' + remainingMinutes + ' 分'
})
</script>

<template>
  <div class="w-72 bg-white rounded-xl shadow-md p-5 border border-stone-100 flex flex-col gap-4">
    <div>
      <h3 class="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
        <span class="w-1 h-4 bg-amber-600 rounded-full"></span>
        路径分析
      </h3>
      <div class="grid grid-cols-2 gap-3">
        <DataCard
          label="路径长度"
          :value="formattedLength"
          subtext="总香线长度"
        />
        <DataCard
          label="燃烧时长"
          :value="formattedBurnTime"
          subtext="预计燃烧时间"
          highlight
        />
        <DataCard
          label="交叉点"
          :value="store.analysis.intersectionCount.toString()"
          subtext="路径自交数量"
          :warning="store.analysis.intersectionCount > 5"
        />
        <DataCard
          label="风险点"
          :value="store.analysis.breakRiskPoints.length.toString()"
          subtext="可能断火位置"
          :danger="store.analysis.breakRiskPoints.length > 3"
        />
      </div>
    </div>

    <div class="border-t border-stone-100 pt-4">
      <h3 class="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
        <span
          class="w-1 h-4 rounded-full"
          :class="store.analysis.isValid ? 'bg-green-500' : 'bg-red-500'"
        ></span>
        验证状态
      </h3>
      
      <div
        v-if="store.analysis.isValid"
        class="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200"
      >
        <CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0" />
        <span class="text-sm text-green-800 font-medium">路径有效，可以保存</span>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(error, index) in store.analysis.errors"
          :key="'error-' + index"
          class="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100"
        >
          <XCircle class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span class="text-sm text-red-700">{{ error }}</span>
        </div>
      </div>

      <div v-if="store.analysis.warnings.length > 0" class="mt-3 space-y-2">
        <div
          v-for="(warning, index) in store.analysis.warnings"
          :key="'warning-' + index"
          class="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-50 border border-yellow-100"
        >
          <AlertTriangle class="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <span class="text-sm text-yellow-700">{{ warning }}</span>
        </div>
      </div>
    </div>

    <div class="border-t border-stone-100 pt-4 mt-auto">
      <div class="flex items-start gap-2 p-3 rounded-lg bg-stone-50 border border-stone-100">
        <AlertCircle class="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
        <div class="text-xs text-stone-600 leading-relaxed">
          <p class="font-medium text-stone-700 mb-1">使用说明</p>
          <p>1. 选择画笔工具绘制香线路径</p>
          <p>2. 调整线宽和密度参数</p>
          <p>3. 选择起燃点工具在路径上点击</p>
          <p>4. 红色标记为可能断火的风险点</p>
        </div>
      </div>
    </div>
  </div>
</template>
