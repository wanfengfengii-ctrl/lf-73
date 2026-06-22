<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Sparkles, GraduationCap } from 'lucide-vue-next'
import type { TeachingTemplate, LearningReport } from '@/types/incense'
import { useTeaching } from '@/composables/useTeaching'
import { useLearningReport } from '@/composables/useLearningReport'
import TemplateSelector from '@/components/teaching/TemplateSelector.vue'
import StepGuide from '@/components/teaching/StepGuide.vue'
import PracticeScoreCard from '@/components/teaching/PracticeScoreCard.vue'
import LearningReportPanel from '@/components/teaching/LearningReportPanel.vue'
import PowderRecipeEditor from '@/components/adaptation/PowderRecipeEditor.vue'
import EnvironmentParamsInput from '@/components/adaptation/EnvironmentParamsInput.vue'
import AdaptationAnalysisPanel from '@/components/adaptation/AdaptationAnalysisPanel.vue'
import IncenseCanvas from '@/components/design/IncenseCanvas.vue'
import ToolPanel from '@/components/design/ToolPanel.vue'
import AnalysisPanel from '@/components/design/AnalysisPanel.vue'

type ViewMode = 'select' | 'practice' | 'score' | 'report'

const {
  currentTemplate,
  currentPractice,
  currentStep,
  practiceMode,
  loadPracticeRecords,
  selectTemplate,
  startPractice,
  reset,
  updateTracingData,
} = useTeaching()

const { generateAndSaveReport, getReportForPractice } = useLearningReport()

const viewMode = ref<ViewMode>('select')
const selectedTemplate = ref<TeachingTemplate | null>(null)
const currentReport = ref<LearningReport | null>(null)
const showModeSelector = ref(false)

onMounted(() => {
  loadPracticeRecords()
})

function handleSelectTemplate(template: TeachingTemplate) {
  selectedTemplate.value = template
  selectTemplate(template.id)
  showModeSelector.value = true
}

function handleStartPractice(mode: 'tracing' | 'free' | 'challenge') {
  showModeSelector.value = false
  startPractice(mode)
  viewMode.value = 'practice'
}

function handlePracticeComplete() {
  if (currentPractice.value && currentPractice.value.score) {
    viewMode.value = 'score'
  }
}

function handleCancelPractice() {
  reset()
  viewMode.value = 'select'
  selectedTemplate.value = null
}

function handleViewReport() {
  if (currentPractice.value) {
    currentReport.value = generateAndSaveReport(currentPractice.value)
    viewMode.value = 'report'
  }
}

function handleRetry() {
  if (selectedTemplate.value) {
    selectTemplate(selectedTemplate.value.id)
    showModeSelector.value = true
  }
}

function handleNext() {
  if (currentPractice.value && selectedTemplate.value) {
    reset()
    selectTemplate(selectedTemplate.value.id)
    showModeSelector.value = true
  }
}

function handleCloseReport() {
  viewMode.value = 'select'
  reset()
  selectedTemplate.value = null
}

function handleSelectTemplateFromReport(templateId: string) {
  currentReport.value = null
  viewMode.value = 'select'
  reset()
  const template = useTeaching().templates.value.find((t) => t.id === templateId)
  if (template) {
    handleSelectTemplate(template)
  }
}

watch(
  () => currentStep.value?.type,
  (type) => {
    if (type === 'path' && currentPractice.value) {
      const path = currentPractice.value.userPath
      if (path && path.points.length > 0 && selectedTemplate.value?.targetScheme?.path.points) {
        updateTracingData(selectedTemplate.value.targetScheme.path.points, path.points)
      }
    }
  }
)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100">
    <header class="bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-lg">
              <GraduationCap class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold tracking-wide">香篆教学中心</h1>
              <p class="text-xs text-stone-400">Incense Teaching Center</p>
            </div>
          </div>
          <div class="flex items-center gap-2 bg-stone-700/50 px-4 py-2 rounded-lg">
            <Sparkles class="w-4 h-4 text-amber-400" />
            <span class="text-sm text-stone-300">系统学习，快速掌握香篆技艺</span>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-6">
      <template v-if="viewMode === 'select'">
        <TemplateSelector @select="handleSelectTemplate" />

        <div
          v-if="showModeSelector && selectedTemplate"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showModeSelector = false"
        >
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-300">
            <div class="text-center mb-6">
              <div class="text-5xl mb-3">{{ selectedTemplate.icon }}</div>
              <h3 class="text-2xl font-bold text-stone-800 mb-2">{{ selectedTemplate.name }}</h3>
              <p class="text-stone-600">{{ selectedTemplate.description }}</p>
            </div>

            <div class="mb-6">
              <h4 class="font-semibold text-stone-700 mb-3">选择练习模式</h4>
              <div class="space-y-3">
                <button
                  @click="handleStartPractice('tracing')"
                  class="w-full p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all text-left group"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                      ✏️
                    </div>
                    <div class="flex-1">
                      <h5 class="font-bold text-blue-800">临摹练习</h5>
                      <p class="text-sm text-blue-600">跟随模板路径绘制，适合初学者</p>
                    </div>
                  </div>
                </button>

                <button
                  @click="handleStartPractice('free')"
                  class="w-full p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100 transition-all text-left group"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                      🎨
                    </div>
                    <div class="flex-1">
                      <h5 class="font-bold text-green-800">自由练习</h5>
                      <p class="text-sm text-green-600">按照步骤要求自主创作，巩固学习成果</p>
                    </div>
                  </div>
                </button>

                <button
                  @click="handleStartPractice('challenge')"
                  class="w-full p-4 rounded-xl border-2 border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100 transition-all text-left group"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform">
                      🏆
                    </div>
                    <div class="flex-1">
                      <h5 class="font-bold text-orange-800">挑战模式</h5>
                      <p class="text-sm text-orange-600">限时完成，减少提示，挑战更高评分</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <button
              @click="showModeSelector = false"
              class="w-full py-3 text-stone-500 hover:text-stone-700 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="viewMode === 'practice' && currentStep">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-5 flex flex-col gap-4">
            <div class="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden" style="height: calc(100vh - 160px)">
              <StepGuide @complete="handlePracticeComplete" @cancel="handleCancelPractice" />
            </div>
          </div>

          <div class="col-span-7 flex flex-col gap-4">
            <template v-if="currentStep.type === 'recipe'">
              <div class="grid grid-cols-2 gap-4">
                <PowderRecipeEditor />
                <EnvironmentParamsInput />
              </div>
              <AdaptationAnalysisPanel />
            </template>

            <template v-else-if="currentStep.type === 'ashbed'">
              <div class="grid grid-cols-2 gap-4">
                <EnvironmentParamsInput />
                <AdaptationAnalysisPanel />
              </div>
              <div class="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                <h3 class="font-bold text-lg text-stone-800 mb-4">灰床处理要点</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-stone-50 rounded-xl p-4">
                    <h4 class="font-semibold text-stone-700 mb-2">理想厚度</h4>
                    <p class="text-3xl font-bold text-amber-600">{{ currentTemplate?.targetEnvironment?.ashBedThickness || 5 }}mm</p>
                    <p class="text-sm text-stone-500 mt-1">约一枚硬币的厚度</p>
                  </div>
                  <div class="bg-stone-50 rounded-xl p-4">
                    <h4 class="font-semibold text-stone-700 mb-2">表面要求</h4>
                    <p class="text-3xl font-bold text-green-600">平整</p>
                    <p class="text-sm text-stone-500 mt-1">如镜面般光滑无凹凸</p>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="currentStep.type === 'path'">
              <div class="flex gap-4">
                <div class="flex flex-col gap-4">
                  <ToolPanel />
                </div>
                <div class="flex-1 flex flex-col items-center gap-4">
                  <div class="relative">
                    <IncenseCanvas />
                    <div
                      v-if="practiceMode === 'tracing' && selectedTemplate?.targetScheme"
                      class="absolute inset-0 pointer-events-none opacity-30"
                    >
                      <svg class="w-full h-full" viewBox="0 0 600 600">
                        <path
                          v-for="(stroke, idx) in selectedTemplate.targetScheme.path.strokes"
                          :key="idx"
                          :d="
                            stroke.length > 1
                              ? `M ${stroke[0].x} ${stroke[0].y} ` +
                                stroke.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
                              : ''
                          "
                          fill="none"
                          stroke="#9333ea"
                          stroke-width="8"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-dasharray="10 5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col gap-4 w-72">
                  <AnalysisPanel />
                </div>
              </div>
            </template>

            <template v-else-if="currentStep.type === 'ignition' || currentStep.type === 'recording'">
              <div class="bg-white rounded-2xl p-8 shadow-sm border border-stone-200">
                <div class="text-center">
                  <div class="text-6xl mb-4">
                    {{ currentStep.type === 'ignition' ? '🔥' : '📝' }}
                  </div>
                  <h3 class="text-2xl font-bold text-stone-800 mb-2">
                    {{ currentStep.type === 'ignition' ? '点燃操作' : '观察记录' }}
                  </h3>
                  <p class="text-stone-600 mb-6">
                    {{
                      currentStep.type === 'ignition'
                        ? '请按照步骤说明完成实际的香篆点燃操作'
                        : '请仔细观察燃烧过程，做好详细记录'
                    }}
                  </p>
                  <div class="max-w-md mx-auto bg-amber-50 rounded-xl p-6 border border-amber-200">
                    <h4 class="font-semibold text-amber-800 mb-3">操作提示</h4>
                    <ul class="text-left space-y-2 text-amber-700">
                      <li class="flex items-start gap-2">
                        <span>•</span>
                        <span>{{ currentStep.type === 'ignition' ? '使用打火机或线香从起燃点处点燃' : '使用计时器准确记录燃烧时间' }}</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span>•</span>
                        <span>{{ currentStep.type === 'ignition' ? '避免直接用风吹灭火焰' : '注意观察是否有断火现象' }}</span>
                      </li>
                      <li class="flex items-start gap-2">
                        <span>•</span>
                        <span>{{ currentStep.type === 'ignition' ? '观察火焰是否稳定传播' : '为最终的灰线拍摄清晰照片' }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <template v-else-if="viewMode === 'score' && currentPractice && currentPractice.score">
        <PracticeScoreCard
          :score="currentPractice.score"
          :practice="currentPractice"
          @retry="handleRetry"
          @next="handleNext"
          @view-report="handleViewReport"
        />
      </template>

      <template v-else-if="viewMode === 'report' && currentReport">
        <LearningReportPanel
          :report="currentReport"
          @close="handleCloseReport"
          @select-template="handleSelectTemplateFromReport"
        />
      </template>
    </main>

    <footer class="mt-8 pb-6 text-center text-xs text-stone-400">
      <p>香篆教学中心 - 循序渐进，掌握传统香道技艺</p>
    </footer>
  </div>
</template>
