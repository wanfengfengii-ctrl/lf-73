import type {
  LearningReport,
  PracticeRecord,
  PracticeScore,
  CommonMistakeRecord,
  TeachingTemplate,
} from '@/types/incense'
import { SCORE_CATEGORIES, LEARNING_REPORT_STORAGE_KEY } from '@/utils/constants'
import { getTemplateById, getNextTemplateId } from '@/data/teachingTemplates'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function useLearningReport() {
  function generateReport(practice: PracticeRecord): LearningReport {
    const template = getTemplateById(practice.templateId)
    const score = practice.score

    if (!score) {
      return createEmptyReport(practice)
    }

    const overallAssessment = generateOverallAssessment(practice, score, template)
    const strengths = identifyStrengths(practice, score, template)
    const weaknesses = identifyWeaknesses(practice, score, template)
    const improvements = generateImprovements(practice, score, template)
    const suggestedNextSteps = generateNextSteps(practice, score, template)
    const scoreBreakdown = generateScoreBreakdown(score)
    const commonMistakesSummary = summarizeMistakes(practice.mistakes)
    const recommendedTemplates = getRecommendedTemplates(practice, score)

    return {
      id: generateId(),
      practiceId: practice.id,
      generatedAt: Date.now(),
      overallAssessment,
      strengths,
      weaknesses,
      improvements,
      suggestedNextSteps,
      scoreBreakdown,
      commonMistakesSummary,
      recommendedTemplates,
    }
  }

  function createEmptyReport(practice: PracticeRecord): LearningReport {
    return {
      id: generateId(),
      practiceId: practice.id,
      generatedAt: Date.now(),
      overallAssessment: '练习记录不完整，无法生成详细报告。请完成所有步骤后重试。',
      strengths: [],
      weaknesses: [],
      improvements: ['完成完整的练习流程以获取详细分析'],
      suggestedNextSteps: [],
      scoreBreakdown: [],
      commonMistakesSummary: [],
      recommendedTemplates: [],
    }
  }

  function generateOverallAssessment(
    practice: PracticeRecord,
    score: PracticeScore,
    template?: TeachingTemplate
  ): string {
    const gradeDescriptions: Record<string, string> = {
      S: '表现卓越！您已经完全掌握了香篆制作的核心技巧，操作精准、流程顺畅，可以挑战更高难度的图案。',
      A: '表现优秀！您对香篆制作有了很好的掌握，大部分环节都完成得很出色，只需要在一些细节上继续打磨。',
      B: '表现良好！您已经掌握了香篆制作的基本流程和方法，但在操作精准度和细节处理上还有提升空间。',
      C: '表现尚可！您对香篆制作有了基本了解，但在多个环节还需要更多练习来巩固和提升。',
      D: '需要努力！香篆制作需要更多的练习和耐心，建议从基础课程重新学习，夯实基础。',
      F: '继续加油！香篆制作是一门需要耐心和细心的技艺，不要气馁，从最基础的步骤开始反复练习。',
    }

    const baseDescription = gradeDescriptions[score.grade] || '继续努力，多加练习！'

    const timeSpentMinutes = Math.round(practice.timeSpent / 60000)
    const hintsUsed = practice.hintsUsed

    let additionalInfo = `本次练习用时 ${timeSpentMinutes} 分钟`
    if (hintsUsed > 0) {
      additionalInfo += `，使用了 ${hintsUsed} 次提示`
    }
    additionalInfo += '。'

    if (template) {
      additionalInfo += ` 完成课程：${template.name}。`
    }

    return baseDescription + additionalInfo
  }

  function identifyStrengths(
    practice: PracticeRecord,
    score: PracticeScore,
    template?: TeachingTemplate
  ): string[] {
    const strengths: string[] = []

    if (score.accuracyScore >= 85) {
      strengths.push('临摹准确度高，能够很好地还原模板图案的形态')
    }

    if (score.techniqueScore >= 85) {
      strengths.push('操作手法熟练，错误发生率低，显示出良好的技巧基础')
    }

    if (score.timingScore >= 85) {
      strengths.push('时间控制得当，节奏把握良好，既不仓促也不拖沓')
    }

    if (score.completenessScore >= 90) {
      strengths.push('能够完整地完成所有练习步骤，态度认真')
    }

    if (practice.mistakes.filter((m) => m.severity === 'high').length === 0) {
      strengths.push('没有出现严重错误，基础扎实')
    }

    if (practice.hintsUsed === 0) {
      strengths.push('独立完成全部练习，没有依赖提示')
    }

    if (score.grade === 'S' || score.grade === 'A') {
      if (template?.difficulty === 'beginner') {
        strengths.push('已完全掌握入门级内容，可以挑战进阶课程')
      } else if (template?.difficulty === 'intermediate') {
        strengths.push('进阶内容掌握良好，可以向大师级发起挑战')
      }
    }

    const stepScores = score.stepScores
    const highScoringSteps = stepScores.filter((s) => s.score >= s.maxScore * 0.9)
    if (highScoringSteps.length > 0 && template) {
      const stepNames = highScoringSteps
        .map((s) => template.steps.find((step) => step.id === s.stepId)?.title)
        .filter(Boolean)
      if (stepNames.length > 0) {
        strengths.push(`在${stepNames.join('、')}环节表现突出`)
      }
    }

    return strengths
  }

  function identifyWeaknesses(
    practice: PracticeRecord,
    score: PracticeScore,
    template?: TeachingTemplate
  ): string[] {
    const weaknesses: string[] = []

    if (score.accuracyScore < 70) {
      weaknesses.push('临摹准确度有待提升，与模板的偏差较大，需要加强线条控制练习')
    }

    if (score.techniqueScore < 70) {
      weaknesses.push('操作中出现较多错误，需要熟悉操作流程并加强练习')
    }

    if (score.timingScore < 70) {
      weaknesses.push('时间控制需要改进，注意把握每个步骤的节奏')
    }

    if (score.completenessScore < 80) {
      weaknesses.push('部分步骤没有完成，建议完整走完整个流程')
    }

    const highSeverityMistakes = practice.mistakes.filter((m) => m.severity === 'high')
    if (highSeverityMistakes.length > 0) {
      const mistakeTypes = [...new Set(highSeverityMistakes.map((m) => m.description))]
      for (const mistake of mistakeTypes.slice(0, 3)) {
        weaknesses.push(`存在严重问题：${mistake}`)
      }
    }

    if (practice.hintsUsed > 5) {
      weaknesses.push('对提示依赖较重，建议尝试独立完成更多步骤')
    }

    const lowScoringSteps = score.stepScores.filter((s) => s.score < s.maxScore * 0.6)
    if (lowScoringSteps.length > 0 && template) {
      const stepNames = lowScoringSteps
        .map((s) => template.steps.find((step) => step.id === s.stepId)?.title)
        .filter(Boolean)
      if (stepNames.length > 0) {
        weaknesses.push(`需要重点加强：${stepNames.join('、')}`)
      }
    }

    return weaknesses
  }

  function generateImprovements(
    practice: PracticeRecord,
    score: PracticeScore,
    template?: TeachingTemplate
  ): string[] {
    const improvements: string[] = []

    if (score.accuracyScore < 85) {
      if (score.accuracyScore < 70) {
        improvements.push('建议先进行基础线条练习，每天练习10-15分钟的简单线条绘制')
        improvements.push('临摹时先观察模板30秒，记住关键转折点再下笔')
      } else {
        improvements.push('可以适当放慢绘制速度，注意细节部分的准确度')
      }
    }

    if (score.techniqueScore < 85) {
      const recipeMistakes = practice.mistakes.filter((m) => m.type.startsWith('recipe_'))
      const ashbedMistakes = practice.mistakes.filter((m) => m.type.startsWith('ashbed_'))
      const pathMistakes = practice.mistakes.filter((m) => m.type.startsWith('path_'))

      if (recipeMistakes.length > 0) {
        improvements.push('加强配方知识学习，牢记标准配比和粘粉比例范围')
        improvements.push('使用电子秤精确称量，避免凭感觉估算')
      }

      if (ashbedMistakes.length > 0) {
        improvements.push('灰床处理是基础，建议专门练习压灰技巧10-15次')
        improvements.push('注意观察灰床的平整度和厚度，使用灰押时力度要均匀')
      }

      if (pathMistakes.length > 0) {
        improvements.push('绘制路径前先在脑中规划好路线，一气呵成')
        improvements.push('遇到断点不要慌张，使用接续功能修复')
      }
    }

    if (score.timingScore < 85) {
      improvements.push('可以在练习时使用计时器，了解每个步骤的大致用时')
      improvements.push('建立自己的操作节奏，不要因为追求速度而牺牲质量')
    }

    if (practice.mistakes.length > 0) {
      const uniqueSuggestions = [...new Set(practice.mistakes.map((m) => m.suggestion))]
      improvements.push(...uniqueSuggestions.slice(0, 3))
    }

    if (template?.difficulty === 'beginner' && score.grade !== 'S') {
      improvements.push('建议重复练习本课程，直到能够稳定获得A级以上评价')
    }

    return improvements
  }

  function generateNextSteps(
    practice: PracticeRecord,
    score: PracticeScore,
    template?: TeachingTemplate
  ): string[] {
    const nextSteps: string[] = []

    if (score.grade === 'S' || score.grade === 'A') {
      const nextTemplateId = getNextTemplateId(practice.templateId)
      if (nextTemplateId) {
        const nextTemplate = getTemplateById(nextTemplateId)
        if (nextTemplate) {
          nextSteps.push(`恭喜！您已掌握本课程，可以挑战「${nextTemplate.name}」`)
        }
      } else {
        nextSteps.push('您已经完成所有课程！可以尝试自由创作，或者挑战更高的评分标准')
      }
    } else if (score.grade === 'B' || score.grade === 'C') {
      nextSteps.push('建议重复练习本课程2-3次，巩固所学内容')
      nextSteps.push('重点关注评分较低的环节，针对性练习')
    } else {
      if (template && template.prerequisites.length > 0) {
        nextSteps.push(`建议先完成前置课程：${template.prerequisites.join('、')}`)
      } else {
        nextSteps.push('建议从入门基础班开始，循序渐进地学习')
        nextSteps.push('不要急于求成，每个步骤都要理解透彻再继续')
      }
    }

    if (score.accuracyScore < 80) {
      nextSteps.push('每日进行5分钟的线条基础练习：绘制直线、曲线、圆形')
    }

    if (score.techniqueScore < 80) {
      nextSteps.push('下次练习时，每完成一个步骤对照检查清单确认后再继续')
    }

    return nextSteps
  }

  function generateScoreBreakdown(score: PracticeScore): LearningReport['scoreBreakdown'] {
    return [
      {
        category: SCORE_CATEGORIES.accuracy.label,
        score: score.accuracyScore,
        maxScore: 100,
        description: evaluateAccuracy(score.accuracyScore),
      },
      {
        category: SCORE_CATEGORIES.technique.label,
        score: score.techniqueScore,
        maxScore: 100,
        description: evaluateTechnique(score.techniqueScore),
      },
      {
        category: SCORE_CATEGORIES.timing.label,
        score: score.timingScore,
        maxScore: 100,
        description: evaluateTiming(score.timingScore),
      },
      {
        category: SCORE_CATEGORIES.completeness.label,
        score: score.completenessScore,
        maxScore: 100,
        description: evaluateCompleteness(score.completenessScore),
      },
    ]
  }

  function evaluateAccuracy(score: number): string {
    if (score >= 90) return '还原度极高，几乎与模板一致'
    if (score >= 75) return '相似度良好，主要特征都已呈现'
    if (score >= 60) return '基本形状正确，但细节有偏差'
    return '与模板差异较大，需要加强观察和控制'
  }

  function evaluateTechnique(score: number): string {
    if (score >= 90) return '操作娴熟，几乎没有失误'
    if (score >= 75) return '手法熟练，偶有小失误'
    if (score >= 60) return '基本掌握操作方法，有改进空间'
    return '操作不熟练，需要更多练习'
  }

  function evaluateTiming(score: number): string {
    if (score >= 90) return '节奏完美，时间分配合理'
    if (score >= 75) return '时间控制良好'
    if (score >= 60) return '基本按时完成'
    return '时间控制需要改善'
  }

  function evaluateCompleteness(score: number): string {
    if (score >= 90) return '所有环节都完美完成'
    if (score >= 75) return '大部分步骤都已完成'
    if (score >= 60) return '核心步骤已完成'
    return '部分步骤未完成'
  }

  function summarizeMistakes(
    mistakes: CommonMistakeRecord[]
  ): LearningReport['commonMistakesSummary'] {
    const summaryMap = new Map<
      string,
      { count: number; suggestion: string; description: string }
    >()

    for (const mistake of mistakes) {
      const existing = summaryMap.get(mistake.type)
      if (existing) {
        existing.count++
      } else {
        summaryMap.set(mistake.type, {
          count: 1,
          suggestion: mistake.suggestion,
          description: mistake.description,
        })
      }
    }

    const result: LearningReport['commonMistakesSummary'] = []
    for (const [mistakeType, data] of summaryMap.entries()) {
      result.push({
        mistakeType: data.description,
        count: data.count,
        suggestion: data.suggestion,
      })
    }

    return result.sort((a, b) => b.count - a.count)
  }

  function getRecommendedTemplates(practice: PracticeRecord, score: PracticeScore): string[] {
    const recommendations: string[] = []
    const currentTemplate = getTemplateById(practice.templateId)

    if (score.grade === 'S' || score.grade === 'A') {
      const nextId = getNextTemplateId(practice.templateId)
      if (nextId) {
        recommendations.push(nextId)
      }
    } else if (score.grade === 'B') {
      if (currentTemplate?.prerequisites.length === 0) {
        recommendations.push(practice.templateId)
      }
    } else {
      if (currentTemplate && currentTemplate.prerequisites.length > 0) {
        recommendations.push(...currentTemplate.prerequisites)
      } else {
        recommendations.push('beginner_basic')
      }
    }

    return recommendations
  }

  function saveReport(report: LearningReport) {
    try {
      const stored = localStorage.getItem(LEARNING_REPORT_STORAGE_KEY)
      const reports: LearningReport[] = stored ? JSON.parse(stored) : []
      reports.unshift(report)
      localStorage.setItem(LEARNING_REPORT_STORAGE_KEY, JSON.stringify(reports))
    } catch (e) {
      console.error('Failed to save learning report:', e)
    }
  }

  function loadReports(): LearningReport[] {
    try {
      const stored = localStorage.getItem(LEARNING_REPORT_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.error('Failed to load learning reports:', e)
      return []
    }
  }

  function getReportForPractice(practiceId: string): LearningReport | undefined {
    const reports = loadReports()
    return reports.find((r) => r.practiceId === practiceId)
  }

  function generateAndSaveReport(practice: PracticeRecord): LearningReport {
    const report = generateReport(practice)
    saveReport(report)
    return report
  }

  function getLearningProgress() {
    const reports = loadReports()
    const uniqueTemplateIds = [...new Set(reports.map((r) => r.practiceId))]

    const gradedPractices = reports
      .map((r) => {
        const practice = getPracticeById(r.practiceId)
        return { report: r, practice }
      })
      .filter((item): item is { report: LearningReport; practice: PracticeRecord } => !!item.practice)

    const masterCount = gradedPractices.filter(
      (item) => item.practice.score?.grade === 'S' || item.practice.score?.grade === 'A'
    ).length

    const avgScore =
      gradedPractices.length > 0
        ? Math.round(
            gradedPractices.reduce((sum, item) => sum + (item.practice.score?.totalScore ?? 0), 0) /
              gradedPractices.length
          )
        : 0

    return {
      totalReports: reports.length,
      uniquePractices: uniqueTemplateIds.length,
      masteredCount: masterCount,
      averageScore: avgScore,
      reportHistory: reports.slice(0, 10),
    }
  }

  function getPracticeById(practiceId: string): PracticeRecord | undefined {
    try {
      const stored = localStorage.getItem('incense_practice_records')
      if (!stored) return undefined
      const practices: PracticeRecord[] = JSON.parse(stored)
      return practices.find((p) => p.id === practiceId)
    } catch {
      return undefined
    }
  }

  return {
    generateReport,
    generateAndSaveReport,
    saveReport,
    loadReports,
    getReportForPractice,
    getLearningProgress,
  }
}
