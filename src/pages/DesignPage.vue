<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, Palette, Settings2 } from 'lucide-vue-next'
import IncenseCanvas from '@/components/design/IncenseCanvas.vue'
import ToolPanel from '@/components/design/ToolPanel.vue'
import AnalysisPanel from '@/components/design/AnalysisPanel.vue'
import SchemeBar from '@/components/design/SchemeBar.vue'
import BurnAnimationPanel from '@/components/design/BurnAnimationPanel.vue'
import ComparisonPanel from '@/components/design/ComparisonPanel.vue'
import PowderRecipeEditor from '@/components/adaptation/PowderRecipeEditor.vue'
import EnvironmentParamsInput from '@/components/adaptation/EnvironmentParamsInput.vue'
import AdaptationAnalysisPanel from '@/components/adaptation/AdaptationAnalysisPanel.vue'
import OptimizationSuggestions from '@/components/adaptation/OptimizationSuggestions.vue'
import ScenarioComparisonPanel from '@/components/adaptation/ScenarioComparisonPanel.vue'

type TabType = 'design' | 'adaptation'
const activeTab = ref<TabType>('adaptation')
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
          <div class="flex items-center gap-2 bg-stone-700/50 p-1 rounded-lg">
            <button
              @click="activeTab = 'design'"
              :class="[
                'flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all',
                activeTab === 'design'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-600/50',
              ]"
            >
              <Palette class="w-4 h-4" />
              图案设计
            </button>
            <button
              @click="activeTab = 'adaptation'"
              :class="[
                'flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all',
                activeTab === 'adaptation'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-600/50',
              ]"
            >
              <Settings2 class="w-4 h-4" />
              环境适配
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-6">
      <template v-if="activeTab === 'design'">
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
      </template>

      <template v-else>
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-4 flex flex-col gap-4">
            <PowderRecipeEditor />
            <EnvironmentParamsInput />
          </div>

          <div class="col-span-4 flex flex-col gap-4">
            <AdaptationAnalysisPanel />
            <OptimizationSuggestions />
          </div>

          <div class="col-span-4 flex flex-col gap-4">
            <ScenarioComparisonPanel />
          </div>
        </div>
      </template>
    </main>

    <footer class="mt-8 pb-6 text-center text-xs text-stone-400">
      <p>香篆灰线设计器 - 传统香道艺术与现代计算的结合</p>
    </footer>
  </div>
</template>
