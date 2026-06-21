<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useDesignStore } from '@/stores/designStore'
import type { PathPoint } from '@/types/incense'
import { findClosestPointOnPath, distance } from '@/utils/geometry'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/utils/constants'

const store = useDesignStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

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

  if (store.currentTool === 'brush') {
    store.continueStroke(point)
  } else if (store.currentTool === 'eraser') {
    store.eraseAtPoint(point)
  }
}

function endDrawing() {
  if (store.isDrawing) {
    if (store.currentTool === 'brush') {
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

  for (const stroke of store.strokes) {
    if (stroke.length > 0) {
      drawIncensePath(ctx, stroke, store.lineWidth)
    }
  }

  if (store.currentStroke.length > 0) {
    drawIncensePath(ctx, store.currentStroke, store.lineWidth)
  }

  if (store.analysis.breakRiskPoints.length > 0) {
    drawRiskPoints(ctx, store.analysis.breakRiskPoints)
  }

  if (store.ignitionPoint) {
    drawIgnitionPoint(ctx, store.ignitionPoint)
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

let animationFrameId: number

function animate() {
  renderCanvas()
  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    animate()
  }
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

watch(
  () => [store.strokes, store.currentStroke, store.lineWidth, store.ignitionPoint, store.analysis.breakRiskPoints],
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
      class="rounded-xl shadow-lg border-2 border-stone-200"
      :class="{
        'cursor-crosshair': store.currentTool === 'brush',
        'cursor-pointer': store.currentTool === 'ignition',
        'cursor-cell': store.currentTool === 'eraser',
      }"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="endDrawing"
      @mouseleave="endDrawing"
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
  </div>
</template>
