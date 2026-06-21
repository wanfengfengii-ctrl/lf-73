<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import IncenseCanvas from '@/components/design/IncenseCanvas.vue'
import ToolPanel from '@/components/design/ToolPanel.vue'
import AnalysisPanel from '@/components/design/AnalysisPanel.vue'
import SchemeBar from '@/components/design/SchemeBar.vue'
import BurnAnimationPanel from '@/components/design/BurnAnimationPanel.vue'
import ComparisonPanel from '@/components/design/ComparisonPanel.vue'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100">
    <header class="bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Sparkles class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-wide">香篆灰线设计器</h1>
              <p class="text-xs text-stone-400">Incense Pattern Designer</p>
            </div>
          </div>
          <div class="text-sm text-stone-400">
            绘制香篆 · 估算燃烧 · 创意设计
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-6">
      <div class="flex gap-6 mb-6">
        <div class="flex flex-col gap-4">
          <ToolPanel />
          <BurnAnimationPanel />
        </div>

        <div class="flex-1 flex flex-col items-center gap-4">
          <div class="relative">
            <IncenseCanvas />
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <AnalysisPanel />
          <ComparisonPanel />
        </div>
      </div>

      <SchemeBar />
    </main>

    <footer class="mt-8 pb-6 text-center text-xs text-stone-400">
      <p>香篆灰线设计器 - 传统香道艺术与现代计算的结合</p>
    </footer>
  </div>
</template>
