import { ref, computed } from 'vue'
import type {
  TeachingTemplate,
  TeachingStep,
  PracticeRecord,
  PracticeMode,
  PracticeStatus,
  StepAction,
  CommonMistakeRecord,
  TracingData,
  StepScore,
  PracticeScore,
  PathPoint,
  TeachingCheckItem,
  PowderIngredient,
  EnvironmentParams,
} from '@/types/incense'
import {
  DEFAULT_STEP_SCORE,
  HINT_PENALTY,
  MAX_HINTS_PER_STEP,
  TRACING_SIMILARITY_THRESHOLD,
  PATH_DEVIATION_TOLERANCE,
  GRADE_THRESHOLDS,
  SCORE_CATEGORIES,
  COMMON_MISTAKE_TYPES,
  PRACTICE_STORAGE_KEY,
  DEVIATION_SEVERITY_LOW,
  DEVIATION_SEVERITY_MEDIUM,
  DEVIATION_SEVERITY_HIGH,
  BINDER_MIN_RATIO,
  BINDER_MAX_RATIO,
  MIN_LINE_WIDTH,
  MAX_LINE_WIDTH,
} from '@/utils/constants'
import { TEACHING_TEMPLATES, getTemplateById } from '@/data/teachingTemplates'
import { distance } from '@/utils/geometry'
import { useDesignStore } from '@/stores/designStore'
import { useEnvironmentAdaptation } from '@/composables/useEnvironmentAdaptation'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function getBinderRatio(ingredients: PowderIngredient[]): number {
  const binderNames = ['楠木粘粉', '榆树皮粉', '粘粉']
  const binderTotal = ingredients
    .filter((i) => binderNames.some((b) => i.name.includes(b)))
    .reduce((sum, i) => sum + i.ratio, 0)
  const total = ingredients.reduce((sum, i) => sum + i.ratio, 0)
  return total > 0 ? (binderTotal / total) * 100 : 0
}

export function useTeaching() {
  const designStore = useDesignStore()
  const envAdaptation = useEnvironmentAdaptation()

  const templates = ref<TeachingTemplate[]>(TEACHING_TEMPLATES)
  const currentTemplate = ref<TeachingTemplate | null>(null)
  const currentPractice = ref<PracticeRecord | null>(null)
  const currentStepIndex = ref(0)
  const practiceMode = ref<PracticeMode>('tracing')
  const showHints = ref(true)
  const manualChecks = ref<Record<string, boolean>>({})
  const stepStartTime = ref<number>(0)
  const isPaused = ref(false)
  const practiceRecords = ref<PracticeRecord[]>([])

  const currentStep = computed<TeachingStep | null>(() => {
    if (!currentTemplate.value) return null
    return currentTemplate.value.steps[currentStepIndex.value] || null
  })

  const totalSteps = computed(() => {
    return currentTemplate.value?.steps.length || 0
  })

  const isFirstStep = computed(() => currentStepIndex.value === 0)
  const isLastStep = computed(() => currentStepIndex.value === totalSteps.value - 1)

  const progress = computed(() => {
    if (totalSteps.value === 0) return 0
    return Math.round((currentStepIndex.value / totalSteps.value) * 100)
  })

  const estimatedTotalTime = computed(() => {
    if (!currentTemplate.value) return 0
    return currentTemplate.value.steps.reduce((sum, s) => sum + s.estimatedTime, 0)
  })

  const currentStepHintsUsed = computed(() => {
    if (!currentPractice.value || !currentStep.value) return 0
    return currentPractice.value.actions.filter(
      (a) => a.stepId === currentStep.value!.id && a.action === 'hint'
    ).length
  })

  const canUseHint = computed(() => {
    return currentStepHintsUsed.value < MAX_HINTS_PER_STEP
  })

  function loadPracticeRecords() {
    try {
      const stored = localStorage.getItem(PRACTICE_STORAGE_KEY)
      if (stored) {
        practiceRecords.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load practice records:', e)
    }
  }

  function savePracticeRecords() {
    try {
      localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(practiceRecords.value))
    } catch (e) {
      console.error('Failed to save practice records:', e)
    }
  }

  function selectTemplate(templateId: string) {
    const template = getTemplateById(templateId)
    if (template) {
      currentTemplate.value = template
      currentStepIndex.value = 0
      manualChecks.value = {}
    }
  }

  function startPractice(mode: PracticeMode = 'tracing') {
    if (!currentTemplate.value) return

    practiceMode.value = mode
    stepStartTime.value = Date.now()
    isPaused.value = false

    const practice: PracticeRecord = {
      id: generateId(),
      templateId: currentTemplate.value.id,
      templateName: currentTemplate.value.name,
      mode,
      status: 'in_progress',
      startedAt: Date.now(),
      currentStepIndex: 0,
      completedSteps: [],
      actions: [],
      mistakes: [],
      timeSpent: 0,
      hintsUsed: 0,
    }

    if (currentTemplate.value.targetRecipe) {
      practice.recipe = JSON.parse(JSON.stringify(currentTemplate.value.targetRecipe))
    }
    if (currentTemplate.value.targetEnvironment) {
      practice.environment = JSON.parse(JSON.stringify(currentTemplate.value.targetEnvironment))
    }

    currentPractice.value = practice
    addAction('start')

    applyTemplateSettings()
  }

  function applyTemplateSettings() {
    if (!currentTemplate.value) return

    if (currentTemplate.value.targetRecipe) {
      envAdaptation.ingredients.value = JSON.parse(
        JSON.stringify(currentTemplate.value.targetRecipe)
      )
    }
    if (currentTemplate.value.targetEnvironment) {
      envAdaptation.environment.value = JSON.parse(
        JSON.stringify(currentTemplate.value.targetEnvironment)
      )
    }

    designStore.reset()
  }

  function addAction(action: StepAction['action'], data?: Record<string, unknown>) {
    if (!currentPractice.value || !currentStep.value) return

    const stepAction: StepAction = {
      id: generateId(),
      stepId: currentStep.value.id,
      action,
      timestamp: Date.now(),
      data,
    }

    currentPractice.value.actions.push(stepAction)

    if (action === 'hint') {
      currentPractice.value.hintsUsed++
    }
  }

  function setManualCheck(checkId: string, checked: boolean) {
    manualChecks.value[checkId] = checked
  }

  function validateCheckItem(check: TeachingCheckItem): { valid: boolean; actualValue?: number; message?: string } {
    if (check.validatorType === 'manual') {
      return { valid: manualChecks.value[check.id] || false }
    }

    if (check.validatorType === 'param') {
      let actualValue: number | undefined
      const target = check.targetValue ?? 0
      const tolerance = check.tolerance ?? 0

      switch (check.parameter) {
        case 'totalRatio':
          actualValue = envAdaptation.totalRatio.value
          break
        case 'binderRatio':
          actualValue = envAdaptation.binderRatio.value
          break
        case 'ashBedThickness':
          actualValue = envAdaptation.environment.value.ashBedThickness
          break
        case 'lineWidth':
          actualValue = designStore.lineWidth
          break
      }

      if (actualValue === undefined) {
        return { valid: false, message: '无法验证该参数' }
      }

      const valid = Math.abs(actualValue - target) <= tolerance
      return {
        valid,
        actualValue,
        message: valid ? '参数符合要求' : `当前值 ${actualValue.toFixed(1)}，目标值 ${target}±${tolerance}`,
      }
    }

    if (check.validatorType === 'auto') {
      switch (check.id) {
        case 'check_continuous':
          return { valid: designStore.analysis.isValid, message: designStore.analysis.isValid ? '路径连续' : '路径存在断点' }
        case 'check_ignition':
          return { valid: designStore.ignitionPoint !== null, message: designStore.ignitionPoint ? '已设置起燃点' : '请设置起燃点' }
        case 'check_similarity':
          if (currentPractice.value?.tracingData) {
            const similarity = currentPractice.value.tracingData.similarityScore
            return {
              valid: similarity >= TRACING_SIMILARITY_THRESHOLD,
              actualValue: similarity,
              message: `相似度 ${similarity.toFixed(1)}%，目标 ${TRACING_SIMILARITY_THRESHOLD}%`,
            }
          }
          return { valid: false, message: '请先完成临摹绘制' }
        case 'check_time':
          return { valid: currentPractice.value?.timeSpent > 0, message: '请记录燃烧时长' }
        case 'check_score':
          return { valid: true, message: '评分已记录' }
        default:
          return { valid: true }
      }
    }

    return { valid: false }
  }

  function validateCurrentStep(): { valid: boolean; results: { check: TeachingCheckItem; result: ReturnType<typeof validateCheckItem> }[] } {
    if (!currentStep.value) return { valid: false, results: [] }

    const results = currentStep.value.requiredChecks.map((check) => ({
      check,
      result: validateCheckItem(check),
    }))

    const valid = results.every((r) => r.result.valid)
    return { valid, results }
  }

  function detectMistakes(): CommonMistakeRecord[] {
    const mistakes: CommonMistakeRecord[] = []

    if (!currentPractice.value || !currentStep.value) return mistakes

    const step = currentStep.value
    const recipe = currentPractice.value.recipe
    const environment = currentPractice.value.environment

    if (step.type === 'recipe' && recipe) {
      const totalRatio = recipe.reduce((sum, i) => sum + i.ratio, 0)
      const binderRatio = getBinderRatio(recipe)

      if (Math.abs(totalRatio - 100) > 1) {
        mistakes.push(createMistake('recipe_wrong_ratio', `配方比例总和为 ${totalRatio.toFixed(1)}%，不是100%`, step.id))
      }

      if (binderRatio < BINDER_MIN_RATIO) {
        mistakes.push(createMistake('recipe_low_binder', `粘粉比例仅 ${binderRatio.toFixed(1)}%，低于最低要求 ${BINDER_MIN_RATIO}%`, step.id, 'high'))
      }

      if (binderRatio > BINDER_MAX_RATIO) {
        mistakes.push(createMistake('recipe_high_binder', `粘粉比例 ${binderRatio.toFixed(1)}%，偏高`, step.id, 'medium'))
      }
    }

    if (step.type === 'ashbed' && environment) {
      const thickness = environment.ashBedThickness
      if (thickness < 3) {
        mistakes.push(createMistake('ashbed_too_thin', `灰床厚度仅 ${thickness}mm，太薄`, step.id, 'high'))
      }
      if (thickness > 10) {
        mistakes.push(createMistake('ashbed_too_thick', `灰床厚度 ${thickness}mm，太厚`, step.id, 'medium'))
      }
    }

    if (step.type === 'path') {
      const analysis = designStore.analysis

      if (!analysis.isValid && analysis.errors.some((e) => e.includes('断点'))) {
        mistakes.push(createMistake('path_discontinuous', '路径存在断点，不连续', step.id, 'high'))
      }

      if (analysis.overlaps.length > 3) {
        mistakes.push(createMistake('path_overlapping', `路径重叠 ${analysis.overlaps.length} 处`, step.id, 'medium'))
      }

      if (designStore.lineWidth < MIN_LINE_WIDTH) {
        mistakes.push(createMistake('path_too_thin', `线宽 ${designStore.lineWidth} 像素，太细`, step.id, 'low'))
      }

      if (designStore.lineWidth > MAX_LINE_WIDTH) {
        mistakes.push(createMistake('path_too_thick', `线宽 ${designStore.lineWidth} 像素，太粗`, step.id, 'low'))
      }

      if (!designStore.ignitionPoint) {
        mistakes.push(createMistake('path_no_ignition', '未设置起燃点', step.id, 'high'))
      }
    }

    return mistakes
  }

  function createMistake(type: string, description: string, stepId: string, severity?: 'low' | 'medium' | 'high'): CommonMistakeRecord {
    const mistakeType = COMMON_MISTAKE_TYPES.find((m) => m.type === type)
    return {
      id: generateId(),
      type,
      description,
      severity: severity || mistakeType?.severity || 'medium',
      stepId,
      suggestion: getSuggestionForMistake(type),
      timestamp: Date.now(),
    }
  }

  function getSuggestionForMistake(type: string): string {
    const suggestions: Record<string, string> = {
      recipe_wrong_ratio: '请调整各原料比例，确保总和为100%',
      recipe_low_binder: '请增加楠木粘粉或榆树皮粉的比例至10%以上',
      recipe_high_binder: '请减少粘粉比例，控制在30%以内',
      ashbed_too_thin: '请增加香灰，加厚灰床至4-6mm',
      ashbed_too_thick: '请刮掉部分香灰，保持厚度在8mm以内',
      ashbed_uneven: '请使用灰押重新压平灰床表面',
      path_discontinuous: '请检查并修复路径断点，确保路径连续',
      path_overlapping: '请优化路径，减少不必要的重叠',
      path_too_thin: '请增加线宽，建议3-6像素',
      path_too_thick: '请减小线宽，建议3-6像素',
      path_no_ignition: '请使用起燃工具在路径上设置起燃点',
      path_ignition_off: '请将起燃点移动到香线路径上',
      ignition_failure: '请检查香粉是否紧实，重新尝试点燃',
      ignition_partial: '请检查环境条件，使用线香接引断火处',
      recording_incomplete: '请补充完整的燃烧记录数据',
      timing_too_slow: '尝试提高操作速度，避免香粉受潮',
      timing_too_fast: '注意操作质量，不要过于追求速度',
    }
    return suggestions[type] || '请检查操作并改进'
  }

  function calculatePathSimilarity(templatePath: PathPoint[], userPath: PathPoint[]): TracingData {
    if (templatePath.length === 0 || userPath.length === 0) {
      return {
        templatePath,
        userPath,
        similarityScore: 0,
        deviationPoints: [],
      }
    }

    const sampledTemplate = samplePath(templatePath, 100)
    const sampledUser = samplePath(userPath, 100)

    let totalDistance = 0
    const deviationPoints: { point: PathPoint; distance: number }[] = []

    for (let i = 0; i < sampledTemplate.length; i++) {
      const templatePoint = sampledTemplate[i]
      const userPoint = sampledUser[i]
      const dist = distance(templatePoint, userPoint)
      totalDistance += dist

      if (dist > PATH_DEVIATION_TOLERANCE) {
        deviationPoints.push({ point: userPoint, distance: dist })
      }
    }

    const avgDistance = totalDistance / sampledTemplate.length
    const maxDeviation = 100
    const similarityScore = Math.max(0, Math.min(100, 100 - (avgDistance / maxDeviation) * 100))

    return {
      templatePath,
      userPath,
      similarityScore: Math.round(similarityScore * 10) / 10,
      deviationPoints,
    }
  }

  function samplePath(path: PathPoint[], targetCount: number): PathPoint[] {
    if (path.length <= targetCount) return path

    const sampled: PathPoint[] = []
    const step = (path.length - 1) / (targetCount - 1)

    for (let i = 0; i < targetCount; i++) {
      const index = Math.round(i * step)
      sampled.push(path[Math.min(index, path.length - 1)])
    }

    return sampled
  }

  function calculateStepScore(step: TeachingStep): StepScore {
    if (!currentPractice.value) {
      return { stepId: step.id, score: 0, maxScore: DEFAULT_STEP_SCORE, deductions: [], bonuses: [] }
    }

    let score = DEFAULT_STEP_SCORE
    const deductions: { reason: string; points: number }[] = []
    const bonuses: { reason: string; points: number }[] = []

    const hintsUsed = currentPractice.value.actions.filter(
      (a) => a.stepId === step.id && a.action === 'hint'
    ).length

    if (hintsUsed > 0) {
      const deduction = hintsUsed * HINT_PENALTY
      deductions.push({ reason: `使用提示 ${hintsUsed} 次`, points: deduction })
      score -= deduction
    }

    const stepMistakes = currentPractice.value.mistakes.filter((m) => m.stepId === step.id)
    for (const mistake of stepMistakes) {
      const penalty = mistake.severity === 'high' ? 5 : mistake.severity === 'medium' ? 3 : 1
      deductions.push({ reason: mistake.description, points: penalty })
      score -= penalty
    }

    const stepStartTime = currentPractice.value.actions.find(
      (a) => a.stepId === step.id && a.action === 'start'
    )?.timestamp
    const stepEndTime = currentPractice.value.actions.find(
      (a) => a.stepId === step.id && a.action === 'complete'
    )?.timestamp

    if (stepStartTime && stepEndTime) {
      const timeSpent = (stepEndTime - stepStartTime) / 60000
      const estimatedTime = step.estimatedTime
      const timeRatio = timeSpent / estimatedTime

      if (timeRatio > 2) {
        deductions.push({ reason: `操作过慢（${timeSpent.toFixed(1)}分钟，预期${estimatedTime}分钟）`, points: 2 })
        score -= 2
      } else if (timeRatio < 0.5) {
        deductions.push({ reason: `操作过快（${timeSpent.toFixed(1)}分钟，预期${estimatedTime}分钟）`, points: 1 })
        score -= 1
      } else if (timeRatio > 0.8 && timeRatio < 1.2) {
        bonuses.push({ reason: '时间控制精准', points: 2 })
        score += 2
      }
    }

    const validation = validateCurrentStep()
    if (validation.valid) {
      bonuses.push({ reason: '全部检查项通过', points: 3 })
      score += 3
    }

    score = Math.max(0, Math.min(DEFAULT_STEP_SCORE + 5, score))

    return {
      stepId: step.id,
      score,
      maxScore: DEFAULT_STEP_SCORE,
      deductions,
      bonuses,
    }
  }

  function calculateOverallScore(): PracticeScore {
    if (!currentTemplate.value || !currentPractice.value) {
      return {
        totalScore: 0,
        maxScore: 100,
        percentage: 0,
        grade: 'F',
        stepScores: [],
        accuracyScore: 0,
        techniqueScore: 0,
        timingScore: 0,
        completenessScore: 0,
      }
    }

    const stepScores: StepScore[] = []
    let totalStepScore = 0
    let maxStepScore = 0

    for (const step of currentTemplate.value.steps) {
      const stepScore = calculateStepScore(step)
      stepScores.push(stepScore)
      totalStepScore += stepScore.score
      maxStepScore += stepScore.maxScore
    }

    const baseScore = maxStepScore > 0 ? (totalStepScore / maxStepScore) * 70 : 0

    let accuracyScore = 70
    if (currentPractice.value.tracingData) {
      accuracyScore = currentPractice.value.tracingData.similarityScore
    }
    accuracyScore = Math.min(100, accuracyScore)

    const totalMistakes = currentPractice.value.mistakes.length
    const highMistakes = currentPractice.value.mistakes.filter((m) => m.severity === 'high').length
    let techniqueScore = 100 - totalMistakes * 3 - highMistakes * 5
    techniqueScore = Math.max(0, Math.min(100, techniqueScore))

    const totalTime = currentPractice.value.timeSpent / 60
    const expectedTime = estimatedTotalTime.value
    let timingScore = 100
    if (totalTime > 0 && expectedTime > 0) {
      const timeRatio = totalTime / expectedTime
      if (timeRatio > 1) {
        timingScore = Math.max(0, 100 - (timeRatio - 1) * 50)
      } else if (timeRatio < 0.5) {
        timingScore = Math.max(0, 80)
      }
    }
    timingScore = Math.min(100, Math.max(0, timingScore))

    const completedSteps = currentPractice.value.completedSteps.length
    const completenessScore = totalSteps.value > 0 ? (completedSteps / totalSteps.value) * 100 : 0

    const weightedScore =
      baseScore +
      accuracyScore * SCORE_CATEGORIES.accuracy.weight +
      techniqueScore * SCORE_CATEGORIES.technique.weight +
      timingScore * SCORE_CATEGORIES.timing.weight +
      completenessScore * SCORE_CATEGORIES.completeness.weight

    const finalScore = Math.round(weightedScore)
    const maxScore = 100
    const percentage = Math.round((finalScore / maxScore) * 100)

    let grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F'
    if (finalScore >= GRADE_THRESHOLDS.S) grade = 'S'
    else if (finalScore >= GRADE_THRESHOLDS.A) grade = 'A'
    else if (finalScore >= GRADE_THRESHOLDS.B) grade = 'B'
    else if (finalScore >= GRADE_THRESHOLDS.C) grade = 'C'
    else if (finalScore >= GRADE_THRESHOLDS.D) grade = 'D'

    return {
      totalScore: finalScore,
      maxScore,
      percentage,
      grade,
      stepScores,
      accuracyScore: Math.round(accuracyScore),
      techniqueScore: Math.round(techniqueScore),
      timingScore: Math.round(timingScore),
      completenessScore: Math.round(completenessScore),
    }
  }

  function nextStep() {
    if (!currentPractice.value || !currentStep.value) return

    addAction('complete')

    const stepMistakes = detectMistakes()
    for (const mistake of stepMistakes) {
      addAction('mistake', { mistakeType: mistake.type })
      if (!currentPractice.value.mistakes.some((m) => m.type === mistake.type && m.stepId === mistake.stepId)) {
        currentPractice.value.mistakes.push(mistake)
      }
    }

    if (!currentPractice.value.completedSteps.includes(currentStep.value.id)) {
      currentPractice.value.completedSteps.push(currentStep.value.id)
    }

    const now = Date.now()
    currentPractice.value.timeSpent += now - stepStartTime.value

    if (isLastStep.value) {
      completePractice()
    } else {
      currentStepIndex.value++
      currentPractice.value.currentStepIndex = currentStepIndex.value
      stepStartTime.value = now
      addAction('start')
    }

    saveCurrentPractice()
  }

  function prevStep() {
    if (isFirstStep.value || !currentPractice.value) return

    currentStepIndex.value--
    currentPractice.value.currentStepIndex = currentStepIndex.value
    stepStartTime.value = Date.now()
    saveCurrentPractice()
  }

  function skipStep() {
    if (!currentPractice.value || !currentStep.value) return

    addAction('skip')

    if (isLastStep.value) {
      completePractice()
    } else {
      currentStepIndex.value++
      currentPractice.value.currentStepIndex = currentStepIndex.value
      stepStartTime.value = Date.now()
      addAction('start')
    }

    saveCurrentPractice()
  }

  function useHint() {
    if (!canUseHint.value) return
    addAction('hint')
    saveCurrentPractice()
  }

  function completePractice() {
    if (!currentPractice.value) return

    const now = Date.now()
    currentPractice.value.completedAt = now
    currentPractice.value.timeSpent += now - stepStartTime.value
    currentPractice.value.status = 'completed'

    if (practiceMode.value === 'tracing') {
      currentPractice.value.userPath = JSON.parse(JSON.stringify(designStore.currentPath))
    }

    const score = calculateOverallScore()
    currentPractice.value.score = score

    practiceRecords.value.unshift(currentPractice.value)
    savePracticeRecords()
  }

  function saveCurrentPractice() {
    if (!currentPractice.value) return

    const index = practiceRecords.value.findIndex((p) => p.id === currentPractice.value!.id)
    if (index !== -1) {
      practiceRecords.value[index] = { ...currentPractice.value }
    } else {
      practiceRecords.value.unshift({ ...currentPractice.value })
    }
    savePracticeRecords()
  }

  function pausePractice() {
    if (!currentPractice.value) return

    isPaused.value = true
    currentPractice.value.status = 'paused'
    const now = Date.now()
    currentPractice.value.timeSpent += now - stepStartTime.value
    saveCurrentPractice()
  }

  function resumePractice() {
    if (!currentPractice.value) return

    isPaused.value = false
    currentPractice.value.status = 'in_progress'
    stepStartTime.value = Date.now()
    saveCurrentPractice()
  }

  function loadPractice(practiceId: string) {
    const practice = practiceRecords.value.find((p) => p.id === practiceId)
    if (!practice) return

    currentPractice.value = { ...practice }
    const template = getTemplateById(practice.templateId)
    if (template) {
      currentTemplate.value = template
      currentStepIndex.value = practice.currentStepIndex
    }

    manualChecks.value = {}
    stepStartTime.value = Date.now()

    if (practice.recipe) {
      envAdaptation.ingredients.value = JSON.parse(JSON.stringify(practice.recipe))
    }
    if (practice.environment) {
      envAdaptation.environment.value = JSON.parse(JSON.stringify(practice.environment))
    }
  }

  function updateTracingData(templatePath: PathPoint[], userPath: PathPoint[]) {
    if (!currentPractice.value) return

    const tracingData = calculatePathSimilarity(templatePath, userPath)
    currentPractice.value.tracingData = tracingData
    saveCurrentPractice()
  }

  function updatePracticeRecipe(recipe: PowderIngredient[]) {
    if (!currentPractice.value) return
    currentPractice.value.recipe = JSON.parse(JSON.stringify(recipe))
    saveCurrentPractice()
  }

  function updatePracticeEnvironment(env: EnvironmentParams) {
    if (!currentPractice.value) return
    currentPractice.value.environment = JSON.parse(JSON.stringify(env))
    saveCurrentPractice()
  }

  function getCompletedPractices(): PracticeRecord[] {
    return practiceRecords.value.filter((p) => p.status === 'completed' || p.status === 'reviewed')
  }

  function getInProgressPractices(): PracticeRecord[] {
    return practiceRecords.value.filter((p) => p.status === 'in_progress' || p.status === 'paused')
  }

  function getPracticeStats() {
    const completed = getCompletedPractices()
    if (completed.length === 0) {
      return {
        totalPractices: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpent: 0,
        masteredTemplates: [] as string[],
      }
    }

    const scores = completed.map((p) => p.score?.totalScore ?? 0)
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const bestScore = Math.max(...scores)
    const totalTimeSpent = completed.reduce((sum, p) => sum + p.timeSpent, 0)

    const mastered = completed
      .filter((p) => p.score?.grade === 'S' || p.score?.grade === 'A')
      .map((p) => p.templateId)

    return {
      totalPractices: completed.length,
      averageScore: Math.round(averageScore),
      bestScore,
      totalTimeSpent: Math.round(totalTimeSpent / 60000),
      masteredTemplates: [...new Set(mastered)],
    }
  }

  function reset() {
    currentTemplate.value = null
    currentPractice.value = null
    currentStepIndex.value = 0
    practiceMode.value = 'tracing'
    showHints.value = true
    manualChecks.value = {}
    stepStartTime.value = 0
    isPaused.value = false
  }

  return {
    templates,
    currentTemplate,
    currentPractice,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    practiceMode,
    showHints,
    isFirstStep,
    isLastStep,
    isPaused,
    estimatedTotalTime,
    canUseHint,
    currentStepHintsUsed,
    manualChecks,
    practiceRecords,

    loadPracticeRecords,
    selectTemplate,
    startPractice,
    nextStep,
    prevStep,
    skipStep,
    useHint,
    pausePractice,
    resumePractice,
    loadPractice,
    completePractice,
    reset,

    setManualCheck,
    validateCheckItem,
    validateCurrentStep,
    detectMistakes,
    calculatePathSimilarity,
    calculateStepScore,
    calculateOverallScore,
    updateTracingData,
    updatePracticeRecipe,
    updatePracticeEnvironment,

    getCompletedPractices,
    getInProgressPractices,
    getPracticeStats,
  }
}
