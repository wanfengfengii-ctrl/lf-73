import type { PathPoint } from '@/types/incense'

export function distance(p1: PathPoint, p2: PathPoint): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function calculatePathLength(points: PathPoint[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += distance(points[i - 1], points[i])
  }
  return total
}

function cross(o: PathPoint, a: PathPoint, b: PathPoint): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function segmentsIntersect(
  p1: PathPoint,
  p2: PathPoint,
  p3: PathPoint,
  p4: PathPoint
): boolean {
  const d1 = cross(p3, p4, p1)
  const d2 = cross(p3, p4, p2)
  const d3 = cross(p1, p2, p3)
  const d4 = cross(p1, p2, p4)

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true
  }

  return false
}

export function findIntersections(points: PathPoint[]): PathPoint[] {
  const intersections: PathPoint[] = []
  const threshold = 0.001

  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 2; j < points.length - 1; j++) {
      if (i === 0 && j === points.length - 2) continue
      
      if (segmentsIntersect(points[i], points[i + 1], points[j], points[j + 1])) {
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[j]
        const p4 = points[j + 1]

        const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y)
        if (Math.abs(denom) < threshold) continue

        const ua =
          ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom

        const ix = p1.x + ua * (p2.x - p1.x)
        const iy = p1.y + ua * (p2.y - p1.y)

        let isDuplicate = false
        for (const existing of intersections) {
          if (distance(existing, { x: ix, y: iy }) < 5) {
            isDuplicate = true
            break
          }
        }

        if (!isDuplicate) {
          intersections.push({ x: ix, y: iy })
        }
      }
    }
  }

  return intersections
}

export function pointToSegmentDistance(
  point: PathPoint,
  segStart: PathPoint,
  segEnd: PathPoint
): number {
  const A = point.x - segStart.x
  const B = point.y - segStart.y
  const C = segEnd.x - segStart.x
  const D = segEnd.y - segStart.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) param = dot / lenSq

  let xx: number
  let yy: number

  if (param < 0) {
    xx = segStart.x
    yy = segStart.y
  } else if (param > 1) {
    xx = segEnd.x
    yy = segEnd.y
  } else {
    xx = segStart.x + param * C
    yy = segStart.y + param * D
  }

  const dx = point.x - xx
  const dy = point.y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

export function isPointOnPath(
  point: PathPoint,
  points: PathPoint[],
  tolerance: number
): boolean {
  if (points.length < 2) return false

  for (let i = 0; i < points.length - 1; i++) {
    const dist = pointToSegmentDistance(point, points[i], points[i + 1])
    if (dist <= tolerance) {
      return true
    }
  }
  return false
}

export function findClosestPointOnPath(
  point: PathPoint,
  points: PathPoint[]
): { point: PathPoint; index: number; distance: number } | null {
  if (points.length < 2) return null

  let minDist = Infinity
  let closestPoint: PathPoint = { x: 0, y: 0 }
  let closestIndex = 0

  for (let i = 0; i < points.length - 1; i++) {
    const segStart = points[i]
    const segEnd = points[i + 1]

    const C = segEnd.x - segStart.x
    const D = segEnd.y - segStart.y
    const lenSq = C * C + D * D

    if (lenSq === 0) continue

    const dot = (point.x - segStart.x) * C + (point.y - segStart.y) * D
    let param = dot / lenSq
    param = Math.max(0, Math.min(1, param))

    const xx = segStart.x + param * C
    const yy = segStart.y + param * D
    const dist = Math.sqrt((point.x - xx) ** 2 + (point.y - yy) ** 2)

    if (dist < minDist) {
      minDist = dist
      closestPoint = { x: xx, y: yy }
      closestIndex = i
    }
  }

  return { point: closestPoint, index: closestIndex, distance: minDist }
}

export function calculateCurvature(
  p1: PathPoint,
  p2: PathPoint,
  p3: PathPoint
): number {
  const a = distance(p1, p2)
  const b = distance(p2, p3)
  const c = distance(p1, p3)

  if (a === 0 || b === 0 || c === 0) return 0

  const s = (a + b + c) / 2
  const area = Math.sqrt(Math.abs(s * (s - a) * (s - b) * (s - c)))

  if (area === 0) return 0

  return (4 * area) / (a * b * c)
}

export function findHighCurvaturePoints(
  points: PathPoint[],
  threshold: number = 0.1
): PathPoint[] {
  const result: PathPoint[] = []
  if (points.length < 3) return result

  for (let i = 1; i < points.length - 1; i++) {
    const curvature = calculateCurvature(points[i - 1], points[i], points[i + 1])
    if (curvature > threshold) {
      result.push(points[i])
    }
  }

  return result
}

export function simplifyPath(points: PathPoint[], tolerance: number = 2): PathPoint[] {
  if (points.length <= 2) return [...points]

  const result: PathPoint[] = [points[0]]
  let lastPoint = points[0]

  for (let i = 1; i < points.length - 1; i++) {
    if (distance(lastPoint, points[i]) >= tolerance) {
      result.push(points[i])
      lastPoint = points[i]
    }
  }

  result.push(points[points.length - 1])
  return result
}
