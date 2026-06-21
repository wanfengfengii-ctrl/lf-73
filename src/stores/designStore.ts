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
  distance,
} from '@/utils/geometry'

export const useDesignStore = defineStore('design', () => {
  const strokes = ref<PathPoint[][]>([])
  const currentStroke = ref<PathPoint[]>([])
  const lineWidth = ref(DEFAULT_LINE_WIDTH)
  const density = ref(DEFAULT_DENSITY)
  const ignitionPoint = ref<PathPoint | null>(null)
  const currentTool = ref<ToolType>('brush')
  const isDrawing = ref(false)

  const allPoints = computed<PathPoint[]>(() => {
    const result: PathPoint[] = []
    for (const stroke of strokes.value) {
      result.push(...stroke)
    }
    if (currentStroke.value.length > 0) {
      result.push(...currentStroke.value)
    }
    return result
  })

  const strokeCount = computed(() => {
    return strokes.value.length + (currentStroke.value.length > 0 ? 1 : 0)
  })

  function getStrokeEndpoints(stroke: PathPoint[]): { start: PathPoint; end: PathPoint } {
    return {
      start: stroke[0],
      end: stroke[stroke.length - 1],
    }
  }

  function countConnectedComponents(): number {
    const allStrokes = [...strokes.value]
    if (currentStroke.value.length >= 2) {
      allStrokes.push(currentStroke.value)
    }

    if (allStrokes.length <= 1) return allStrokes.length

    const threshold = lineWidth.value * 2
    const parent: number[] = []
    for (let i = 0; i < allStrokes.length; i++) {
      parent[i] = i
    }

    function find(x: number): number {
      if (parent[x] !== x) {
        parent[x] = find(parent[x])
      }
      return parent[x]
    }

    function union(x: number, y: number) {
      const px = find(x)
      const py = find(y)
      if (px !== py) {
        parent[px] = py
      }
    }

    for (let i = 0; i < allStrokes.length; i++) {
      if (allStrokes[i].length < 2) continue
      const ep1 = getStrokeEndpoints(allStrokes[i])

      for (let j = i + 1; j < allStrokes.length; j++) {
        if (allStrokes[j].length < 2) continue
        const ep2 = getStrokeEndpoints(allStrokes[j])

        const d1 = distance(ep1.start, ep2.start)
        const d2 = distance(ep1.start, ep2.end)
        const d3 = distance(ep1.end, ep2.start)
        const d4 = distance(ep1.end, ep2.end)

        if (
          d1 <= threshold ||
          d2 <= threshold ||
          d3 <= threshold ||
          d4 <= threshold
        ) {
          union(i, j)
        }
      }
    }

    const roots = new Set<number>()
    for (let i = 0; i < allStrokes.length; i++) {
      if (allStrokes[i].length >= 2) {
        roots.add(find(i))
      }
    }

    return roots.size
  }

  function isPointOnAnyStroke(point: PathPoint, tolerance: number): boolean {
    for (const stroke of strokes.value) {
      if (stroke.length >= 2 && isPointOnPath(point, stroke, tolerance)) {
        return true
      }
    }
    if (currentStroke.value.length >= 2) {
      if (isPointOnPath(point, currentStroke.value, tolerance)) {
        return true
      }
    }
    return false
  }

  const analysis = computed<PathAnalysis>(() => {
    const warnings: string[] = []
    const errors: string[] = []
    let isValid = true

    const points = allPoints.value
    const totalLength = calculatePathLength(points)
    const lengthInCm = totalLength / PIXELS_PER_CM

    const widthFactor = 1 + (lineWidth.value - DEFAULT_LINE_WIDTH) * 0.05
    const densityFactor = density.value
    const burnTimeInSeconds = (lengthInCm * BASE_BURN_RATE * densityFactor) / widthFactor

    let intersectionCount = 0
    const allIntersections: PathPoint[] = []

    const validStrokes = strokes.value.filter((s) => s.length >= 2)
    if (currentStroke.value.length >= 2) {
      validStrokes.push(currentStroke.value)
    }

    for (const stroke of validStrokes) {
      const intersections = findIntersections(stroke)
      for (const ip of intersections) {
        let isDuplicate = false
        for (const existing of allIntersections) {
          if (distance(existing, ip) < 5) {
            isDuplicate = true
            break
          }
        }
        if (!isDuplicate) {
          allIntersections.push(ip)
        }
      }
    }
    intersectionCount = allIntersections.length

    if (intersectionCount > MAX_INTERSECTION_WARNING) {
      warnings.push(`路径自交点较多（${intersectionCount}个），可能影响燃烧效果`)
    }

    const breakRiskPoints: PathPoint[] = []
    for (const stroke of validStrokes) {
      const highCurvature = findHighCurvaturePoints(stroke, 0.08)
      breakRiskPoints.push(...highCurvature)
    }
    breakRiskPoints.push(...allIntersections)

    if (validStrokes.length === 0) {
      errors.push('请先绘制香线路径')
      isValid = false
    } else {
      const components = countConnectedComponents()
      if (components > 1) {
        errors.push(`路径存在 ${components} 处断点，香线必须是连续的一条线`)
        isValid = false
      }
    }

    if (validStrokes.length > 0 && totalLength < 10) {
      errors.push('路径过短，请绘制更长的香线')
      isValid = false
    }

    if (!ignitionPoint.value && validStrokes.length > 0) {
      errors.push('请设置起燃点')
      isValid = false
    }

    if (ignitionPoint.value && validStrokes.length > 0) {
      if (!isPointOnAnyStroke(ignitionPoint.value, lineWidth.value)) {
        errors.push('起燃点必须落在香线路径上')
        isValid = false
      }
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

    if (strokes.value.length > 5) {
      warnings.push('笔画数较多，建议减少笔画数使路径更流畅')
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
    points: allPoints.value,
    lineWidth: lineWidth.value,
    density: density.value,
    ignitionPoint: ignitionPoint.value,
  }))

  function beginStroke(point: PathPoint) {
    currentStroke.value = [point]
    isDrawing.value = true
  }

  function continueStroke(point: PathPoint) {
    if (currentStroke.value.length === 0) return
    const lastPoint = currentStroke.value[currentStroke.value.length - 1]
    if (distance(lastPoint, point) > 2) {
      currentStroke.value.push(point)
    }
  }

  function endStroke() {
    if (currentStroke.value.length >= 2) {
      strokes.value.push([...currentStroke.value])
    }
    currentStroke.value = []
    isDrawing.value = false
  }

  function undoStroke() {
    if (currentStroke.value.length > 0) {
      currentStroke.value = []
      isDrawing.value = false
      return
    }
    if (strokes.value.length > 0) {
      strokes.value.pop()
    }
    if (ignitionPoint.value) {
      if (!isPointOnAnyStroke(ignitionPoint.value, lineWidth.value)) {
        ignitionPoint.value = null
      }
    }
  }

  function clearAll() {
    strokes.value = []
    currentStroke.value = []
    ignitionPoint.value = null
    isDrawing.value = false
  }

  function eraseAtPoint(point: PathPoint) {
    const eraseRadius = lineWidth.value * 3
    const newStrokes: PathPoint[][] = []

    for (const stroke of strokes.value) {
      let lastSplitIndex = 0
      for (let i = 0; i < stroke.length; i++) {
        if (distance(stroke[i], point) <= eraseRadius) {
          if (i - lastSplitIndex >= 2) {
            newStrokes.push(stroke.slice(lastSplitIndex, i))
          }
          lastSplitIndex = i + 1
        }
      }
      if (lastSplitIndex < stroke.length && stroke.length - lastSplitIndex >= 2) {
        newStrokes.push(stroke.slice(lastSplitIndex))
      }
    }

    strokes.value = newStrokes

    if (ignitionPoint.value) {
      if (!isPointOnAnyStroke(ignitionPoint.value, lineWidth.value)) {
        ignitionPoint.value = null
      }
    }
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
    if (scheme.path.points && scheme.path.points.length > 0) {
      strokes.value = [[...scheme.path.points]]
    } else {
      strokes.value = []
    }
    currentStroke.value = []
    lineWidth.value = scheme.path.lineWidth
    density.value = scheme.path.density
    ignitionPoint.value = scheme.path.ignitionPoint ? { ...scheme.path.ignitionPoint } : null
  }

  function reset() {
    strokes.value = []
    currentStroke.value = []
    lineWidth.value = DEFAULT_LINE_WIDTH
    density.value = DEFAULT_DENSITY
    ignitionPoint.value = null
    currentTool.value = 'brush'
    isDrawing.value = false
  }

  return {
    strokes,
    currentStroke,
    allPoints,
    strokeCount,
    lineWidth,
    density,
    ignitionPoint,
    currentTool,
    isDrawing,
    analysis,
    currentPath,
    beginStroke,
    continueStroke,
    endStroke,
    undoStroke,
    clearAll,
    eraseAtPoint,
    setLineWidth,
    setDensity,
    setIgnitionPoint,
    setTool,
    setDrawing,
    loadScheme,
    reset,
  }
})
