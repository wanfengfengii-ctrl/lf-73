export interface PathPoint {
  x: number
  y: number
  timestamp?: number
  pressure?: number
}

export interface Stroke {
  id: string
  points: PathPoint[]
  lineWidth: number
  createdAt: number
}

export interface IncensePath {
  points: PathPoint[]
  strokes: PathPoint[][]
  lineWidth: number
  density: number
  ignitionPoint: PathPoint | null
}

export interface BreakPointInfo {
  index: number
  startPoint: PathPoint
  endPoint: PathPoint
  distance: number
  suggestedPath: PathPoint[]
}

export interface OverlapInfo {
  segment1: { start: PathPoint; end: PathPoint }
  segment2: { start: PathPoint; end: PathPoint }
  overlapLength: number
  centerPoint: PathPoint
}

export interface PathAnalysis {
  totalLength: number
  estimatedBurnTime: number
  intersectionCount: number
  breakRiskPoints: PathPoint[]
  breakPoints: BreakPointInfo[]
  overlaps: OverlapInfo[]
  isValid: boolean
  warnings: string[]
  errors: string[]
}

export interface SchemeVersion {
  id: string
  version: number
  path: IncensePath
  analysis: PathAnalysis
  thumbnail: string
  createdAt: number
  description?: string
}

export interface IncenseScheme {
  id: string
  name: string
  path: IncensePath
  analysis: PathAnalysis
  thumbnail: string
  versions: SchemeVersion[]
  currentVersion: number
  createdAt: number
  updatedAt: number
}

export type ToolType = 'brush' | 'ignition' | 'eraser' | 'continue'

export type CanvasSize = {
  width: number
  height: number
}

export interface BurnAnimationState {
  isPlaying: boolean
  currentTime: number
  duration: number
  burntPoints: PathPoint[]
  currentBurnPoint: PathPoint | null
}

export interface ComparisonScheme {
  scheme: IncenseScheme
  selected: boolean
}

export interface HistoryAction {
  type: 'add' | 'remove' | 'modify' | 'clear'
  data: Stroke | Stroke[]
}

export interface UndoRedoState {
  past: HistoryAction[][]
  future: HistoryAction[][]
}

export interface PowderIngredient {
  name: string
  ratio: number
  burnRateFactor: number
  stabilityFactor: number
}

export interface IncenseRecipe {
  ingredients: PowderIngredient[]
  totalRatio: number
}

export interface EnvironmentParams {
  humidity: number
  temperature: number
  airflow: number
  ashBedThickness: number
}

export interface AdaptationResult {
  combustionStability: number
  flameoutProbability: number
  ashLineQuality: number
  burnTimeDeviation: number
  overallScore: number
}

export interface OptimizationSuggestion {
  category: 'recipe' | 'environment' | 'ashbed' | 'technique'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  parameter?: string
  targetValue?: number
  currentValue?: number
}

export interface AdaptationScenario {
  name: string
  description: string
  params: EnvironmentParams
  result: AdaptationResult
}

export interface FlameoutRecord {
  position: { x: number; y: number }
  pathProgress: number
  timestamp: number
  reason?: string
}

export interface AshLinePhoto {
  id: string
  dataUrl: string
  caption?: string
  timestamp: number
}

export type IgnitionResult = 'full_success' | 'partial_flameout' | 'complete_failure' | 'delayed_ignition'

export type ExperimentStatus = 'draft' | 'recording' | 'completed' | 'reviewed'

export interface ExperimentRecord {
  id: string
  name: string
  schemeId?: string
  schemeSnapshot?: IncenseScheme
  status: ExperimentStatus
  createdAt: number
  completedAt?: number
  recipe: PowderIngredient[]
  environment: EnvironmentParams
  theoreticalAnalysis: {
    estimatedBurnTime: number
    combustionStability: number
    flameoutProbability: number
    ashLineQuality: number
    burnTimeDeviation: number
    overallScore: number
  }
  actualResult: {
    ignitionResult: IgnitionResult
    actualBurnTime: number | null
    flameoutRecords: FlameoutRecord[]
    ashLinePhotos: AshLinePhoto[]
    ashLineQualityScore: number | null
    notes: string
  }
  review?: ExperimentReview
}

export interface ParameterDeviation {
  parameter: string
  label: string
  theoretical: number
  actual: number
  deviation: number
  deviationPercent: number
  severity: 'low' | 'medium' | 'high'
}

export interface ExperimentReview {
  id: string
  experimentId: string
  createdAt: number
  deviations: ParameterDeviation[]
  burnTimeDeviation: ParameterDeviation | null
  flameoutAnalysis: string
  ashLineAnalysis: string
  overallConclusion: string
  nextOptimizationSuggestions: OptimizationSuggestion[]
  experienceTags: string[]
  stabilityScore: number
}

export const IGNITION_RESULT_LABELS: Record<IgnitionResult, string> = {
  full_success: '完全成功',
  partial_flameout: '部分断火',
  complete_failure: '完全熄灭',
  delayed_ignition: '延迟点燃',
}

export const EXPERIMENT_STATUS_LABELS: Record<ExperimentStatus, string> = {
  draft: '草稿',
  recording: '记录中',
  completed: '已完成',
  reviewed: '已复盘',
}

export const DEFAULT_POWDERS = [
  { name: '沉香粉', burnRateFactor: 0.9, stabilityFactor: 1.1 },
  { name: '檀香粉', burnRateFactor: 1.0, stabilityFactor: 1.0 },
  { name: '崖柏粉', burnRateFactor: 1.2, stabilityFactor: 0.9 },
  { name: '丁香粉', burnRateFactor: 1.1, stabilityFactor: 0.85 },
  { name: '楠木粘粉', burnRateFactor: 0.7, stabilityFactor: 1.3 },
] as const

export type TeachingStepType = 'recipe' | 'ashbed' | 'path' | 'ignition' | 'recording'

export interface TeachingStep {
  id: string
  type: TeachingStepType
  title: string
  order: number
  description: string
  instructions: string[]
  tips: string[]
  commonMistakes: string[]
  requiredChecks: TeachingCheckItem[]
  estimatedTime: number
  demoVideoUrl?: string
}

export interface TeachingCheckItem {
  id: string
  label: string
  description: string
  validatorType: 'manual' | 'auto' | 'param'
  parameter?: string
  targetValue?: number
  tolerance?: number
}

export interface TeachingTemplate {
  id: string
  name: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  icon: string
  steps: TeachingStep[]
  targetScheme?: IncenseScheme
  targetRecipe?: PowderIngredient[]
  targetEnvironment?: EnvironmentParams
  prerequisites: string[]
  learningObjectives: string[]
}

export type PracticeMode = 'tracing' | 'free' | 'challenge'
export type PracticeStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'reviewed'

export interface StepAction {
  id: string
  stepId: string
  action: 'start' | 'complete' | 'skip' | 'hint' | 'mistake'
  timestamp: number
  data?: Record<string, unknown>
}

export interface TracingData {
  templatePath: PathPoint[]
  userPath: PathPoint[]
  similarityScore: number
  deviationPoints: { point: PathPoint; distance: number }[]
}

export interface CommonMistakeRecord {
  id: string
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  stepId: string
  suggestion: string
  timestamp: number
}

export interface StepScore {
  stepId: string
  score: number
  maxScore: number
  deductions: { reason: string; points: number }[]
  bonuses: { reason: string; points: number }[]
}

export interface PracticeScore {
  totalScore: number
  maxScore: number
  percentage: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F'
  stepScores: StepScore[]
  accuracyScore: number
  techniqueScore: number
  timingScore: number
  completenessScore: number
}

export interface PracticeRecord {
  id: string
  templateId: string
  templateName: string
  mode: PracticeMode
  status: PracticeStatus
  userId?: string
  startedAt: number
  completedAt?: number
  currentStepIndex: number
  completedSteps: string[]
  actions: StepAction[]
  recipe?: PowderIngredient[]
  environment?: EnvironmentParams
  userPath?: IncensePath
  tracingData?: TracingData
  mistakes: CommonMistakeRecord[]
  score?: PracticeScore
  timeSpent: number
  hintsUsed: number
}

export interface LearningReport {
  id: string
  practiceId: string
  generatedAt: number
  overallAssessment: string
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  suggestedNextSteps: string[]
  scoreBreakdown: {
    category: string
    score: number
    maxScore: number
    description: string
  }[]
  commonMistakesSummary: {
    mistakeType: string
    count: number
    suggestion: string
  }[]
  recommendedTemplates: string[]
}

export interface SkillProgress {
  skillId: string
  skillName: string
  level: number
  maxLevel: number
  experience: number
  milestones: { name: string; achieved: boolean }[]
}

export const TEACHING_STEP_LABELS: Record<TeachingStepType, string> = {
  recipe: '配方设置',
  ashbed: '灰床处理',
  path: '香线绘制',
  ignition: '点燃记录',
  recording: '燃烧观察',
}

export const PRACTICE_MODE_LABELS: Record<PracticeMode, string> = {
  tracing: '临摹练习',
  free: '自由练习',
  challenge: '挑战模式',
}

export const PRACTICE_STATUS_LABELS: Record<PracticeStatus, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  paused: '已暂停',
  completed: '已完成',
  reviewed: '已评测',
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '大师',
}

export const GRADE_LABELS: Record<string, string> = {
  S: '优秀',
  A: '良好',
  B: '合格',
  C: '待提高',
  D: '需努力',
  F: '不及格',
}
