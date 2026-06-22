import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PowderIngredient,
  EnvironmentParams,
  AdaptationResult,
  OptimizationSuggestion,
  AdaptationScenario,
} from '@/types/incense'
import {
  OPTIMAL_HUMIDITY_MIN,
  OPTIMAL_HUMIDITY_MAX,
  OPTIMAL_TEMPERATURE_MIN,
  OPTIMAL_TEMPERATURE_MAX,
  OPTIMAL_AIRFLOW_MAX,
  OPTIMAL_ASH_BED_MIN,
  OPTIMAL_ASH_BED_MAX,
  BINDER_OPTIMAL_RATIO,
  BINDER_MIN_RATIO,
  BINDER_MAX_RATIO,
  MIN_HUMIDITY,
  MAX_HUMIDITY,
  MIN_TEMPERATURE,
  MAX_TEMPERATURE,
  MIN_AIRFLOW,
  MAX_AIRFLOW,
  MIN_ASH_BED_THICKNESS,
  MAX_ASH_BED_THICKNESS,
} from '@/utils/constants'
import { DEFAULT_POWDERS } from '@/types/incense'

const BINDER_NAMES = ['楠木粘粉', '榆树皮粉', '粘粉']

const SCENARIO_PRESETS: { name: string; description: string; params: EnvironmentParams }[] = [
  {
    name: '春日书房',
    description: '春季温和干燥的书房环境',
    params: { humidity: 45, temperature: 20, airflow: 1, ashBedThickness: 5 },
  },
  {
    name: '梅雨客厅',
    description: '梅雨季节高湿度的客厅环境',
    params: { humidity: 75, temperature: 25, airflow: 0, ashBedThickness: 6 },
  },
  {
    name: '盛夏茶室',
    description: '夏季高温空调房环境',
    params: { humidity: 40, temperature: 26, airflow: 2, ashBedThickness: 5 },
  },
  {
    name: '冬日暖阁',
    description: '冬季供暖干燥的室内环境',
    params: { humidity: 25, temperature: 24, airflow: 0, ashBedThickness: 5 },
  },
  {
    name: '临窗通风',
    description: '靠窗通风良好的环境',
    params: { humidity: 55, temperature: 22, airflow: 3, ashBedThickness: 6 },
  },
  {
    name: '禅房静坐',
    description: '密闭无风的冥想环境',
    params: { humidity: 50, temperature: 21, airflow: 0, ashBedThickness: 4 },
  },
]

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function gaussianPenalty(value: number, min: number, max: number): number {
  const center = (min + max) / 2
  const sigma = (max - min) / 4
  return Math.exp(-Math.pow(value - center, 2) / (2 * Math.pow(sigma, 2)))
}

function getBinderRatio(ingredients: PowderIngredient[]): number {
  const binderTotal = ingredients
    .filter((i) => BINDER_NAMES.some((b) => i.name.includes(b)))
    .reduce((sum, i) => sum + i.ratio, 0)
  const total = ingredients.reduce((sum, i) => sum + i.ratio, 0)
  return total > 0 ? (binderTotal / total) * 100 : 0
}

function getWeightedBurnRateFactor(ingredients: PowderIngredient[]): number {
  const total = ingredients.reduce((sum, i) => sum + i.ratio, 0)
  if (total === 0) return 1.0
  const weighted = ingredients.reduce((sum, i) => sum + i.ratio * i.burnRateFactor, 0)
  return weighted / total
}

function getWeightedStabilityFactor(ingredients: PowderIngredient[]): number {
  const total = ingredients.reduce((sum, i) => sum + i.ratio, 0)
  if (total === 0) return 1.0
  const weighted = ingredients.reduce((sum, i) => sum + i.ratio * i.stabilityFactor, 0)
  return weighted / total
}

function calculateAdaptationResult(
  ingredients: PowderIngredient[],
  environment: EnvironmentParams
): AdaptationResult {
  const env = environment

  const humidityScore = gaussianPenalty(env.humidity, OPTIMAL_HUMIDITY_MIN, OPTIMAL_HUMIDITY_MAX)
  const temperatureScore = gaussianPenalty(
    env.temperature,
    OPTIMAL_TEMPERATURE_MIN,
    OPTIMAL_TEMPERATURE_MAX
  )
  const airflowPenalty =
    env.airflow > OPTIMAL_AIRFLOW_MAX
      ? Math.exp(-Math.pow(env.airflow - OPTIMAL_AIRFLOW_MAX, 2) / 4)
      : 1.0
  const ashBedScore = gaussianPenalty(
    env.ashBedThickness,
    OPTIMAL_ASH_BED_MIN,
    OPTIMAL_ASH_BED_MAX
  )

  const currentBinderRatio = getBinderRatio(ingredients)
  const binderScore =
    currentBinderRatio > 0
      ? gaussianPenalty(currentBinderRatio, BINDER_MIN_RATIO, BINDER_MAX_RATIO)
      : 0.5

  const recipeStability = getWeightedStabilityFactor(ingredients)
  const recipeBurnRate = getWeightedBurnRateFactor(ingredients)

  let combustionStability = 100
  combustionStability *= humidityScore
  combustionStability *= temperatureScore
  combustionStability *= airflowPenalty
  combustionStability *= ashBedScore
  combustionStability *= binderScore
  combustionStability *= 0.7 + 0.3 * recipeStability

  const humidityFlameout =
    env.humidity > OPTIMAL_HUMIDITY_MAX ? (env.humidity - OPTIMAL_HUMIDITY_MAX) * 0.8 : 0
  const lowTempFlameout =
    env.temperature < OPTIMAL_TEMPERATURE_MIN
      ? (OPTIMAL_TEMPERATURE_MIN - env.temperature) * 1.2
      : 0
  const airflowFlameout =
    env.airflow > OPTIMAL_AIRFLOW_MAX ? (env.airflow - OPTIMAL_AIRFLOW_MAX) * 8 : 0
  const thinAshFlameout =
    env.ashBedThickness < OPTIMAL_ASH_BED_MIN
      ? (OPTIMAL_ASH_BED_MIN - env.ashBedThickness) * 4
      : 0
  const binderFlameout =
    currentBinderRatio < BINDER_MIN_RATIO ? (BINDER_MIN_RATIO - currentBinderRatio) * 1.5 : 0

  let flameoutProbability = humidityFlameout + lowTempFlameout + airflowFlameout
  flameoutProbability += thinAshFlameout + binderFlameout
  flameoutProbability = clamp(flameoutProbability, 0, 100)
  flameoutProbability *= 2.0 - recipeStability

  let ashLineQuality = 100
  ashLineQuality *= gaussianPenalty(env.humidity, 40, 60)
  ashLineQuality *= gaussianPenalty(env.temperature, 20, 26)
  ashLineQuality *=
    env.airflow <= OPTIMAL_AIRFLOW_MAX
      ? 1.0
      : Math.max(0.3, 1.0 - (env.airflow - OPTIMAL_AIRFLOW_MAX) * 0.15)
  ashLineQuality *= gaussianPenalty(env.ashBedThickness, 4, 7)
  ashLineQuality *= binderScore
  ashLineQuality *= 0.8 + 0.2 * recipeStability

  const humidityDeviation = Math.abs(env.humidity - 50) * 0.3
  const temperatureDeviation = Math.abs(env.temperature - 22) * 0.5
  const airflowDeviation = env.airflow * 2.0
  const ashDeviation = Math.abs(env.ashBedThickness - 5) * 1.0
  const burnRateDeviation = Math.abs(recipeBurnRate - 1.0) * 15

  let burnTimeDeviation = humidityDeviation + temperatureDeviation + airflowDeviation
  burnTimeDeviation += ashDeviation + burnRateDeviation
  burnTimeDeviation = clamp(burnTimeDeviation, 0, 50)

  const overallScore =
    combustionStability * 0.35 +
    (100 - flameoutProbability) * 0.3 +
    ashLineQuality * 0.25 +
    (100 - burnTimeDeviation * 2) * 0.1

  return {
    combustionStability: clamp(combustionStability, 0, 100),
    flameoutProbability: clamp(flameoutProbability, 0, 100),
    ashLineQuality: clamp(ashLineQuality, 0, 100),
    burnTimeDeviation: clamp(burnTimeDeviation, 0, 50),
    overallScore: clamp(overallScore, 0, 100),
  }
}

function generateSuggestions(
  ingredients: PowderIngredient[],
  environment: EnvironmentParams,
  adaptationResult: AdaptationResult
): OptimizationSuggestion[] {
  const recs: OptimizationSuggestion[] = []
  const env = environment
  const result = adaptationResult
  const currentBinderRatio = getBinderRatio(ingredients)
  const total = ingredients.reduce((sum, i) => sum + i.ratio, 0)

  if (env.humidity > OPTIMAL_HUMIDITY_MAX) {
    recs.push({
      category: 'environment',
      priority: env.humidity > 75 ? 'high' : 'medium',
      title: '降低室内湿度',
      description: `当前湿度 ${env.humidity}% 偏高，会导致香粉受潮燃烧困难。建议使用除湿器或将香材置于干燥环境中，目标湿度控制在 ${OPTIMAL_HUMIDITY_MIN}-${OPTIMAL_HUMIDITY_MAX}%。`,
      parameter: 'humidity',
      currentValue: env.humidity,
      targetValue: 50,
    })
  } else if (env.humidity < OPTIMAL_HUMIDITY_MIN) {
    recs.push({
      category: 'environment',
      priority: env.humidity < 20 ? 'high' : 'low',
      title: '适当增加湿度',
      description: `当前湿度 ${env.humidity}% 偏低，燃烧速度可能过快导致灰线不完整。可使用加湿器微调，目标湿度 ${OPTIMAL_HUMIDITY_MIN}-${OPTIMAL_HUMIDITY_MAX}%。`,
      parameter: 'humidity',
      currentValue: env.humidity,
      targetValue: 50,
    })
  }

  if (env.temperature > OPTIMAL_TEMPERATURE_MAX) {
    recs.push({
      category: 'environment',
      priority: env.temperature > 32 ? 'high' : 'medium',
      title: '降低环境温度',
      description: `当前温度 ${env.temperature}°C 偏高，会加速燃烧导致偏差增大。建议移至阴凉处或开启空调，目标温度 ${OPTIMAL_TEMPERATURE_MIN}-${OPTIMAL_TEMPERATURE_MAX}°C。`,
      parameter: 'temperature',
      currentValue: env.temperature,
      targetValue: 22,
    })
  } else if (env.temperature < OPTIMAL_TEMPERATURE_MIN) {
    recs.push({
      category: 'environment',
      priority: env.temperature < 10 ? 'high' : 'medium',
      title: '提高环境温度',
      description: `当前温度 ${env.temperature}°C 偏低，燃烧温度不足容易断火。建议移至温暖处或使用暖风微提温度，目标温度 ${OPTIMAL_TEMPERATURE_MIN}-${OPTIMAL_TEMPERATURE_MAX}°C。`,
      parameter: 'temperature',
      currentValue: env.temperature,
      targetValue: 22,
    })
  }

  if (env.airflow > OPTIMAL_AIRFLOW_MAX) {
    recs.push({
      category: 'environment',
      priority: env.airflow > 3 ? 'high' : 'medium',
      title: '减弱空气流动',
      description: `当前空气流动强度 ${env.airflow} 级偏高，火焰易被吹灭或燃烧不均。建议关闭窗户、风扇或使用防风罩，目标气流控制在 ${OPTIMAL_AIRFLOW_MAX} 级以下。`,
      parameter: 'airflow',
      currentValue: env.airflow,
      targetValue: 1,
    })
  }

  if (env.ashBedThickness < OPTIMAL_ASH_BED_MIN) {
    recs.push({
      category: 'ashbed',
      priority: 'high',
      title: '增加灰床厚度',
      description: `当前灰床厚度 ${env.ashBedThickness}mm 偏薄，保温效果差容易断火。建议加厚香灰铺垫，目标厚度 ${OPTIMAL_ASH_BED_MIN}-${OPTIMAL_ASH_BED_MAX}mm。`,
      parameter: 'ashBedThickness',
      currentValue: env.ashBedThickness,
      targetValue: 5,
    })
  } else if (env.ashBedThickness > OPTIMAL_ASH_BED_MAX) {
    recs.push({
      category: 'ashbed',
      priority: 'medium',
      title: '减少灰床厚度',
      description: `当前灰床厚度 ${env.ashBedThickness}mm 偏厚，氧气供应不足可能导致燃烧缓慢或熄灭。建议刮薄部分香灰，目标厚度 ${OPTIMAL_ASH_BED_MIN}-${OPTIMAL_ASH_BED_MAX}mm。`,
      parameter: 'ashBedThickness',
      currentValue: env.ashBedThickness,
      targetValue: 5,
    })
  }

  if (total !== 100) {
    recs.push({
      category: 'recipe',
      priority: 'medium',
      title: '调整配方比例总和',
      description: `当前配方比例总和为 ${total}%，建议调整为 100% 以确保计算准确。`,
      parameter: 'totalRatio',
      currentValue: total,
      targetValue: 100,
    })
  }

  if (currentBinderRatio < BINDER_MIN_RATIO) {
    recs.push({
      category: 'recipe',
      priority: 'high',
      title: '增加粘合剂比例',
      description: `当前粘粉比例 ${currentBinderRatio.toFixed(1)}% 偏低，香粉成型困难且易断火。建议增加楠木粘粉或榆树皮粉至 ${BINDER_MIN_RATIO}-${BINDER_MAX_RATIO}%。`,
      parameter: 'binderRatio',
      currentValue: currentBinderRatio,
      targetValue: BINDER_OPTIMAL_RATIO,
    })
  } else if (currentBinderRatio > BINDER_MAX_RATIO) {
    recs.push({
      category: 'recipe',
      priority: 'medium',
      title: '减少粘合剂比例',
      description: `当前粘粉比例 ${currentBinderRatio.toFixed(1)}% 偏高，会影响香气散发且燃烧烟大。建议降低粘粉比例至 ${BINDER_MIN_RATIO}-${BINDER_MAX_RATIO}%。`,
      parameter: 'binderRatio',
      currentValue: currentBinderRatio,
      targetValue: BINDER_OPTIMAL_RATIO,
    })
  }

  const hasHighBurnRateIngredient = ingredients.find(
    (i) => i.burnRateFactor > 1.1 && i.ratio > 30
  )
  if (hasHighBurnRateIngredient && result.burnTimeDeviation > 15) {
    recs.push({
      category: 'recipe',
      priority: 'medium',
      title: '调整易燃油比例',
      description: `${hasHighBurnRateIngredient.name} 比例较高(${hasHighBurnRateIngredient.ratio}%)，燃烧速度偏快。建议适当降低比例或增加稳定性高的香粉。`,
      parameter: hasHighBurnRateIngredient.name,
      currentValue: hasHighBurnRateIngredient.ratio,
      targetValue: Math.max(10, hasHighBurnRateIngredient.ratio - 10),
    })
  }

  if (result.flameoutProbability > 30) {
    recs.push({
      category: 'technique',
      priority: 'high',
      title: '采用分段点燃法',
      description: '当前断火风险较高，建议采用分段点燃方式：先点燃起始端，待燃烧稳定10秒后再轻吹助燃，过程中避免直接对准火焰吹气。',
    })
  }

  if (result.ashLineQuality < 60) {
    recs.push({
      category: 'technique',
      priority: 'medium',
      title: '优化打篆手法',
      description: '灰线成型质量偏低，建议：1) 香粉填充时轻压多次确保紧实；2) 起模时垂直平稳向上提起；3) 灰床表面提前压平光滑。',
    })
  }

  return recs.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

function generateScenarioAnalysis(
  ingredients: PowderIngredient[]
): AdaptationScenario[] {
  return SCENARIO_PRESETS.map((preset) => ({
    name: preset.name,
    description: preset.description,
    params: preset.params,
    result: calculateAdaptationResult(ingredients, preset.params),
  }))
}

function optimizeForEnvironment(
  baseIngredients: PowderIngredient[],
  targetEnvironment: EnvironmentParams
): PowderIngredient[] {
  const optimized = baseIngredients.map((i) => ({ ...i }))
  const env = targetEnvironment

  const binderIndex = optimized.findIndex((i) =>
    BINDER_NAMES.some((b) => i.name.includes(b))
  )
  const totalRatio = optimized.reduce((sum, i) => sum + i.ratio, 0)

  if (binderIndex >= 0) {
    let targetBinderRatio = BINDER_OPTIMAL_RATIO
    if (env.humidity > 65) targetBinderRatio = BINDER_OPTIMAL_RATIO + 3
    if (env.humidity < 30) targetBinderRatio = BINDER_OPTIMAL_RATIO - 2
    if (env.airflow > OPTIMAL_AIRFLOW_MAX) targetBinderRatio = BINDER_OPTIMAL_RATIO + 5

    const currentBinderRatio = (optimized[binderIndex].ratio / totalRatio) * 100
    if (Math.abs(currentBinderRatio - targetBinderRatio) > 2) {
      const diff = targetBinderRatio - currentBinderRatio
      const adjustAmount = (diff / 100) * totalRatio
      optimized[binderIndex].ratio = clamp(
        optimized[binderIndex].ratio + adjustAmount,
        1,
        99
      )
    }
  }

  const burnRateFactor = getWeightedBurnRateFactor(optimized)
  if (env.temperature < OPTIMAL_TEMPERATURE_MIN && burnRateFactor < 1.0) {
    const stableIndex = optimized.findIndex((i) => i.burnRateFactor > 1.0)
    if (stableIndex >= 0 && binderIndex >= 0 && stableIndex !== binderIndex) {
      optimized[stableIndex].ratio = clamp(optimized[stableIndex].ratio + 5, 1, 99)
      optimized[binderIndex].ratio = clamp(optimized[binderIndex].ratio - 5, 1, 99)
    }
  }

  return optimized
}

export const useEnvironmentAdaptationStore = defineStore('environmentAdaptation', () => {
  const ingredients = ref<PowderIngredient[]>([
    { name: '沉香粉', ratio: 50, burnRateFactor: 0.9, stabilityFactor: 1.1 },
    { name: '檀香粉', ratio: 35, burnRateFactor: 1.0, stabilityFactor: 1.0 },
    { name: '楠木粘粉', ratio: 15, burnRateFactor: 0.7, stabilityFactor: 1.3 },
  ])

  const environment = ref<EnvironmentParams>({
    humidity: 50,
    temperature: 22,
    airflow: 1,
    ashBedThickness: 5,
  })

  const totalRatio = computed(() => {
    return ingredients.value.reduce((sum, i) => sum + i.ratio, 0)
  })

  const binderRatio = computed(() => getBinderRatio(ingredients.value))

  const burnRateFactor = computed(() => getWeightedBurnRateFactor(ingredients.value))
  const stabilityFactor = computed(() => getWeightedStabilityFactor(ingredients.value))

  const adaptationResult = computed<AdaptationResult>(() => {
    return calculateAdaptationResult(ingredients.value, environment.value)
  })

  const suggestions = computed<OptimizationSuggestion[]>(() => {
    return generateSuggestions(
      ingredients.value,
      environment.value,
      adaptationResult.value
    )
  })

  const scenarioAnalysis = computed<AdaptationScenario[]>(() => {
    return generateScenarioAnalysis(ingredients.value)
  })

  function updateIngredient(index: number, updates: Partial<PowderIngredient>) {
    if (index >= 0 && index < ingredients.value.length) {
      ingredients.value[index] = { ...ingredients.value[index], ...updates }
    }
  }

  function addIngredient(name?: string) {
    const defaultPowder = DEFAULT_POWDERS[0]
    const powderToAdd = name
      ? DEFAULT_POWDERS.find((p) => p.name === name) || defaultPowder
      : defaultPowder
    ingredients.value.push({
      name: powderToAdd.name,
      ratio: 10,
      burnRateFactor: powderToAdd.burnRateFactor,
      stabilityFactor: powderToAdd.stabilityFactor,
    })
  }

  function removeIngredient(index: number) {
    if (ingredients.value.length > 1) {
      ingredients.value.splice(index, 1)
    }
  }

  function updateEnvironment(updates: Partial<EnvironmentParams>) {
    environment.value = { ...environment.value, ...updates }
  }

  function setEnvironment(params: EnvironmentParams) {
    environment.value = { ...params }
  }

  function resetToDefault() {
    ingredients.value = [
      { name: '沉香粉', ratio: 50, burnRateFactor: 0.9, stabilityFactor: 1.1 },
      { name: '檀香粉', ratio: 35, burnRateFactor: 1.0, stabilityFactor: 1.0 },
      { name: '楠木粘粉', ratio: 15, burnRateFactor: 0.7, stabilityFactor: 1.3 },
    ]
    environment.value = {
      humidity: 50,
      temperature: 22,
      airflow: 1,
      ashBedThickness: 5,
    }
  }

  function getOptimizedRecipe() {
    return optimizeForEnvironment(ingredients.value, environment.value)
  }

  function applyOptimizedRecipe() {
    ingredients.value = getOptimizedRecipe()
  }

  function getScenarioPresets() {
    return SCENARIO_PRESETS
  }

  function getAvailablePowders() {
    return DEFAULT_POWDERS
  }

  return {
    ingredients,
    environment,
    totalRatio,
    binderRatio,
    burnRateFactor,
    stabilityFactor,
    adaptationResult,
    suggestions,
    scenarioAnalysis,
    updateIngredient,
    addIngredient,
    removeIngredient,
    updateEnvironment,
    setEnvironment,
    resetToDefault,
    getOptimizedRecipe,
    applyOptimizedRecipe,
    getScenarioPresets,
    getAvailablePowders,
    MIN_HUMIDITY,
    MAX_HUMIDITY,
    MIN_TEMPERATURE,
    MAX_TEMPERATURE,
    MIN_AIRFLOW,
    MAX_AIRFLOW,
    MIN_ASH_BED_THICKNESS,
    MAX_ASH_BED_THICKNESS,
    OPTIMAL_HUMIDITY_MIN,
    OPTIMAL_HUMIDITY_MAX,
    OPTIMAL_TEMPERATURE_MIN,
    OPTIMAL_TEMPERATURE_MAX,
    OPTIMAL_AIRFLOW_MAX,
    OPTIMAL_ASH_BED_MIN,
    OPTIMAL_ASH_BED_MAX,
    BINDER_MIN_RATIO,
    BINDER_OPTIMAL_RATIO,
    BINDER_MAX_RATIO,
  }
})
