import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PathPoint,
  IncensePath,
  PathAnalysis,
  IncenseScheme,
  ToolType,
  BurnAnimationState,
  HistoryAction,
  SchemeVersion,
  Stroke,
} from '@/types/incense'
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
  MAX_OVERLAP_WARNING,
  MAX_HISTORY_SIZE,
  DEFAULT_ERASER_SIZE,
  MIN_ERASER_SIZE,
  MAX_ERASER_SIZE,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
} from '@/utils/constants'
import {
  calculatePathLength,
  findIntersections,
  findMultiStrokeIntersections,
  isPointOnPath,
  findHighCurvaturePoints,
  distance,
  findAllOverlaps,
  findBreakPoints,
  findClosestEndpoint,
  mergeStrokes,
  getPointAtProgress,
  simplifyPath,
} from '@/utils/geometry'

function generateStrokeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export const useDesignStore = defineStore('design', () => {
  const strokes = ref<PathPoint[][]>([])
  const currentStroke = ref<PathPoint[]>([])
  const lineWidth = ref(DEFAULT_LINE_WIDTH)
  const density = ref(DEFAULT_DENSITY)
  const eraserSize = ref(DEFAULT_ERASER_SIZE)
  const ignitionPoint = ref<PathPoint | null>(null)
  const currentTool = ref<ToolType>('brush')
  const isDrawing = ref(false)
  const continueStrokeIndex = ref<number | null>(null)
  const continueFromStart = ref<boolean>(false)

  const history = ref<HistoryAction[][]>([])
  const future = ref<HistoryAction[][]>([])

  const burnAnimation = ref<BurnAnimationState>({
    isPlaying: false,
    currentTime: 0,
    duration: 10,
    burntPoints: [],
    currentBurnPoint: null,
  })

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

  const canUndo = computed(() => history.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

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

        if (d1 <= threshold || d2 <= threshold || d3 <= threshold || d4 <= threshold) {
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

    const validStrokes = strokes.value.filter((s) => s.length >= 2)
    if (currentStroke.value.length >= 2) {
      validStrokes.push(currentStroke.value)
    }

    let intersectionCount = 0
    const allIntersections: PathPoint[] = []

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

    if (validStrokes.length > 1) {
      const crossIntersections = findMultiStrokeIntersections(validStrokes)
      for (const ip of crossIntersections) {
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

    const overlaps = findAllOverlaps(validStrokes)

    if (overlaps.length > MAX_OVERLAP_WARNING) {
      warnings.push(`路径重叠较多（${overlaps.length}处），建议优化路径`)
    }

    const breakPoints = findBreakPoints(validStrokes)

    if (breakPoints.length > 0) {
      warnings.push(`检测到 ${breakPoints.length} 处断点，可自动修复`)
    }

    const breakRiskPoints: PathPoint[] = []
    for (const stroke of validStrokes) {
      const highCurvature = findHighCurvaturePoints(stroke, 0.08)
      breakRiskPoints.push(...highCurvature)
    }
    breakRiskPoints.push(...allIntersections)
    for (const overlap of overlaps) {
      breakRiskPoints.push(overlap.centerPoint)
    }

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
      breakPoints,
      overlaps,
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

  function saveToHistory(action: HistoryAction[]) {
    history.value.push(action)
    if (history.value.length > MAX_HISTORY_SIZE) {
      history.value.shift()
    }
    future.value = []
  }

  function beginStroke(point: PathPoint) {
    if (currentTool.value === 'continue' && strokes.value.length > 0) {
      const closest = findClosestEndpoint(point, strokes.value)
      if (closest && closest.distance < lineWidth.value * 3) {
        continueStrokeIndex.value = closest.strokeIndex
        continueFromStart.value = closest.isStart
        if (closest.isStart) {
          currentStroke.value = [{ ...point }]
        } else {
          currentStroke.value = [{ ...point }]
        }
        isDrawing.value = true
        return
      }
    }

    currentStroke.value = [{ ...point }]
    isDrawing.value = true
    continueStrokeIndex.value = null
  }

  function continueStroke(point: PathPoint) {
    if (currentStroke.value.length === 0) return
    const lastPoint = currentStroke.value[currentStroke.value.length - 1]
    if (distance(lastPoint, point) > 2) {
      currentStroke.value.push({ ...point })
    }
  }

  function endStroke() {
    if (currentStroke.value.length >= 2) {
      const newStroke = [...currentStroke.value]

      if (continueStrokeIndex.value !== null) {
        const targetStroke = strokes.value[continueStrokeIndex.value]
        let merged: PathPoint[]

        if (continueFromStart.value) {
          merged = mergeStrokes(newStroke, targetStroke)
        } else {
          merged = mergeStrokes(targetStroke, newStroke)
        }

        const oldStroke = [...strokes.value[continueStrokeIndex.value]]
        strokes.value[continueStrokeIndex.value] = merged

        saveToHistory([
          { type: 'remove', data: { id: generateStrokeId(), points: oldStroke, lineWidth: lineWidth.value, createdAt: Date.now() } },
          { type: 'add', data: { id: generateStrokeId(), points: merged, lineWidth: lineWidth.value, createdAt: Date.now() } },
        ])
      } else {
        strokes.value.push(newStroke)
        saveToHistory([
          { type: 'add', data: { id: generateStrokeId(), points: newStroke, lineWidth: lineWidth.value, createdAt: Date.now() } },
        ])
      }

      continueStrokeIndex.value = null
    }

    currentStroke.value = []
    isDrawing.value = false
  }

  function undoStroke() {
    if (future.value.length === 0 && history.value.length === 0 && strokes.value.length === 0) {
      if (currentStroke.value.length > 0) {
        currentStroke.value = []
        isDrawing.value = false
      }
      return
    }

    if (currentStroke.value.length > 0) {
      currentStroke.value = []
      isDrawing.value = false
      return
    }

    if (history.value.length > 0) {
      const actions = history.value.pop()!
      const redoActions: HistoryAction[] = []

      for (let i = actions.length - 1; i >= 0; i--) {
        const action = actions[i]
        if (action.type === 'add') {
          const stroke = action.data as Stroke
          const idx = strokes.value.findIndex(
            (s) => s.length === stroke.points.length && distance(s[0], stroke.points[0]) < 1
          )
          if (idx !== -1) {
            const removed = strokes.value.splice(idx, 1)[0]
            redoActions.push({
              type: 'add',
              data: { id: generateStrokeId(), points: removed, lineWidth: lineWidth.value, createdAt: Date.now() },
            })
          }
        } else if (action.type === 'remove') {
          const stroke = action.data as Stroke
          strokes.value.push([...stroke.points])
          redoActions.push({
            type: 'remove',
            data: { id: generateStrokeId(), points: stroke.points, lineWidth: lineWidth.value, createdAt: Date.now() },
          })
        } else if (action.type === 'clear') {
          const clearedStrokes = action.data as Stroke[]
          strokes.value = clearedStrokes.map((s) => [...s.points])
          redoActions.push({ type: 'clear', data: [] })
        }
      }

      future.value.push(redoActions.reverse())

      if (ignitionPoint.value) {
        if (!isPointOnAnyStroke(ignitionPoint.value, lineWidth.value)) {
          ignitionPoint.value = null
        }
      }
    }
  }

  function redoStroke() {
    if (future.value.length > 0) {
      const actions = future.value.pop()!
      const undoActions: HistoryAction[] = []

      for (const action of actions) {
        if (action.type === 'add') {
          const stroke = action.data as Stroke
          strokes.value.push([...stroke.points])
          undoActions.push({
            type: 'remove',
            data: { id: generateStrokeId(), points: stroke.points, lineWidth: lineWidth.value, createdAt: Date.now() },
          })
        } else if (action.type === 'remove') {
          const stroke = action.data as Stroke
          const idx = strokes.value.findIndex(
            (s) => s.length === stroke.points.length && distance(s[0], stroke.points[0]) < 1
          )
          if (idx !== -1) {
            const removed = strokes.value.splice(idx, 1)[0]
            undoActions.push({
              type: 'add',
              data: { id: generateStrokeId(), points: removed, lineWidth: lineWidth.value, createdAt: Date.now() },
            })
          }
        } else if (action.type === 'clear') {
          const cleared = strokes.value.map((s) => ({
            id: generateStrokeId(),
            points: [...s],
            lineWidth: lineWidth.value,
            createdAt: Date.now(),
          }))
          strokes.value = []
          undoActions.push({ type: 'clear', data: cleared })
        }
      }

      history.value.push(undoActions)

      if (ignitionPoint.value) {
        if (!isPointOnAnyStroke(ignitionPoint.value, lineWidth.value)) {
          ignitionPoint.value = null
        }
      }
    }
  }

  function clearAll() {
    if (strokes.value.length === 0 && currentStroke.value.length === 0) return

    const clearedStrokes: Stroke[] = strokes.value.map((s) => ({
      id: generateStrokeId(),
      points: [...s],
      lineWidth: lineWidth.value,
      createdAt: Date.now(),
    }))

    saveToHistory([{ type: 'clear', data: clearedStrokes }])

    strokes.value = []
    currentStroke.value = []
    ignitionPoint.value = null
    isDrawing.value = false
    burnAnimation.value = {
      isPlaying: false,
      currentTime: 0,
      duration: 10,
      burntPoints: [],
      currentBurnPoint: null,
    }
  }

  function eraseAtPoint(point: PathPoint) {
    const eraseRadius = eraserSize.value
    const newStrokes: PathPoint[][] = []
    const erasedStrokes: Stroke[] = []
    const addedStrokes: Stroke[] = []

    for (const stroke of strokes.value) {
      let lastSplitIndex = 0
      let strokeErased = false

      for (let i = 0; i < stroke.length; i++) {
        const dist = distance(stroke[i], point)

        if (dist <= eraseRadius) {
          strokeErased = true
          if (i - lastSplitIndex >= 2) {
            const segment = stroke.slice(lastSplitIndex, i)
            newStrokes.push(segment)
            addedStrokes.push({
              id: generateStrokeId(),
              points: segment,
              lineWidth: lineWidth.value,
              createdAt: Date.now(),
            })
          }
          lastSplitIndex = i + 1
        }
      }

      if (lastSplitIndex < stroke.length && stroke.length - lastSplitIndex >= 2) {
        const segment = stroke.slice(lastSplitIndex)
        newStrokes.push(segment)
        if (strokeErased) {
          addedStrokes.push({
            id: generateStrokeId(),
            points: segment,
            lineWidth: lineWidth.value,
            createdAt: Date.now(),
          })
        }
      }

      if (strokeErased) {
        erasedStrokes.push({
          id: generateStrokeId(),
          points: [...stroke],
          lineWidth: lineWidth.value,
          createdAt: Date.now(),
        })
      } else {
        newStrokes.push(stroke)
      }
    }

    if (erasedStrokes.length > 0) {
      const historyActions: HistoryAction[] = erasedStrokes.map((s) => ({
        type: 'remove' as const,
        data: s,
      }))
      historyActions.push(
        ...addedStrokes.map((s) => ({
          type: 'add' as const,
          data: s,
        }))
      )
      saveToHistory(historyActions)
    }

    strokes.value = newStrokes

    if (ignitionPoint.value) {
      if (!isPointOnAnyStroke(ignitionPoint.value, lineWidth.value)) {
        ignitionPoint.value = null
      }
    }
  }

  function repairBreakPoint(breakPointIndex: number) {
    const breakPoint = analysis.value.breakPoints[breakPointIndex]
    if (!breakPoint) return

    const validStrokes = strokes.value.filter((s) => s.length >= 2)
    if (validStrokes.length < 2) return

    let stroke1Idx = -1
    let stroke2Idx = -1

    for (let i = 0; i < strokes.value.length; i++) {
      const stroke = strokes.value[i]
      if (stroke.length < 2) continue

      if (distance(stroke[0], breakPoint.startPoint) < 5 || distance(stroke[stroke.length - 1], breakPoint.startPoint) < 5) {
        stroke1Idx = i
      }
      if (distance(stroke[0], breakPoint.endPoint) < 5 || distance(stroke[stroke.length - 1], breakPoint.endPoint) < 5) {
        stroke2Idx = i
      }
    }

    if (stroke1Idx === -1 || stroke2Idx === -1 || stroke1Idx === stroke2Idx) return

    const stroke1 = strokes.value[stroke1Idx]
    const stroke2 = strokes.value[stroke2Idx]
    const merged = mergeStrokes(stroke1, stroke2, breakPoint.suggestedPath)

    const historyActions: HistoryAction[] = [
      { type: 'remove', data: { id: generateStrokeId(), points: [...stroke1], lineWidth: lineWidth.value, createdAt: Date.now() } },
      { type: 'remove', data: { id: generateStrokeId(), points: [...stroke2], lineWidth: lineWidth.value, createdAt: Date.now() } },
      { type: 'add', data: { id: generateStrokeId(), points: merged, lineWidth: lineWidth.value, createdAt: Date.now() } },
    ]

    saveToHistory(historyActions)

    const minIdx = Math.min(stroke1Idx, stroke2Idx)
    const maxIdx = Math.max(stroke1Idx, stroke2Idx)
    strokes.value.splice(maxIdx, 1)
    strokes.value.splice(minIdx, 1)
    strokes.value.push(merged)
  }

  function repairAllBreakPoints() {
    while (analysis.value.breakPoints.length > 0) {
      repairBreakPoint(0)
    }
  }

  function updateBurnAnimation(deltaTime: number) {
    if (!burnAnimation.value.isPlaying || !ignitionPoint.value) return

    const validStrokes = strokes.value.filter((s) => s.length >= 2)
    if (validStrokes.length === 0) return

    const points = validStrokes[0]
    const progress = burnAnimation.value.currentTime / burnAnimation.value.duration

    if (progress >= 1) {
      burnAnimation.value.isPlaying = false
      burnAnimation.value.currentBurnPoint = points[points.length - 1]
      return
    }

    const result = getPointAtProgress(points, progress)
    if (result) {
      burnAnimation.value.currentBurnPoint = result.point

      const burntCount = Math.floor(result.index + 1)
      burnAnimation.value.burntPoints = points.slice(0, burntCount)
    }

    burnAnimation.value.currentTime += deltaTime
  }

  function startBurnAnimation() {
    if (!ignitionPoint.value || strokes.value.length === 0) return
    burnAnimation.value.isPlaying = true
    burnAnimation.value.currentTime = 0
    burnAnimation.value.burntPoints = []
    burnAnimation.value.currentBurnPoint = ignitionPoint.value
    burnAnimation.value.duration = Math.max(5, analysis.value.estimatedBurnTime / 10)
  }

  function pauseBurnAnimation() {
    burnAnimation.value.isPlaying = false
  }

  function resetBurnAnimation() {
    burnAnimation.value.isPlaying = false
    burnAnimation.value.currentTime = 0
    burnAnimation.value.burntPoints = []
    burnAnimation.value.currentBurnPoint = null
  }

  function setBurnProgress(progress: number) {
    const validStrokes = strokes.value.filter((s) => s.length >= 2)
    if (validStrokes.length === 0) return

    const points = validStrokes[0]
    const result = getPointAtProgress(points, Math.max(0, Math.min(1, progress)))
    if (result) {
      burnAnimation.value.currentBurnPoint = result.point
      const burntCount = Math.floor(result.index + 1)
      burnAnimation.value.burntPoints = points.slice(0, burntCount)
      burnAnimation.value.currentTime = progress * burnAnimation.value.duration
    }
  }

  function generateThumbnail(): string {
    const canvas = document.createElement('canvas')
    canvas.width = THUMBNAIL_WIDTH
    canvas.height = THUMBNAIL_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    const scaleX = THUMBNAIL_WIDTH / 600
    const scaleY = THUMBNAIL_HEIGHT / 600
    const scale = Math.min(scaleX, scaleY)

    ctx.fillStyle = '#F5F0E6'
    ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)

    ctx.save()
    ctx.scale(scale, scale)
    ctx.translate((THUMBNAIL_WIDTH / scale - 600) / 2, (THUMBNAIL_HEIGHT / scale - 600) / 2)

    for (const stroke of strokes.value) {
      if (stroke.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y)
      }
      ctx.strokeStyle = '#4A4A4A'
      ctx.lineWidth = lineWidth.value
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }

    if (ignitionPoint.value) {
      ctx.beginPath()
      ctx.arc(ignitionPoint.value.x, ignitionPoint.value.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#FF5733'
      ctx.fill()
    }

    ctx.restore()

    return canvas.toDataURL('image/png')
  }

  function createVersion(description?: string): SchemeVersion {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      version: 1,
      path: JSON.parse(JSON.stringify(currentPath.value)),
      analysis: JSON.parse(JSON.stringify(analysis.value)),
      thumbnail: generateThumbnail(),
      createdAt: Date.now(),
      description,
    }
  }

  function setLineWidth(width: number) {
    lineWidth.value = Math.max(MIN_LINE_WIDTH, Math.min(MAX_LINE_WIDTH, width))
  }

  function setDensity(d: number) {
    density.value = Math.max(MIN_DENSITY, Math.min(MAX_DENSITY, d))
  }

  function setEraserSize(size: number) {
    eraserSize.value = Math.max(MIN_ERASER_SIZE, Math.min(MAX_ERASER_SIZE, size))
  }

  function setIgnitionPoint(point: PathPoint | null) {
    ignitionPoint.value = point
  }

  function setTool(tool: ToolType) {
    currentTool.value = tool
    continueStrokeIndex.value = null
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
    history.value = []
    future.value = []
    resetBurnAnimation()
  }

  function loadVersion(version: SchemeVersion) {
    if (version.path.points && version.path.points.length > 0) {
      strokes.value = [[...version.path.points]]
    } else {
      strokes.value = []
    }
    currentStroke.value = []
    lineWidth.value = version.path.lineWidth
    density.value = version.path.density
    ignitionPoint.value = version.path.ignitionPoint ? { ...version.path.ignitionPoint } : null
    history.value = []
    future.value = []
    resetBurnAnimation()
  }

  function reset() {
    strokes.value = []
    currentStroke.value = []
    lineWidth.value = DEFAULT_LINE_WIDTH
    density.value = DEFAULT_DENSITY
    eraserSize.value = DEFAULT_ERASER_SIZE
    ignitionPoint.value = null
    currentTool.value = 'brush'
    isDrawing.value = false
    continueStrokeIndex.value = null
    history.value = []
    future.value = []
    resetBurnAnimation()
  }

  return {
    strokes,
    currentStroke,
    allPoints,
    strokeCount,
    lineWidth,
    density,
    eraserSize,
    ignitionPoint,
    currentTool,
    isDrawing,
    continueStrokeIndex,
    canUndo,
    canRedo,
    analysis,
    currentPath,
    burnAnimation,
    beginStroke,
    continueStroke,
    endStroke,
    undoStroke,
    redoStroke,
    clearAll,
    eraseAtPoint,
    repairBreakPoint,
    repairAllBreakPoints,
    updateBurnAnimation,
    startBurnAnimation,
    pauseBurnAnimation,
    resetBurnAnimation,
    setBurnProgress,
    generateThumbnail,
    createVersion,
    setLineWidth,
    setDensity,
    setEraserSize,
    setIgnitionPoint,
    setTool,
    setDrawing,
    loadScheme,
    loadVersion,
    reset,
  }
})
