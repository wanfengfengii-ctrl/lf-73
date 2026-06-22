export const DEFAULT_LINE_WIDTH = 4
export const MIN_LINE_WIDTH = 1
export const MAX_LINE_WIDTH = 20

export const DEFAULT_ERASER_SIZE = 12
export const MIN_ERASER_SIZE = 6
export const MAX_ERASER_SIZE = 40

export const DEFAULT_DENSITY = 1.0
export const MIN_DENSITY = 0.5
export const MAX_DENSITY = 3.0

export const BASE_BURN_RATE = 30
export const PIXELS_PER_CM = 37.8

export const MAX_INTERSECTION_WARNING = 5
export const MAX_OVERLAP_WARNING = 3

export const SCHEME_STORAGE_KEY = 'incense_schemes'
export const VERSION_STORAGE_KEY = 'incense_scheme_versions'

export const CANVAS_WIDTH = 600
export const CANVAS_HEIGHT = 600

export const BREAKPOINT_CONNECT_THRESHOLD = 20
export const OVERLAP_THRESHOLD = 3

export const MAX_HISTORY_SIZE = 50
export const BURN_ANIMATION_SPEED = 0.5

export const THUMBNAIL_WIDTH = 120
export const THUMBNAIL_HEIGHT = 120

export const DEFAULT_HUMIDITY = 50
export const MIN_HUMIDITY = 10
export const MAX_HUMIDITY = 90

export const DEFAULT_TEMPERATURE = 22
export const MIN_TEMPERATURE = 0
export const MAX_TEMPERATURE = 40

export const DEFAULT_AIRFLOW = 1
export const MIN_AIRFLOW = 0
export const MAX_AIRFLOW = 5

export const DEFAULT_ASH_BED_THICKNESS = 5
export const MIN_ASH_BED_THICKNESS = 1
export const MAX_ASH_BED_THICKNESS = 15

export const OPTIMAL_HUMIDITY_MIN = 35
export const OPTIMAL_HUMIDITY_MAX = 65
export const OPTIMAL_TEMPERATURE_MIN = 18
export const OPTIMAL_TEMPERATURE_MAX = 28
export const OPTIMAL_AIRFLOW_MAX = 2
export const OPTIMAL_ASH_BED_MIN = 3
export const OPTIMAL_ASH_BED_MAX = 8

export const BINDER_MIN_RATIO = 10
export const BINDER_OPTIMAL_RATIO = 15
export const BINDER_MAX_RATIO = 30

export const EXPERIMENT_STORAGE_KEY = 'incense_experiments'

export const DEVIATION_SEVERITY_LOW = 10
export const DEVIATION_SEVERITY_MEDIUM = 25
export const DEVIATION_SEVERITY_HIGH = 50

export const PRACTICE_STORAGE_KEY = 'incense_practice_records'
export const LEARNING_REPORT_STORAGE_KEY = 'incense_learning_reports'
export const SKILL_PROGRESS_STORAGE_KEY = 'incense_skill_progress'

export const DEFAULT_STEP_SCORE = 20
export const HINT_PENALTY = 2
export const MAX_HINTS_PER_STEP = 3

export const TRACING_SIMILARITY_THRESHOLD = 70
export const PATH_DEVIATION_TOLERANCE = 15

export const GRADE_THRESHOLDS = {
  S: 95,
  A: 85,
  B: 70,
  C: 60,
  D: 40,
  F: 0,
}

export const SCORE_CATEGORIES = {
  accuracy: { weight: 0.35, label: '准确度' },
  technique: { weight: 0.30, label: '操作技巧' },
  timing: { weight: 0.20, label: '时间控制' },
  completeness: { weight: 0.15, label: '完整性' },
}

export const COMMON_MISTAKE_TYPES = [
  { type: 'recipe_wrong_ratio', label: '配方比例错误', severity: 'medium' as const },
  { type: 'recipe_low_binder', label: '粘粉比例不足', severity: 'high' as const },
  { type: 'recipe_high_binder', label: '粘粉比例过高', severity: 'medium' as const },
  { type: 'ashbed_too_thin', label: '灰床太薄', severity: 'high' as const },
  { type: 'ashbed_too_thick', label: '灰床太厚', severity: 'medium' as const },
  { type: 'ashbed_uneven', label: '灰床不平整', severity: 'medium' as const },
  { type: 'path_discontinuous', label: '路径不连续', severity: 'high' as const },
  { type: 'path_overlapping', label: '路径重叠过多', severity: 'medium' as const },
  { type: 'path_too_thin', label: '线宽太细', severity: 'low' as const },
  { type: 'path_too_thick', label: '线宽太粗', severity: 'low' as const },
  { type: 'path_no_ignition', label: '未设置起燃点', severity: 'high' as const },
  { type: 'path_ignition_off', label: '起燃点不在路径上', severity: 'medium' as const },
  { type: 'ignition_failure', label: '点燃失败', severity: 'high' as const },
  { type: 'ignition_partial', label: '部分断火', severity: 'medium' as const },
  { type: 'recording_incomplete', label: '记录不完整', severity: 'low' as const },
  { type: 'timing_too_slow', label: '操作过慢', severity: 'low' as const },
  { type: 'timing_too_fast', label: '操作过快', severity: 'low' as const },
]
