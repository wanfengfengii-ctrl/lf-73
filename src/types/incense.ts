export interface PathPoint {
  x: number
  y: number
  timestamp?: number
}

export interface IncensePath {
  points: PathPoint[]
  lineWidth: number
  density: number
  ignitionPoint: PathPoint | null
}

export interface PathAnalysis {
  totalLength: number
  estimatedBurnTime: number
  intersectionCount: number
  breakRiskPoints: PathPoint[]
  isValid: boolean
  warnings: string[]
  errors: string[]
}

export interface IncenseScheme {
  id: string
  name: string
  path: IncensePath
  analysis: PathAnalysis
  createdAt: number
  updatedAt: number
}

export type ToolType = 'brush' | 'ignition' | 'eraser'

export type CanvasSize = {
  width: number
  height: number
}
