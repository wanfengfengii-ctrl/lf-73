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
