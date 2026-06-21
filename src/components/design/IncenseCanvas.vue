<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useDesignStore } from '@/stores/designStore'
import type { PathPoint } from '@/types/incense'
import { findClosestPointOnPath, distance, findClosestEndpoint } from '@/utils/geometry'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/utils/constants'

const store = useDesignStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

const mousePosition = ref<PathPoint | null>(null)
let lastTime = 0

const closestEndpoint = computed(() => {
  if (!mousePosition.value || store.currentTool !== 'continue' || store.strokes.length === 0) {
    return null
  }
  const closest = findClosestEndpoint(mousePosition.value, store.strokes)
  if (closest && closest.distance < store.lineWidth * 3) {
    return closest
  }
  return null
})

function getCanvasPoint(event: MouseEvent | TouchEvent): PathPoint | null {
  if (!canvasRef.value) return null
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height

  let clientX: number
  let clientY: number

  if ('touches' in event) {
    if (event.touches.length === 0) return null
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else {
    clientX = event.clientX
    clientY = event.clientY
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
    timestamp: Date.now(),
  }
}

function handleMouseMove(event: MouseEvent) {
  const point = getCanvasPoint(event)
  if (point) {
    mousePosition.value = point
  }
}

function handleMouseLeave(_event?: MouseEvent) {
  mousePosition.value = null
}

function findClosestOnAnyStroke(point: PathPoint): { point: PathPoint; distance: number } | null {
  let closest: { point: PathPoint; distance: number } | null = null

  for (const stroke of store.strokes) {
    if (stroke.length < 2) continue
    const result = findClosestPointOnPath(point, stroke)
    if (result && (!closest || result.distance < closest.distance)) {
      closest = { point: result.point, distance: result.distance }
    }
  }

  if (store.currentStroke.length >= 2) {
    const result = findClosestPointOnPath(point, store.currentStroke)
    if (result && (!closest || result.distance < closest.distance)) {
      closest = { point: result.point, distance: result.distance }
    }
  }

  return closest
}

function startDrawing(event: MouseEvent | TouchEvent) {
  event.preventDefault()
  const point = getCanvasPoint(event)
  if (!point) return

  if (store.currentTool === 'brush') {
    store.beginStroke(point)
  } else if (store.currentTool === 'continue') {
    store.beginStroke(point)
  } else if (store.currentTool === 'ignition') {
    const closest = findClosestOnAnyStroke(point)
    if (closest && closest.distance <= store.lineWidth * 2) {
      store.setIgnitionPoint(closest.point)
    } else {
      store.setIgnitionPoint(null)
    }
  } else if (store.currentTool === 'eraser') {
    store.setDrawing(true)
    store.eraseAtPoint(point)
  }
}

function draw(event: MouseEvent | TouchEvent) {
  event.preventDefault()
  const point = getCanvasPoint(event)
  if (!point) return

  if (!store.isDrawing) return

  if (store.currentTool === 'brush' || store.currentTool === 'continue') {
    store.continueStroke(point)
  } else if (store.currentTool === 'eraser') {
    store.eraseAtPoint(point)
  }
}

function endDrawing() {
  if (store.isDrawing) {
    if (store.currentTool === 'brush' || store.currentTool === 'continue') {
      store.endStroke()
    } else {
      store.setDrawing(false)
    }
  }
}

function renderCanvas() {
  if (!ctx || !canvasRef.value) return

  const width = canvasRef.value.width
  const height = canvasRef.value.height

  ctx.clearRect(0, 0, width, height)
  drawPaperBackground(ctx, width, height)

  if (store.burnAnimation.burntPoints.length > 0 || store.burnAnimation.currentBurnPoint) {
    drawUnburntPath(ctx, store.strokes, store.currentStroke, store.lineWidth)
    drawBurntPath(ctx, store.burnAnimation.burntPoints, store.lineWidth)
  } else {
    for (const stroke of store.strokes) {
      if (stroke.length > 0) {
        drawIncensePath(ctx, stroke, store.lineWidth)
      }
    }

    if (store.currentStroke.length > 0) {
      drawIncensePath(ctx, store.currentStroke, store.lineWidth)
    }
  }

  if (store.analysis.breakPoints.length > 0) {
    drawBreakPoints(ctx, store.analysis.breakPoints)
  }

  if (store.analysis.overlaps.length > 0) {
    drawOverlaps(ctx, store.analysis.overlaps)
  }

  if (store.analysis.breakRiskPoints.length > 0) {
    drawRiskPoints(ctx, store.analysis.breakRiskPoints)
  }

  if (store.ignitionPoint && !store.burnAnimation.isPlaying) {
    drawIgnitionPoint(ctx, store.ignitionPoint)
  }

  if (store.burnAnimation.currentBurnPoint) {
    drawBurnFront(ctx, store.burnAnimation.currentBurnPoint)
  }

  if (store.currentTool === 'eraser' && mousePosition.value) {
    drawEraserCursor(ctx, mousePosition.value, store.eraserSize)
  }

  if (store.currentTool === 'continue' && closestEndpoint.value) {
    drawContinueHint(ctx, closestEndpoint.value.point, mousePosition.value!)
  }
}

function drawPaperBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#F5F0E6'
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(139, 119, 101, 0.1)'
  ctx.lineWidth = 1
  const gridSize = 40

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

function drawIncensePath(
  ctx: CanvasRenderingContext2D,
  points: PathPoint[],
  lineWidth: number
) {
  if (points.length < 2) {
    if (points.length === 1) {
      ctx.beginPath()
      ctx.arc(points[0].x, points[0].y, lineWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = '#4A4A4A'
      ctx.fill()
    }
    return
  }

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.strokeStyle = '#4A4A4A'
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  ctx.restore()

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = lineWidth * 0.4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

function drawUnburntPath(
  ctx: CanvasRenderingContext2D,
  strokes: PathPoint[][],
  currentStroke: PathPoint[],
  lineWidth: number
) {
  ctx.save()
  ctx.globalAlpha = 0.3

  for (const stroke of strokes) {
    if (stroke.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(stroke[0].x, stroke[0].y)
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x, stroke[i].y)
    }
    ctx.strokeStyle = '#8B7355'
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  if (currentStroke.length >= 2) {
    ctx.beginPath()
    ctx.moveTo(currentStroke[0].x, currentStroke[0].y)
    for (let i = 1; i < currentStroke.length; i++) {
      ctx.lineTo(currentStroke[i].x, currentStroke[i].y)
    }
    ctx.stroke()
  }

  ctx.restore()
}

function drawBurntPath(
  ctx: CanvasRenderingContext2D,
  points: PathPoint[],
  lineWidth: number
) {
  if (points.length < 2) return

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }

  const gradient = ctx.createLinearGradient(
    points[0].x,
    points[0].y,
    points[points.length - 1].x,
    points[points.length - 1].y
  )
  gradient.addColorStop(0, '#2D2D2D')
  gradient.addColorStop(0.7, '#4A4A4A')
  gradient.addColorStop(1, '#6B6B6B')

  ctx.strokeStyle = gradient
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  ctx.restore()

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.strokeStyle = 'rgba(255, 200, 100, 0.1)'
  ctx.lineWidth = lineWidth * 0.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

function drawBurnFront(ctx: CanvasRenderingContext2D, point: PathPoint) {
  const time = Date.now() / 100
  const pulse = Math.sin(time) * 0.3 + 0.7

  const outerGlow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 30)
  outerGlow.addColorStop(0, `rgba(255, 107, 53, ${pulse * 0.8})`)
  outerGlow.addColorStop(0.3, 'rgba(255, 87, 51, 0.4)')
  outerGlow.addColorStop(0.6, 'rgba(255, 165, 0, 0.2)')
  outerGlow.addColorStop(1, 'rgba(255, 165, 0, 0)')

  ctx.fillStyle = outerGlow
  ctx.beginPath()
  ctx.arc(point.x, point.y, 30, 0, Math.PI * 2)
  ctx.fill()

  const innerGlow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 12)
  innerGlow.addColorStop(0, '#FFFF00')
  innerGlow.addColorStop(0.3, '#FFA500')
  innerGlow.addColorStop(0.6, '#FF5733')
  innerGlow.addColorStop(1, 'rgba(255, 87, 51, 0)')

  ctx.fillStyle = innerGlow
  ctx.beginPath()
  ctx.arc(point.x, point.y, 12, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
  ctx.fill()
}

function drawIgnitionPoint(ctx: CanvasRenderingContext2D, point: PathPoint) {
  const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7

  const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 20)
  gradient.addColorStop(0, `rgba(255, 107, 53, ${pulse})`)
  gradient.addColorStop(0.5, 'rgba(255, 87, 51, 0.5)')
  gradient.addColorStop(1, 'rgba(255, 87, 51, 0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(point.x, point.y, 20, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FF5733'
  ctx.beginPath()
  ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
  ctx.fill()
}

function drawRiskPoints(ctx: CanvasRenderingContext2D, points: PathPoint[]) {
  ctx.fillStyle = 'rgba(198, 40, 40, 0.6)'
  ctx.strokeStyle = '#C62828'
  ctx.lineWidth = 1.5

  for (const point of points) {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}

function drawBreakPoints(
  ctx: CanvasRenderingContext2D,
  breakPoints: { startPoint: PathPoint; endPoint: PathPoint; suggestedPath: PathPoint[] }[]
) {
  for (const bp of breakPoints) {
    ctx.save()
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(255, 152, 0, 0.8)'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(bp.startPoint.x, bp.startPoint.y)
    for (const p of bp.suggestedPath) {
      ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = '#FF9800'
    ctx.strokeStyle = '#E65100'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(bp.startPoint.x, bp.startPoint.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(bp.endPoint.x, bp.endPoint.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('?', bp.startPoint.x, bp.startPoint.y)
    ctx.fillText('?', bp.endPoint.x, bp.endPoint.y)
  }
}

function drawOverlaps(
  ctx: CanvasRenderingContext2D,
  overlaps: { centerPoint: PathPoint }[]
) {
  for (const overlap of overlaps) {
    ctx.fillStyle = 'rgba(156, 39, 176, 0.5)'
    ctx.strokeStyle = '#7B1FA2'
    ctx.lineWidth = 1.5

    ctx.beginPath()
    ctx.arc(overlap.centerPoint.x, overlap.centerPoint.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 9px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('叠', overlap.centerPoint.x, overlap.centerPoint.y)
  }
}

function drawEraserCursor(ctx: CanvasRenderingContext2D, point: PathPoint, size: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
  ctx.fillStyle = 'rgba(239, 68, 68, 0.1)'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])

  ctx.beginPath()
  ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.restore()

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(point.x - size - 5, point.y)
  ctx.lineTo(point.x + size + 5, point.y)
  ctx.moveTo(point.x, point.y - size - 5)
  ctx.lineTo(point.x, point.y + size + 5)
  ctx.stroke()
}

function drawContinueHint(ctx: CanvasRenderingContext2D, endpoint: PathPoint, mousePos: PathPoint) {
  ctx.save()
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 4])

  ctx.beginPath()
  ctx.moveTo(endpoint.x, endpoint.y)
  ctx.lineTo(mousePos.x, mousePos.y)
  ctx.stroke()

  ctx.restore()

  ctx.fillStyle = 'rgba(34, 197, 94, 0.8)'
  ctx.beginPath()
  ctx.arc(endpoint.x, endpoint.y, 10, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('→', endpoint.x, endpoint.y)
}

let animationFrameId: number

function animate(currentTime: number) {
  const deltaTime = lastTime ? (currentTime - lastTime) / 1000 : 0
  lastTime = currentTime

  if (store.updateBurnAnimation) {
    store.updateBurnAnimation(deltaTime)
  }

  renderCanvas()
  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    animationFrameId = requestAnimationFrame(animate)
  }
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

watch(
  () => [
    store.strokes,
    store.currentStroke,
    store.lineWidth,
    store.ignitionPoint,
    store.analysis.breakRiskPoints,
    store.analysis.breakPoints,
    store.analysis.overlaps,
    store.burnAnimation,
  ],
  () => {
    renderCanvas()
  },
  { deep: true }
)
</script>

<template>
  <div class="relative">
    <canvas
      ref="canvasRef"
      :width="CANVAS_WIDTH"
      :height="CANVAS_HEIGHT"
      class="rounded-xl shadow-lg border-2 border-stone-200 transition-all"
      :class="{
        'cursor-crosshair': store.currentTool === 'brush',
        'cursor-pointer': store.currentTool === 'ignition',
        'cursor-none': store.currentTool === 'eraser',
        'cursor-copy': store.currentTool === 'continue',
      }"
      @mousedown="startDrawing"
      @mousemove="(e) => { draw(e); handleMouseMove(e); }"
      @mouseup="endDrawing"
      @mouseleave="(e) => { endDrawing(); handleMouseLeave(e); }"
      @touchstart="startDrawing"
      @touchmove="draw"
      @touchend="endDrawing"
    />
    <div
      v-if="store.strokes.length === 0 && store.currentStroke.length === 0"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="text-stone-400 text-center">
        <p class="text-lg font-medium">在画布上绘制香线路径</p>
        <p class="text-sm mt-1">按住鼠标左键拖动绘制</p>
      </div>
    </div>

    <div
      v-if="store.currentTool === 'continue' && store.strokes.length === 0"
      class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm"
    >
      请先绘制至少一条路径后再使用续画功能
    </div>

    <div
      v-if="closestEndpoint"
      class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
    >
      <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      点击开始续画
    </div>
  </div>
</template>
