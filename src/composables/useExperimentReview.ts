import type {
  ExperimentRecord,
  ExperimentReview,
  ParameterDeviation,
  OptimizationSuggestion,
  PowderIngredient,
} from '@/types/incense'
import {
  DEVIATION_SEVERITY_LOW,
  DEVIATION_SEVERITY_MEDIUM,
} from '@/utils/constants'

function getSeverity(deviationPercent: number): 'low' | 'medium' | 'high' {
  if (deviationPercent < DEVIATION_SEVERITY_LOW) return 'low'
  if (deviationPercent < DEVIATION_SEVERITY_MEDIUM) return 'medium'
  return 'high'
}

function calculateDeviations(experiment: ExperimentRecord): ParameterDeviation[] {
  const deviations: ParameterDeviation[] = []
  const theory = experiment.theoreticalAnalysis
  const actual = experiment.actualResult

  if (actual.actualBurnTime !== null) {
    const theoreticalBurnTime = theory.estimatedBurnTime
    const actualBurnTime = actual.actualBurnTime
    const deviation = Math.abs(actualBurnTime - theoreticalBurnTime)
    const deviationPercent = theoreticalBurnTime > 0
      ? (deviation / theoreticalBurnTime) * 100
      : 0
    deviations.push({
      parameter: 'burnTime',
      label: '燃烧时长',
      theoretical: theoreticalBurnTime,
      actual: actualBurnTime,
      deviation,
      deviationPercent,
      severity: getSeverity(deviationPercent),
    })
  }

  if (actual.ashLineQualityScore !== null) {
    const theoreticalAshLine = theory.ashLineQuality
    const actualAshLine = actual.ashLineQualityScore
    const deviation = Math.abs(actualAshLine - theoreticalAshLine)
    const deviationPercent = theoreticalAshLine > 0
      ? (deviation / theoreticalAshLine) * 100
      : 0
    deviations.push({
      parameter: 'ashLineQuality',
      label: '灰线质量',
      theoretical: theoreticalAshLine,
      actual: actualAshLine,
      deviation,
      deviationPercent,
      severity: getSeverity(deviationPercent),
    })
  }

  const flameoutCount = actual.flameoutRecords.length
  const actualFlameoutProbability = flameoutCount * 25
  const theoreticalFlameoutProb = theory.flameoutProbability
  const flameoutDeviation = Math.abs(actualFlameoutProbability - theoreticalFlameoutProb)
  const flameoutDeviationPercent = theoreticalFlameoutProb > 0
    ? (flameoutDeviation / theoreticalFlameoutProb) * 100
    : (flameoutCount > 0 ? 100 : 0)
  deviations.push({
    parameter: 'flameoutProbability',
    label: '断火概率',
    theoretical: theoreticalFlameoutProb,
    actual: actualFlameoutProbability,
    deviation: flameoutDeviation,
    deviationPercent: flameoutDeviationPercent,
    severity: getSeverity(flameoutDeviationPercent),
  })

  return deviations
}

function analyzeFlameout(experiment: ExperimentRecord): string {
  const records = experiment.actualResult.flameoutRecords
  if (records.length === 0) {
    return '燃烧过程顺利，未出现断火现象。'
  }

  const env = experiment.environment
  const reasons: string[] = []

  if (env.humidity > 65) {
    reasons.push(`环境湿度过高（${env.humidity}%），香粉受潮导致燃烧中断`)
  }
  if (env.airflow > 2) {
    reasons.push(`空气流动过强（${env.airflow}级），风力干扰火焰稳定性`)
  }
  if (env.ashBedThickness < 3) {
    reasons.push(`灰床厚度不足（${env.ashBedThickness}mm），保温效果差导致熄灭`)
  }

  const binderRatio = getBinderRatio(experiment.recipe)
  if (binderRatio < 10) {
    reasons.push(`粘合剂比例偏低（${binderRatio.toFixed(1)}%），香粉结合力不足易脱落断火`)
  }

  if (env.temperature < 18) {
    reasons.push(`环境温度偏低（${env.temperature}°C），燃烧热量不足容易熄灭`)
  }

  if (reasons.length === 0) {
    reasons.push('断火原因尚不明确，可能需要进一步观察香粉状态或操作手法')
  }

  return `实验过程中出现 ${records.length} 次断火。主要原因分析：${reasons.join('；')}。`
}

function getBinderRatio(ingredients: PowderIngredient[]): number {
  const binderNames = ['楠木粘粉', '榆树皮粉', '粘粉']
  const binderTotal = ingredients
    .filter((i) => binderNames.some((b) => i.name.includes(b)))
    .reduce((sum, i) => sum + i.ratio, 0)
  const total = ingredients.reduce((sum, i) => sum + i.ratio, 0)
  return total > 0 ? (binderTotal / total) * 100 : 0
}

function analyzeAshLine(experiment: ExperimentRecord): string {
  const theoretical = experiment.theoreticalAnalysis.ashLineQuality
  const actual = experiment.actualResult.ashLineQualityScore

  if (actual === null) {
    return '未记录灰线质量评分，无法分析。'
  }

  const ratio = actual / theoretical
  let baseAnalysis = ''
  let suggestions = ''

  if (ratio > 0.9) {
    baseAnalysis = '灰线成型优良，与预期基本一致。'
  } else if (ratio > 0.7) {
    baseAnalysis = '灰线成型一般，存在部分脱落或断裂。'
    suggestions = getSuggestionsForModerateAshLine(experiment)
  } else {
    baseAnalysis = '灰线成型较差，多处断裂或不成型。'
    suggestions = getSuggestionsForPoorAshLine(experiment)
  }

  return suggestions ? `${baseAnalysis}${suggestions}` : baseAnalysis
}

function getSuggestionsForModerateAshLine(experiment: ExperimentRecord): string {
  const tips: string[] = []
  if (experiment.environment.humidity > 60) {
    tips.push('建议降低环境湿度以改善灰线成型')
  }
  if (experiment.environment.airflow > 2) {
    tips.push('建议减少空气流动对灰线的干扰')
  }
  const binderRatio = getBinderRatio(experiment.recipe)
  if (binderRatio < 12) {
    tips.push('可适当增加粘粉比例以增强灰线结合力')
  }
  return tips.length > 0 ? `优化建议：${tips.join('；')}。` : ''
}

function getSuggestionsForPoorAshLine(experiment: ExperimentRecord): string {
  const tips: string[] = []
  tips.push('建议重新调整香粉填充手法，确保填充紧实均匀')
  if (experiment.environment.humidity > 60) {
    tips.push('当前湿度偏高，需显著降低环境湿度')
  }
  if (experiment.environment.airflow > 1) {
    tips.push('需在无风环境下进行，避免空气流动破坏灰线')
  }
  const binderRatio = getBinderRatio(experiment.recipe)
  if (binderRatio < 15) {
    tips.push(`粘粉比例仅${binderRatio.toFixed(1)}%，建议提升至15%以上`)
  }
  if (experiment.environment.ashBedThickness < 4) {
    tips.push('灰床厚度不足，建议加厚至5mm以上以保证灰线支撑')
  }
  return `关键优化：${tips.join('；')}。`
}

function generateConclusion(experiment: ExperimentRecord, deviations: ParameterDeviation[]): string {
  const highCount = deviations.filter((d) => d.severity === 'high').length
  const mediumCount = deviations.filter((d) => d.severity === 'medium').length
  const lowCount = deviations.filter((d) => d.severity === 'low').length

  let overall = ''
  if (highCount === 0) {
    overall = '本次实验整体表现良好'
  } else if (highCount <= 2) {
    overall = '本次实验存在部分偏差需要关注'
  } else {
    overall = '本次实验偏差较大，需要重点优化'
  }

  const details: string[] = []
  if (highCount > 0) details.push(`严重偏差${highCount}项`)
  if (mediumCount > 0) details.push(`中等偏差${mediumCount}项`)
  if (lowCount > 0) details.push(`轻微偏差${lowCount}项`)

  const detailStr = details.length > 0 ? `（${details.join('，')}）` : '（无明显偏差）'

  const devDescriptions = deviations
    .filter((d) => d.severity !== 'low')
    .map((d) => `${d.label}偏差${d.deviationPercent.toFixed(1)}%`)

  const descriptionStr = devDescriptions.length > 0
    ? `。主要偏差：${devDescriptions.join('，')}`
    : ''

  return `${overall}${detailStr}${descriptionStr}。`
}

function generateNextSuggestions(
  experiment: ExperimentRecord,
  deviations: ParameterDeviation[]
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = []

  const burnTimeDev = deviations.find((d) => d.parameter === 'burnTime')
  if (burnTimeDev && burnTimeDev.deviationPercent > 20) {
    const isLonger = burnTimeDev.actual > burnTimeDev.theoretical
    suggestions.push({
      category: 'recipe',
      priority: burnTimeDev.severity === 'high' ? 'high' : 'medium',
      title: isLonger ? '缩短燃烧时长' : '延长燃烧时长',
      description: isLonger
        ? `实际燃烧时长${burnTimeDev.actual}分钟超出预期${burnTimeDev.theoretical}分钟，偏差${burnTimeDev.deviationPercent.toFixed(1)}%。建议减少高燃烧率香粉比例或降低香线密度。`
        : `实际燃烧时长${burnTimeDev.actual}分钟低于预期${burnTimeDev.theoretical}分钟，偏差${burnTimeDev.deviationPercent.toFixed(1)}%。建议增加稳定性高的香粉比例或提高香线密度。`,
      parameter: 'burnTime',
      currentValue: burnTimeDev.actual,
      targetValue: burnTimeDev.theoretical,
    })
  }

  const flameoutDev = deviations.find((d) => d.parameter === 'flameoutProbability')
  if (flameoutDev && experiment.actualResult.flameoutRecords.length > 0) {
    const env = experiment.environment
    const envSuggestions: string[] = []
    if (env.humidity > 65) envSuggestions.push('降低湿度至65%以下')
    if (env.airflow > 2) envSuggestions.push('减少空气流动至2级以下')
    if (env.ashBedThickness < 3) envSuggestions.push('增加灰床厚度至3mm以上')

    suggestions.push({
      category: 'environment',
      priority: 'high',
      title: '改善环境条件降低断火风险',
      description: `实验出现${experiment.actualResult.flameoutRecords.length}次断火。${envSuggestions.length > 0 ? `建议：${envSuggestions.join('；')}。` : '建议在更稳定的环境条件下重试。'}`,
      parameter: 'flameoutProbability',
      currentValue: flameoutDev.actual,
      targetValue: flameoutDev.theoretical,
    })
  }

  const ashLineDev = deviations.find((d) => d.parameter === 'ashLineQuality')
  if (ashLineDev && ashLineDev.actual < ashLineDev.theoretical * 0.7) {
    const tips: string[] = ['优化香粉填充手法，确保均匀紧实']
    const binderRatio = getBinderRatio(experiment.recipe)
    if (binderRatio < 15) tips.push(`提高粘粉比例至15%以上（当前${binderRatio.toFixed(1)}%）`)
    if (experiment.environment.airflow > 1) tips.push('在无风环境下操作')

    suggestions.push({
      category: 'technique',
      priority: ashLineDev.severity === 'high' ? 'high' : 'medium',
      title: '提升灰线成型技巧',
      description: `灰线质量评分${ashLineDev.actual}远低于预期${ashLineDev.theoretical}。建议：${tips.join('；')}。`,
      parameter: 'ashLineQuality',
      currentValue: ashLineDev.actual,
      targetValue: ashLineDev.theoretical,
    })
  }

  if (experiment.environment.ashBedThickness < 3) {
    suggestions.push({
      category: 'ashbed',
      priority: 'medium',
      title: '增加灰床厚度',
      description: `当前灰床厚度仅${experiment.environment.ashBedThickness}mm，保温不足影响燃烧和灰线成型。建议加厚至5-8mm。`,
      parameter: 'ashBedThickness',
      currentValue: experiment.environment.ashBedThickness,
      targetValue: 5,
    })
  }

  const binderRatio = getBinderRatio(experiment.recipe)
  if (binderRatio < 10 && experiment.actualResult.flameoutRecords.length > 0) {
    suggestions.push({
      category: 'recipe',
      priority: 'high',
      title: '增加粘合剂比例',
      description: `粘粉比例${binderRatio.toFixed(1)}%偏低，结合力不足导致断火。建议提升至15%左右。`,
      parameter: 'binderRatio',
      currentValue: binderRatio,
      targetValue: 15,
    })
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

function generateExperienceTags(experiment: ExperimentRecord, deviations: ParameterDeviation[]): string[] {
  const tags: string[] = []
  const env = experiment.environment

  if (env.humidity > 65) tags.push('高湿环境')
  else if (env.humidity < 30) tags.push('干燥环境')

  if (env.airflow > 2) tags.push('有风环境')
  else if (env.airflow === 0) tags.push('静风环境')

  if (experiment.actualResult.flameoutRecords.length > 0) {
    tags.push('断火修复')
  } else {
    tags.push('燃烧稳定')
  }

  if (experiment.actualResult.ashLineQualityScore !== null) {
    const ashLineDev = deviations.find((d) => d.parameter === 'ashLineQuality')
    if (ashLineDev && ashLineDev.actual >= ashLineDev.theoretical * 0.9) {
      tags.push('灰线优秀')
    } else if (ashLineDev && ashLineDev.actual < ashLineDev.theoretical * 0.7) {
      tags.push('灰线待优化')
    }
  }

  const highCount = deviations.filter((d) => d.severity === 'high').length
  if (highCount === 0) tags.push('低偏差')
  else if (highCount >= 2) tags.push('高偏差')

  const burnTimeDev = deviations.find((d) => d.parameter === 'burnTime')
  if (burnTimeDev) {
    if (burnTimeDev.actual > burnTimeDev.theoretical * 1.1) tags.push('燃烧偏慢')
    else if (burnTimeDev.actual < burnTimeDev.theoretical * 0.9) tags.push('燃烧偏快')
  }

  const binderRatio = getBinderRatio(experiment.recipe)
  if (binderRatio > 25) tags.push('高粘粉比')

  if (experiment.actualResult.ignitionResult === 'delayed_ignition') tags.push('延迟点燃')
  if (experiment.actualResult.ignitionResult === 'partial_flameout') tags.push('部分断火')

  return [...new Set(tags)]
}

function calculateStabilityScore(experiments: ExperimentRecord[]): number {
  const completed = experiments
    .filter((e) => e.status === 'completed' || e.status === 'reviewed')
    .slice(-5)

  if (completed.length < 2) return 50

  const burnTimes = completed
    .map((e) => e.actualResult.actualBurnTime)
    .filter((t): t is number => t !== null)

  if (burnTimes.length < 2) return 50

  const mean = burnTimes.reduce((sum, t) => sum + t, 0) / burnTimes.length
  const variance = burnTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / burnTimes.length
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1

  let score = 100 - cv * 200
  score = Math.max(0, Math.min(100, score))

  const flameoutCounts = completed.map((e) => e.actualResult.flameoutRecords.length)
  const avgFlameout = flameoutCounts.reduce((sum, c) => sum + c, 0) / flameoutCounts.length
  if (avgFlameout > 0) {
    score -= avgFlameout * 10
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function generateReview(
  experiment: ExperimentRecord,
  allExperiments: ExperimentRecord[]
): ExperimentReview {
  const deviations = calculateDeviations(experiment)
  const flameoutAnalysis = analyzeFlameout(experiment)
  const ashLineAnalysis = analyzeAshLine(experiment)
  const overallConclusion = generateConclusion(experiment, deviations)
  const nextOptimizationSuggestions = generateNextSuggestions(experiment, deviations)
  const experienceTags = generateExperienceTags(experiment, deviations)
  const stabilityScore = calculateStabilityScore(allExperiments)

  const burnTimeDev = deviations.find((d) => d.parameter === 'burnTime') || null

  return {
    id: `review_${experiment.id}_${Date.now()}`,
    experimentId: experiment.id,
    createdAt: Date.now(),
    deviations,
    burnTimeDeviation: burnTimeDev,
    flameoutAnalysis,
    ashLineAnalysis,
    overallConclusion,
    nextOptimizationSuggestions,
    experienceTags,
    stabilityScore,
  }
}

export { calculateDeviations, analyzeFlameout, analyzeAshLine, generateConclusion, generateNextSuggestions, generateExperienceTags, calculateStabilityScore, generateReview }

export function useExperimentReview() {
  return {
    calculateDeviations,
    analyzeFlameout,
    analyzeAshLine,
    generateConclusion,
    generateNextSuggestions,
    generateExperienceTags,
    calculateStabilityScore,
    generateReview,
  }
}
