<script setup lang="ts">import { computed, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, Lightbulb, AlertTriangle, CheckCircle, Clock, SkipForward, Pause, Play, X } from 'lucide-vue-next';
import { useTeaching } from '@/composables/useTeaching';
import { TEACHING_STEP_LABELS } from '@/types/incense';
import type { TeachingCheckItem } from '@/types/incense';
const emit = defineEmits<{
 (e: 'complete'): void;
 (e: 'cancel'): void;
}>();
const { currentTemplate, currentStep, currentStepIndex, totalSteps, progress, isFirstStep, isLastStep, isPaused, estimatedTotalTime, canUseHint, currentStepHintsUsed, manualChecks, currentPractice, nextStep, prevStep, skipStep, useHint, pausePractice, resumePractice, setManualCheck, validateCheckItem, validateCurrentStep, detectMistakes, updatePracticeRecipe, updatePracticeEnvironment } = useTeaching();
const showTips = ref(false);
const showMistakes = ref(false);
const validationResults = ref<{
 check: TeachingCheckItem;
 result: ReturnType<typeof validateCheckItem>;
}[]>([]);
const currentMistakes = ref<ReturnType<typeof detectMistakes>>([]);
const stepTypeIcon = computed(() => {
 const icons: Record<string, string> = {
 recipe: '⚖️',
 ashbed: '🏔️',
 path: '✏️',
 ignition: '🔥',
 recording: '📝',
 };
 return icons[currentStep.value?.type || 'recipe'] || '📋';
});
const stepTypeColor = computed(() => {
 const colors: Record<string, string> = {
 recipe: 'from-purple-400 to-indigo-500',
 ashbed: 'from-stone-400 to-stone-600',
 path: 'from-blue-400 to-cyan-500',
 ignition: 'from-orange-400 to-red-500',
 recording: 'from-green-400 to-emerald-500',
 };
 return colors[currentStep.value?.type || 'recipe'] || 'from-gray-400 to-gray-600';
});
watch(() => currentStepIndex.value, () => {
 refreshValidation();
}, { immediate: true });
function refreshValidation() {
 const validation = validateCurrentStep();
 validationResults.value = validation.results;
 currentMistakes.value = detectMistakes();
}
function handleNext() {
 refreshValidation();
 if (currentStep.value?.type === 'recipe' && currentPractice.value?.recipe) {
 updatePracticeRecipe(currentPractice.value.recipe);
 }
 if (currentStep.value?.type === 'ashbed' && currentPractice.value?.environment) {
 updatePracticeEnvironment(currentPractice.value.environment);
 }
 if (isLastStep.value) {
 emit('complete');
 }
 else {
 nextStep();
 }
}
function handleUseHint() {
 if (canUseHint.value) {
 useHint();
 showTips.value = true;
 }
}
function handlePauseResume() {
 if (isPaused.value) {
 resumePractice();
 }
 else {
 pausePractice();
 }
}
function toggleCheck(checkId: string) {
 const newValue = !manualChecks.value[checkId];
 setManualCheck(checkId, newValue);
 refreshValidation();
}
function getCheckResultClass(result: ReturnType<typeof validateCheckItem>) {
 if (result.valid) {
 return 'border-green-300 bg-green-50';
 }
 if (result.actualValue !== undefined) {
 return 'border-red-300 bg-red-50';
 }
 return 'border-stone-200 bg-white';
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between p-4 border-b border-stone-200 bg-white">
      <div class="flex items-center gap-3">
        <button
          @click="emit('cancel')"
          class="p-2 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5 text-stone-500" />
        </button>
        <div>
          <h2 class="font-bold text-stone-800">{{ currentTemplate?.name }}</h2>
          <div class="flex items-center gap-2 text-xs text-stone-500">
            <span>步骤 {{ currentStepIndex + 1 }} / {{ totalSteps }}</span>
            <span>·</span>
            <span>{{ TEACHING_STEP_LABELS[currentStep?.type || 'recipe'] }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="handlePauseResume"
          :class="[
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            isPaused
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200',
          ]"
        >
          <span class="flex items-center gap-1">
            <component :is="isPaused ? Play : Pause" class="w-4 h-4" />
            {{ isPaused ? '继续' : '暂停' }}
          </span>
        </button>
      </div>
    </div>

    <div class="px-4 py-3 bg-stone-50 border-b border-stone-200">
      <div class="flex items-center gap-4 mb-2">
        <div class="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <span class="text-sm font-medium text-stone-600">{{ progress }}%</span>
      </div>
      <div class="flex items-center justify-between text-xs text-stone-500">
        <div class="flex items-center gap-1">
          <Clock class="w-3 h-3" />
          <span>预计总时长: {{ estimatedTotalTime }} 分钟</span>
        </div>
        <div v-if="currentPractice" class="flex items-center gap-4">
          <span>提示使用: {{ currentPractice.hintsUsed }} 次</span>
          <span>错误: {{ currentPractice.mistakes.length }} 个</span>
        </div>
      </div>
    </div>

    <div v-if="isPaused" class="flex-1 flex items-center justify-center bg-stone-100">
      <div class="text-center">
        <div class="text-6xl mb-4">⏸️</div>
        <h3 class="text-xl font-bold text-stone-700 mb-2">练习已暂停</h3>
        <p class="text-stone-500 mb-4">点击继续按钮恢复练习</p>
        <button
          @click="handlePauseResume"
          class="px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
          继续练习
        </button>
      </div>
    </div>

    <div v-else-if="currentStep" class="flex-1 overflow-y-auto p-6 space-y-6">
      <div class="flex items-start gap-4">
        <div
          :class="[
            'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg flex-shrink-0',
            stepTypeColor,
          ]"
        >
          {{ stepTypeIcon }}
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full"
            >
              {{ TEACHING_STEP_LABELS[currentStep.type] }}
            </span>
            <span class="text-xs text-stone-400">
              预计 {{ currentStep.estimatedTime }} 分钟
            </span>
          </div>
          <h3 class="text-xl font-bold text-stone-800 mb-2">
            {{ currentStep.title }}
          </h3>
          <p class="text-stone-600">{{ currentStep.description }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div class="px-4 py-3 bg-stone-50 border-b border-stone-200">
          <h4 class="font-semibold text-stone-700">操作说明</h4>
        </div>
        <div class="p-4">
          <ol class="space-y-3">
            <li
              v-for="(instruction, idx) in currentStep.instructions"
              :key="idx"
              class="flex items-start gap-3"
            >
              <span class="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-medium">
                {{ idx + 1 }}
              </span>
              <span class="text-stone-700 pt-0.5">{{ instruction }}</span>
            </li>
          </ol>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden"
        >
          <button
            @click="showTips = !showTips"
            class="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
          >
            <div class="flex items-center gap-2">
              <Lightbulb class="w-5 h-5 text-amber-600" />
              <span class="font-semibold text-amber-800">技巧提示</span>
            </div>
            <ChevronRight
              :class="[
                'w-5 h-5 text-amber-500 transition-transform',
                showTips ? 'rotate-90' : '',
              ]"
            />
          </button>
          <div v-show="showTips" class="px-4 pb-4">
            <ul class="space-y-2">
              <li
                v-for="(tip, idx) in currentStep.tips"
                :key="idx"
                class="text-sm text-amber-900 flex items-start gap-2"
              >
                <span class="text-amber-500">•</span>
                {{ tip }}
              </li>
            </ul>
          </div>
        </div>

        <div
          :class="[
            'rounded-xl border overflow-hidden',
            currentMistakes.length > 0
              ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
          ]"
        >
          <button
            @click="showMistakes = !showMistakes"
            :class="[
              'w-full px-4 py-3 flex items-center justify-between transition-colors',
              currentMistakes.length > 0
                ? 'hover:bg-red-100/50'
                : 'hover:bg-green-100/50',
            ]"
          >
            <div class="flex items-center gap-2">
              <AlertTriangle
                v-if="currentMistakes.length > 0"
                class="w-5 h-5 text-red-600"
              />
              <CheckCircle v-else class="w-5 h-5 text-green-600" />
              <span
                :class="[
                  'font-semibold',
                  currentMistakes.length > 0 ? 'text-red-800' : 'text-green-800',
                ]"
              >
                {{
                  currentMistakes.length > 0
                    ? `检测到 ${currentMistakes.length} 个问题`
                    : '当前未检测到问题'
                }}
              </span>
            </div>
            <ChevronRight
              :class="[
                'w-5 h-5 transition-transform',
                showMistakes ? 'rotate-90' : '',
                currentMistakes.length > 0 ? 'text-red-500' : 'text-green-500',
              ]"
            />
          </button>
          <div v-show="showMistakes" class="px-4 pb-4">
            <div v-if="currentMistakes.length > 0" class="space-y-3">
              <div
                v-for="mistake in currentMistakes"
                :key="mistake.id"
                class="bg-white/80 rounded-lg p-3 border border-red-100"
              >
                <div class="flex items-start gap-2 mb-1">
                  <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span class="text-sm text-red-800 font-medium">{{ mistake.description }}</span>
                </div>
                <p class="text-xs text-stone-600 ml-6">💡 {{ mistake.suggestion }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-green-700">
              做得很好！继续保持，完成所有检查项后进入下一步。
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div class="px-4 py-3 bg-stone-50 border-b border-stone-200">
          <h4 class="font-semibold text-stone-700">检查清单</h4>
          <p class="text-xs text-stone-500 mt-1">完成所有检查项后才能进入下一步</p>
        </div>
        <div class="p-4 space-y-3">
          <div
            v-for="{ check, result } in validationResults"
            :key="check.id"
            :class="[
              'rounded-lg border-2 p-4 transition-all',
              getCheckResultClass(result),
            ]"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 pt-0.5">
                <div v-if="check.validatorType === 'manual'">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      :checked="manualChecks[check.id] || false"
                      @change="toggleCheck(check.id)"
                      class="sr-only peer"
                    />
                    <div
                      class="w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all"
                      :class="[
                        manualChecks[check.id]
                          ? 'bg-green-500 border-green-500'
                          : 'border-stone-300 hover:border-stone-400',
                      ]"
                    >
                      <CheckCircle
                        v-if="manualChecks[check.id]"
                        class="w-4 h-4 text-white"
                      />
                    </div>
                  </label>
                </div>
                <div v-else>
                  <CheckCircle
                    v-if="result.valid"
                    class="w-6 h-6 text-green-500"
                  />
                  <div
                    v-else
                    class="w-6 h-6 border-2 border-red-400 rounded-full flex items-center justify-center"
                  >
                    <span class="text-red-500 text-sm font-bold">!</span>
                  </div>
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-stone-800">{{ check.label }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 text-xs rounded-full',
                      check.validatorType === 'auto'
                        ? 'bg-blue-100 text-blue-700'
                        : check.validatorType === 'param'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-stone-100 text-stone-600',
                    ]"
                  >
                    {{
                      check.validatorType === 'auto'
                        ? '自动验证'
                        : check.validatorType === 'param'
                        ? '参数验证'
                        : '手动确认'
                    }}
                  </span>
                </div>
                <p class="text-sm text-stone-600">{{ check.description }}</p>
                <p
                  v-if="result.message"
                  :class="[
                    'text-xs mt-1',
                    result.valid ? 'text-green-600' : 'text-red-600',
                  ]"
                >
                  {{ result.message }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep.commonMistakes.length > 0" class="bg-stone-50 rounded-xl p-4">
        <h4 class="font-semibold text-stone-700 mb-3 flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-stone-500" />
          常见错误提醒
        </h4>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <li
            v-for="(mistake, idx) in currentStep.commonMistakes"
            :key="idx"
            class="text-sm text-stone-600 flex items-start gap-2"
          >
            <span class="text-red-400">⚠️</span>
            {{ mistake }}
          </li>
        </ul>
      </div>
    </div>

    <div class="p-4 bg-white border-t border-stone-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            @click="prevStep"
            :disabled="isFirstStep"
            :class="[
              'px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all',
              isFirstStep
                ? 'text-stone-300 cursor-not-allowed'
                : 'text-stone-600 hover:bg-stone-100',
            ]"
          >
            <ChevronLeft class="w-5 h-5" />
            上一步
          </button>
          <button
            @click="skipStep"
            class="px-4 py-2 rounded-lg font-medium text-stone-500 hover:bg-stone-100 flex items-center gap-2 transition-all"
          >
            <SkipForward class="w-4 h-4" />
            跳过
          </button>
          <button
            @click="handleUseHint"
            :disabled="!canUseHint"
            :class="[
              'px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all',
              canUseHint
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed',
            ]"
          >
            <Lightbulb class="w-4 h-4" />
            获取提示 ({{ currentStepHintsUsed }}/3)
          </button>
        </div>
        <button
          @click="handleNext"
          :disabled="!validateCurrentStep().valid"
          :class="[
            'px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all',
            validateCurrentStep().valid
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-lg hover:-translate-y-0.5'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed',
          ]"
        >
          {{ isLastStep ? '完成练习' : '下一步' }}
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
