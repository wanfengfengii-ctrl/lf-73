import type { PathPoint, OverlapInfo, BreakPointInfo } from '@/types/incense'
import { BREAKPOINT_CONNECT_THRESHOLD, OVERLAP_THRESHOLD } from '@/utils/constants'

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

export function findMultiStrokeIntersections(strokes: PathPoint[][]): PathPoint[] {
  const intersections: PathPoint[] = []
  
  for (let i = 0; i < strokes.length; i++) {
    for (let j = i + 1; j < strokes.length; j++) {
      const stroke1 = strokes[i]
      const stroke2 = strokes[j]
      
      for (let k = 0; k < stroke1.length - 1; k++) {
        for (let l = 0; l < stroke2.length - 1; l++) {
          if (segmentsIntersect(stroke1[k], stroke1[k + 1], stroke2[l], stroke2[l + 1])) {
            const p1 = stroke1[k]
            const p2 = stroke1[k + 1]
            const p3 = stroke2[l]
            const p4 = stroke2[l + 1]
            
            const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y)
            if (Math.abs(denom) < 0.001) continue
            
            const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom
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
): { point: PathPoint; index: number; distance: number; param: number } | null {
  if (points.length < 2) return null

  let minDist = Infinity
  let closestPoint: PathPoint = { x: 0, y: 0 }
  let closestIndex = 0
  let closestParam = 0

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
      closestParam = param
    }
  }

  return { point: closestPoint, index: closestIndex, distance: minDist, param: closestParam }
}

export function findClosestEndpoint(
  point: PathPoint,
  strokes: PathPoint[][]
): { point: PathPoint; strokeIndex: number; isStart: boolean; distance: number } | null {
  let closest: { point: PathPoint; strokeIndex: number; isStart: boolean; distance: number } | null = null

  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i]
    if (stroke.length < 2) continue

    const startDist = distance(point, stroke[0])
    const endDist = distance(point, stroke[stroke.length - 1])

    if (!closest || startDist < closest.distance) {
      closest = { point: stroke[0], strokeIndex: i, isStart: true, distance: startDist }
    }
    if (!closest || endDist < closest.distance) {
      closest = { point: stroke[stroke.length - 1], strokeIndex: i, isStart: false, distance: endDist }
    }
  }

  return closest
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

export function findOverlaps(
  stroke1: PathPoint[],
  stroke2: PathPoint[],
  threshold: number = OVERLAP_THRESHOLD
): OverlapInfo[] {
  const overlaps: OverlapInfo[] = []
  
  for (let i = 0; i < stroke1.length - 1; i++) {
    for (let j = 0; j < stroke2.length - 1; j++) {
      const seg1Start = stroke1[i]
      const seg1End = stroke1[i + 1]
      const seg2Start = stroke2[j]
      const seg2End = stroke2[j + 1]
      
      const dist1 = pointToSegmentDistance(seg1Start, seg2Start, seg2End)
      const dist2 = pointToSegmentDistance(seg1End, seg2Start, seg2End)
      const dist3 = pointToSegmentDistance(seg2Start, seg1Start, seg1End)
      const dist4 = pointToSegmentDistance(seg2End, seg1Start, seg1End)
      
      const avgDist = (dist1 + dist2 + dist3 + dist4) / 4
      
      if (avgDist <= threshold) {
        const overlapLength = Math.min(
          distance(seg1Start, seg1End),
          distance(seg2Start, seg2End)
        )
        
        const centerPoint: PathPoint = {
          x: (seg1Start.x + seg1End.x + seg2Start.x + seg2End.x) / 4,
          y: (seg1Start.y + seg1End.y + seg2Start.y + seg2End.y) / 4,
        }
        
        let isDuplicate = false
        for (const existing of overlaps) {
          if (distance(existing.centerPoint, centerPoint) < 10) {
            isDuplicate = true
            break
          }
        }
        
        if (!isDuplicate) {
          overlaps.push({
            segment1: { start: seg1Start, end: seg1End },
            segment2: { start: seg2Start, end: seg2End },
            overlapLength,
            centerPoint,
          })
        }
      }
    }
  }
  
  return overlaps
}

export function findAllOverlaps(strokes: PathPoint[][]): OverlapInfo[] {
  const allOverlaps: OverlapInfo[] = []
  
  for (let i = 0; i < strokes.length; i++) {
    for (let j = i + 1; j < strokes.length; j++) {
      const overlaps = findOverlaps(strokes[i], strokes[j])
      allOverlaps.push(...overlaps)
    }
  }
  
  return allOverlaps
}

export function generateSmoothConnection(
  start: PathPoint,
  end: PathPoint,
  segments: number = 10
): PathPoint[] {
  const points: PathPoint[] = []
  const dx = end.x - start.x
  const dy = end.y - start.y
  
  const midX = (start.x + end.x) / 2 + (Math.random() - 0.5) * 10
  const midY = (start.y + end.y) / 2 + (Math.random() - 0.5) * 10
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const t2 = t * t
    const mt = 1 - t
    const mt2 = mt * mt
    
    const x = mt2 * start.x + 2 * mt * t * midX + t2 * end.x
    const y = mt2 * start.y + 2 * mt * t * midY + t2 * end.y
    
    points.push({ x, y, timestamp: Date.now() + i })
  }
  
  return points
}

export function findBreakPoints(
  strokes: PathPoint[][],
  threshold: number = BREAKPOINT_CONNECT_THRESHOLD
): BreakPointInfo[] {
  const breakPoints: BreakPointInfo[] = []
  const endpoints: { point: PathPoint; strokeIndex: number; isStart: boolean }[] = []
  
  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i]
    if (stroke.length < 2) continue
    
    endpoints.push({ point: stroke[0], strokeIndex: i, isStart: true })
    endpoints.push({ point: stroke[stroke.length - 1], strokeIndex: i, isStart: false })
  }
  
  const connected = new Set<string>()
  
  for (let i = 0; i < endpoints.length; i++) {
    for (let j = i + 1; j < endpoints.length; j++) {
      const ep1 = endpoints[i]
      const ep2 = endpoints[j]
      
      if (ep1.strokeIndex === ep2.strokeIndex) continue
      
      const dist = distance(ep1.point, ep2.point)
      
      if (dist <= threshold) {
        const key1 = `${ep1.strokeIndex}-${ep1.isStart ? 'start' : 'end'}`
        const key2 = `${ep2.strokeIndex}-${ep2.isStart ? 'start' : 'end'}`
        
        if (!connected.has(key1) || !connected.has(key2)) {
          connected.add(key1)
          connected.add(key2)
        }
      }
    }
  }
  
  const unconnectedEndpoints = endpoints.filter(ep => {
    const key = `${ep.strokeIndex}-${ep.isStart ? 'start' : 'end'}`
    return !connected.has(key)
  })
  
  for (let i = 0; i < unconnectedEndpoints.length; i++) {
    for (let j = i + 1; j < unconnectedEndpoints.length; j++) {
      const ep1 = unconnectedEndpoints[i]
      const ep2 = unconnectedEndpoints[j]
      
      const dist = distance(ep1.point, ep2.point)
      
      if (dist > threshold && dist < threshold * 3) {
        const suggestedPath = generateSmoothConnection(ep1.point, ep2.point)
        
        breakPoints.push({
          index: breakPoints.length,
          startPoint: ep1.point,
          endPoint: ep2.point,
          distance: dist,
          suggestedPath,
        })
      }
    }
  }
  
  return breakPoints
}

export function getStrokeEndpoints(stroke: PathPoint[]): { start: PathPoint; end: PathPoint } {
  return {
    start: stroke[0],
    end: stroke[stroke.length - 1],
  }
}

export function mergeStrokes(
  stroke1: PathPoint[],
  stroke2: PathPoint[],
  connectPath?: PathPoint[]
): PathPoint[] {
  const ep1 = getStrokeEndpoints(stroke1)
  const ep2 = getStrokeEndpoints(stroke2)
  
  const d1 = distance(ep1.end, ep2.start)
  const d2 = distance(ep1.end, ep2.end)
  const d3 = distance(ep1.start, ep2.start)
  const d4 = distance(ep1.start, ep2.end)
  
  const minDist = Math.min(d1, d2, d3, d4)
  
  let result: PathPoint[] = []
  
  if (minDist === d1) {
    result = connectPath ? [...stroke1, ...connectPath, ...stroke2] : [...stroke1, ...stroke2]
  } else if (minDist === d2) {
    result = connectPath ? [...stroke1, ...connectPath, ...[...stroke2].reverse()] : [...stroke1, ...[...stroke2].reverse()]
  } else if (minDist === d3) {
    result = connectPath ? [...[...stroke1].reverse(), ...connectPath, ...stroke2] : [...[...stroke1].reverse(), ...stroke2]
  } else {
    result = connectPath ? [...[...stroke1].reverse(), ...connectPath, ...[...stroke2].reverse()] : [...[...stroke1].reverse(), ...[...stroke2].reverse()]
  }
  
  return simplifyPath(result, 1)
}

export function generateBurnSequence(
  points: PathPoint[],
  ignitionPoint: PathPoint
): PathPoint[] {
  if (points.length < 2) return []
  
  const closest = findClosestPointOnPath(ignitionPoint, points)
  if (!closest) return []
  
  const beforeIgnition = points.slice(0, closest.index + 1)
  const afterIgnition = points.slice(closest.index)
  
  beforeIgnition.push(closest.point)
  afterIgnition.unshift(closest.point)
  
  const sequence1 = [...beforeIgnition].reverse()
  const sequence2 = afterIgnition
  
  const merged: PathPoint[] = []
  const maxLen = Math.max(sequence1.length, sequence2.length)
  
  for (let i = 0; i < maxLen; i++) {
    if (i < sequence1.length) {
      merged.push(sequence1[i])
    }
    if (i < sequence2.length && i > 0) {
      merged.push(sequence2[i])
    }
  }
  
  return merged
}

export function getPointAtProgress(
  points: PathPoint[],
  progress: number
): { point: PathPoint; index: number } | null {
  if (points.length < 2) return null
  
  const totalLength = calculatePathLength(points)
  const targetLength = totalLength * progress
  
  let accumulatedLength = 0
  
  for (let i = 0; i < points.length - 1; i++) {
    const segLength = distance(points[i], points[i + 1])
    
    if (accumulatedLength + segLength >= targetLength) {
      const remainingLength = targetLength - accumulatedLength
      const ratio = segLength > 0 ? remainingLength / segLength : 0
      
      return {
        point: {
          x: points[i].x + ratio * (points[i + 1].x - points[i].x),
          y: points[i].y + ratio * (points[i + 1].y - points[i].y),
        },
        index: i,
      }
    }
    
    accumulatedLength += segLength
  }
  
  return { point: points[points.length - 1], index: points.length - 2 }
}
