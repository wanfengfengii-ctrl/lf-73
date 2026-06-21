import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PathPoint, IncensePath, PathAnalysis, IncenseScheme, ToolType } from '@/types/incense'
import {
  DEFAULT_LINE_WIDTH,
  DEFAULT_DENSITY,
  MIN_LINE_WIDTH,
  MAX_LINE_WIDTH,
  MIN_DENSITY,
  MAX_DENSITY,
  BASE_BURN_RATE,
  PIXELS_PER_CM,
  MAX_INTERSECTION_WARNING,
} from '@/utils/constants'
import {
  calculatePathLength,
  findIntersections,
  isPointOnPath,
  findHighCurvaturePoints,
} from '@/utils/geometry'

export const useDesignStore = defineStore('design', () => {
  const points = ref<PathPoint[]>([])
  const lineWidth = ref(DEFAULT_LINE_WIDTH)
  const density = ref(DEFAULT_DENSITY)
  const ignitionPoint = ref<PathPoint | null>(null)
  const currentTool = ref<ToolType>('brush')
  const isDrawing = ref(false)

  const analysis = computed<PathAnalysis>(() => {
    const warnings: string[] = []
    const errors: string[] = []
    let isValid = true

    const totalLength = calculatePathLength(points.value)
    const lengthInCm = totalLength / PIXELS_PER_CM

    const widthFactor = 1 + (lineWidth.value - DEFAULT_LINE_WIDTH) * 0.05
    const densityFactor = density.value
    const burnTimeInSeconds = (lengthInCm * BASE_BURN_RATE * densityFactor) / widthFactor

    const intersections = findIntersections(points.value)
    const intersectionCount = intersections.length

    if (intersectionCount > MAX_INTERSECTION_WARNING) {
      warnings.push(`路径自交点较多（${intersectionCount}个），可能影响燃烧效果`)
    }

    const highCurvaturePoints = findHighCurvaturePoints(points.value, 0.08)
    const breakRiskPoints = [...intersections, ...highCurvaturePoints]

    if (points.value.length === 0) {
      errors.push('请先绘制香线路径')
      isValid = false
    } else if (points.value.length < 2) {
      errors.push('路径过短，请绘制更长的香线')
      isValid = false
    }

    if (!ignitionPoint.value && points.value.length > 0) {
      errors.push('请设置起燃点')
      isValid = false
    }

    if (
      ignitionPoint.value &&
      points.value.length > 0 &&
      !isPointOnPath(ignitionPoint.value, points.value, lineWidth.value)
    ) {
      errors.push('起燃点必须落在香线路径上')
      isValid = false
    }

    if (lineWidth.value <= 0) {
      errors.push('线宽必须大于 0')
      isValid = false
    }

    if (density.value <= 0) {
      errors.push('香粉密度必须大于 0')
      isValid = false
    }

    if (lineWidth.value < MIN_LINE_WIDTH || lineWidth.value > MAX_LINE_WIDTH) {
      warnings.push(`线宽建议在 ${MIN_LINE_WIDTH}-${MAX_LINE_WIDTH} 像素之间`)
    }

    if (density.value < MIN_DENSITY || density.value > MAX_DENSITY) {
      warnings.push(`密度建议在 ${MIN_DENSITY}-${MAX_DENSITY} 之间`)
    }

    return {
      totalLength,
      estimatedBurnTime: burnTimeInSeconds,
      intersectionCount,
      breakRiskPoints,
      isValid,
      warnings,
      errors,
    }
  })

  const currentPath = computed<IncensePath>(() => ({
    points: points.value,
    lineWidth: lineWidth.value,
    density: density.value,
    ignitionPoint: ignitionPoint.value,
  }))

  function setPoints(newPoints: PathPoint[]) {
    points.value = newPoints
  }

  function addPoint(point: PathPoint) {
    points.value.push(point)
  }

  function clearPath() {
    points.value = []
    ignitionPoint.value = null
  }

  function setLineWidth(width: number) {
    lineWidth.value = Math.max(MIN_LINE_WIDTH, Math.min(MAX_LINE_WIDTH, width))
  }

  function setDensity(d: number) {
    density.value = Math.max(MIN_DENSITY, Math.min(MAX_DENSITY, d))
  }

  function setIgnitionPoint(point: PathPoint | null) {
    ignitionPoint.value = point
  }

  function setTool(tool: ToolType) {
    currentTool.value = tool
  }

  function setDrawing(drawing: boolean) {
    isDrawing.value = drawing
  }

  function loadScheme(scheme: IncenseScheme) {
    points.value = [...scheme.path.points]
    lineWidth.value = scheme.path.lineWidth
    density.value = scheme.path.density
    ignitionPoint.value = scheme.path.ignitionPoint ? { ...scheme.path.ignitionPoint } : null
  }

  function reset() {
    points.value = []
    lineWidth.value = DEFAULT_LINE_WIDTH
    density.value = DEFAULT_DENSITY
    ignitionPoint.value = null
    currentTool.value = 'brush'
    isDrawing.value = false
  }

  return {
    points,
    lineWidth,
    density,
    ignitionPoint,
    currentTool,
    isDrawing,
    analysis,
    currentPath,
    setPoints,
    addPoint,
    clearPath,
    setLineWidth,
    setDensity,
    setIgnitionPoint,
    setTool,
    setDrawing,
    loadScheme,
    reset,
  }
})
