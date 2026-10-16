import { FlowchartNode, FlowchartPort, LineType } from '../types/flowchart';

export interface Point {
  x: number;
  y: number;
}

export interface EdgeRoutingOptions {
  sourceNode?: FlowchartNode;
  targetNode?: FlowchartNode;
  allNodes?: FlowchartNode[];
  waypoints?: Point[];
  manualOffset?: number;
  routingMode?: 'smart' | 'manual' | 'direct';
}

/**
 * Resolves the optimal port dynamically based on relative positions of nodes
 */
export function resolveAutoPort(
  node: FlowchartNode,
  otherNode: FlowchartNode,
  role: 'source' | 'target' = 'source'
): 'top' | 'right' | 'bottom' | 'left' {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const ox = otherNode.x + otherNode.width / 2;
  const oy = otherNode.y + otherNode.height / 2;

  const dx = ox - cx;
  const dy = oy - cy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? (role === 'source' ? 'right' : 'left') : (role === 'source' ? 'left' : 'right');
  } else {
    return dy > 0 ? (role === 'source' ? 'bottom' : 'top') : (role === 'source' ? 'top' : 'bottom');
  }
}

export function getPortPosition(
  node: FlowchartNode,
  port: FlowchartPort,
  otherNode?: FlowchartNode,
  role: 'source' | 'target' = 'source'
): Point {
  const effectivePort =
    port === 'auto' && otherNode
      ? resolveAutoPort(node, otherNode, role)
      : port === 'auto'
      ? 'bottom'
      : port;

  const { x, y, width, height } = node;
  switch (effectivePort) {
    case 'top':
      return { x: x + width / 2, y };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    default:
      return { x: x + width / 2, y: y + height };
  }
}

/**
 * Smart Orthogonal & Obstacle-Free Connector Path Generator
 */
// Collision helper for a rectilinear line segment against an axis-aligned box
function doesSegmentIntersectBox(
  p1: Point,
  p2: Point,
  box: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
  const isHorizontal = Math.abs(p1.y - p2.y) < 1;
  const isVertical = Math.abs(p1.x - p2.x) < 1;

  if (isHorizontal) {
    const y = p1.y;
    if (y < box.minY || y > box.maxY) return false;
    const segMinX = Math.min(p1.x, p2.x);
    const segMaxX = Math.max(p1.x, p2.x);
    return Math.max(segMinX, box.minX) <= Math.min(segMaxX, box.maxX);
  }

  if (isVertical) {
    const x = p1.x;
    if (x < box.minX || x > box.maxX) return false;
    const segMinY = Math.min(p1.y, p2.y);
    const segMaxY = Math.max(p1.y, p2.y);
    return Math.max(segMinY, box.minY) <= Math.min(segMaxY, box.maxY);
  }

  // Generic diagonal line segment vs bounding box
  const segMinX = Math.min(p1.x, p2.x);
  const segMaxX = Math.max(p1.x, p2.x);
  const segMinY = Math.min(p1.y, p2.y);
  const segMaxY = Math.max(p1.y, p2.y);

  if (segMaxX < box.minX || segMinX > box.maxX || segMaxY < box.minY || segMinY > box.maxY) {
    return false;
  }
  return true;
}

// Find any obstacle node in allNodes intersecting a segment
function findCollidingObstacles(
  p1: Point,
  p2: Point,
  obstacles: Array<{ node: FlowchartNode; box: { minX: number; minY: number; maxX: number; maxY: number } }>
): FlowchartNode[] {
  const colliders: FlowchartNode[] = [];
  for (const obs of obstacles) {
    if (doesSegmentIntersectBox(p1, p2, obs.box)) {
      colliders.push(obs.node);
    }
  }
  return colliders;
}

/**
 * Smart Orthogonal & Obstacle-Free Connector Path Generator
 * Automatically finds collision-free routes around intermediate nodes (Obstacle Avoidance)
 * Supports manual waypoints, offset bypasses, and rounded corners.
 */
export function calculateEdgePath(
  start: Point,
  end: Point,
  sourcePort: FlowchartPort,
  targetPort: FlowchartPort,
  lineType: LineType,
  options?: EdgeRoutingOptions
): { path: string; labelPos: Point; points: Point[] } {
  // 1. STRAIGHT LINE
  if (lineType === 'straight') {
    const points: Point[] = options?.waypoints && options.waypoints.length > 0
      ? [start, ...options.waypoints, end]
      : [start, end];
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const midIdx = Math.floor(points.length / 2);
    const pA = points[midIdx - 1] || points[0];
    const pB = points[midIdx] || points[points.length - 1];
    const labelPos = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
    return { path, labelPos, points };
  }

  // 2. CURVED LINE
  if (lineType === 'curved') {
    if (options?.waypoints && options.waypoints.length > 0) {
      // Curve through user-defined waypoints
      const points = [start, ...options.waypoints, end];
      let path = `M ${start.x} ${start.y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        path += ` Q ${prev.x} ${prev.y} ${midX} ${midY} T ${curr.x} ${curr.y}`;
      }
      const midIdx = Math.floor(points.length / 2);
      const labelPos = points[midIdx];
      return { path, labelPos, points };
    }

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.max(35, Math.min(distance * 0.45, 140));

    let cp1 = { ...start };
    let cp2 = { ...end };

    const sPort = options?.sourceNode && options?.targetNode && sourcePort === 'auto'
      ? resolveAutoPort(options.sourceNode, options.targetNode, 'source')
      : sourcePort;
    const tPort = options?.sourceNode && options?.targetNode && targetPort === 'auto'
      ? resolveAutoPort(options.targetNode, options.sourceNode, 'target')
      : targetPort;

    if (sPort === 'top') cp1.y -= curvature;
    if (sPort === 'bottom') cp1.y += curvature;
    if (sPort === 'left') cp1.x -= curvature;
    if (sPort === 'right') cp1.x += curvature;

    if (tPort === 'top') cp2.y -= curvature;
    if (tPort === 'bottom') cp2.y += curvature;
    if (tPort === 'left') cp2.x -= curvature;
    if (tPort === 'right') cp2.x += curvature;

    const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    const labelPos = {
      x: 0.125 * start.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * end.x,
      y: 0.125 * start.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * end.y,
    };
    return { path, labelPos, points: [start, cp1, cp2, end] };
  }

  // 3. ORTHOGONAL / SMART STEPPED ROUTING WITH OBSTACLE AVOIDANCE
  // If user provided manual waypoints, strictly follow them:
  if (options?.waypoints && options.waypoints.length > 0) {
    const rawPoints = [start, ...options.waypoints, end];
    const points: Point[] = [];
    for (let i = 0; i < rawPoints.length; i++) {
      if (i === 0) {
        points.push(rawPoints[0]);
      } else {
        const prev = points[points.length - 1];
        const curr = rawPoints[i];
        if (Math.abs(prev.x - curr.x) > 3 && Math.abs(prev.y - curr.y) > 3) {
          // Add stepped intermediate point
          points.push({ x: curr.x, y: prev.y });
        }
        points.push(curr);
      }
    }
    return buildPathWithRadius(points, 8);
  }

  // Resolve dynamic auto ports if applicable
  const sPort = options?.sourceNode && options?.targetNode && sourcePort === 'auto'
    ? resolveAutoPort(options.sourceNode, options.targetNode, 'source')
    : sourcePort === 'auto' ? 'bottom' : sourcePort;

  const tPort = options?.sourceNode && options?.targetNode && targetPort === 'auto'
    ? resolveAutoPort(options.targetNode, options.sourceNode, 'target')
    : targetPort === 'auto' ? 'top' : targetPort;

  const margin = 26;
  const padding = 20;
  const offset = options?.manualOffset || 0;
  const { sourceNode, targetNode, allNodes } = options || {};

  // Build obstacle list excluding source and target nodes
  const obstacles: Array<{
    node: FlowchartNode;
    box: { minX: number; minY: number; maxX: number; maxY: number };
  }> = [];

  if (allNodes && allNodes.length > 0) {
    for (const n of allNodes) {
      if (n.id === sourceNode?.id || n.id === targetNode?.id) continue;
      obstacles.push({
        node: n,
        box: {
          minX: n.x - padding,
          minY: n.y - padding,
          maxX: n.x + n.width + padding,
          maxY: n.y + n.height + padding,
        },
      });
    }
  }

  const points: Point[] = [start];

  // Helper to pick bypass X coordinate around obstacles
  const getBypassX = (colliders: FlowchartNode[], preferRight = true): number => {
    if (colliders.length === 0) {
      const maxX = Math.max(sourceNode ? sourceNode.x + sourceNode.width : start.x, targetNode ? targetNode.x + targetNode.width : end.x);
      const minX = Math.min(sourceNode ? sourceNode.x : start.x, targetNode ? targetNode.x : end.x);
      return preferRight ? maxX + 32 + offset : minX - 32 + offset;
    }
    if (preferRight) {
      const maxRight = Math.max(...colliders.map((c) => c.x + c.width));
      return maxRight + padding + 12 + Math.max(0, offset);
    } else {
      const minLeft = Math.min(...colliders.map((c) => c.x));
      return minLeft - padding - 12 + Math.min(0, offset);
    }
  };

  // Helper to pick bypass Y coordinate around obstacles
  const getBypassY = (colliders: FlowchartNode[], preferBottom = true): number => {
    if (colliders.length === 0) {
      const maxY = Math.max(sourceNode ? sourceNode.y + sourceNode.height : start.y, targetNode ? targetNode.y + targetNode.height : end.y);
      const minY = Math.min(sourceNode ? sourceNode.y : start.y, targetNode ? targetNode.y : end.y);
      return preferBottom ? maxY + 32 + offset : minY - 32 + offset;
    }
    if (preferBottom) {
      const maxBottom = Math.max(...colliders.map((c) => c.y + c.height));
      return maxBottom + padding + 12 + Math.max(0, offset);
    } else {
      const minTop = Math.min(...colliders.map((c) => c.y));
      return minTop - padding - 12 + Math.min(0, offset);
    }
  };

  // ================= CASE A: Bottom -> Top (Standard top-down flowchart) =================
  if (sPort === 'bottom' && tPort === 'top') {
    if (end.y >= start.y + 30) {
      // Downward flow
      let midY = (start.y + end.y) / 2 + offset;
      const directSeg1: [Point, Point] = [start, { x: start.x, y: midY }];
      const directSeg2: [Point, Point] = [{ x: start.x, y: midY }, { x: end.x, y: midY }];
      const directSeg3: [Point, Point] = [{ x: end.x, y: midY }, end];

      const colliders = [
        ...findCollidingObstacles(directSeg1[0], directSeg1[1], obstacles),
        ...findCollidingObstacles(directSeg2[0], directSeg2[1], obstacles),
        ...findCollidingObstacles(directSeg3[0], directSeg3[1], obstacles),
      ];

      if (colliders.length > 0) {
        // Obstacle blocks direct route! Route around the side of obstacles!
        const preferRight = offset >= 0;
        const sideX = getBypassX(colliders, preferRight);
        points.push({ x: start.x, y: start.y + margin });
        points.push({ x: sideX, y: start.y + margin });
        points.push({ x: sideX, y: end.y - margin });
        points.push({ x: end.x, y: end.y - margin });
      } else {
        points.push({ x: start.x, y: midY });
        points.push({ x: end.x, y: midY });
      }
    } else {
      // Loopback: Target is ABOVE source! Route cleanly along the side corridor!
      const preferRight = offset >= 0;
      const allScopeNodes = [sourceNode, targetNode, ...obstacles.map((o) => o.node)].filter(Boolean) as FlowchartNode[];
      const sideX = getBypassX(allScopeNodes, preferRight);
      points.push({ x: start.x, y: start.y + margin });
      points.push({ x: sideX, y: start.y + margin });
      points.push({ x: sideX, y: end.y - margin });
      points.push({ x: end.x, y: end.y - margin });
    }
  }

  // ================= CASE B: Top -> Bottom (Upward flow or reverse) =================
  else if (sPort === 'top' && tPort === 'bottom') {
    if (end.y <= start.y - 30) {
      let midY = (start.y + end.y) / 2 + offset;
      const colliders = [
        ...findCollidingObstacles(start, { x: start.x, y: midY }, obstacles),
        ...findCollidingObstacles({ x: start.x, y: midY }, { x: end.x, y: midY }, obstacles),
        ...findCollidingObstacles({ x: end.x, y: midY }, end, obstacles),
      ];
      if (colliders.length > 0) {
        const preferRight = offset >= 0;
        const sideX = getBypassX(colliders, preferRight);
        points.push({ x: start.x, y: start.y - margin });
        points.push({ x: sideX, y: start.y - margin });
        points.push({ x: sideX, y: end.y + margin });
        points.push({ x: end.x, y: end.y + margin });
      } else {
        points.push({ x: start.x, y: midY });
        points.push({ x: end.x, y: midY });
      }
    } else {
      const preferRight = offset >= 0;
      const allScopeNodes = [sourceNode, targetNode, ...obstacles.map((o) => o.node)].filter(Boolean) as FlowchartNode[];
      const sideX = getBypassX(allScopeNodes, preferRight);
      points.push({ x: start.x, y: start.y - margin });
      points.push({ x: sideX, y: start.y - margin });
      points.push({ x: sideX, y: end.y + margin });
      points.push({ x: end.x, y: end.y + margin });
    }
  }

  // ================= CASE C: Right -> Left (Horizontal left-to-right) =================
  else if (sPort === 'right' && tPort === 'left') {
    if (end.x >= start.x + 30) {
      let midX = (start.x + end.x) / 2 + offset;
      const colliders = [
        ...findCollidingObstacles(start, { x: midX, y: start.y }, obstacles),
        ...findCollidingObstacles({ x: midX, y: start.y }, { x: midX, y: end.y }, obstacles),
        ...findCollidingObstacles({ x: midX, y: end.y }, end, obstacles),
      ];
      if (colliders.length > 0) {
        const preferBottom = offset >= 0;
        const sideY = getBypassY(colliders, preferBottom);
        points.push({ x: start.x + margin, y: start.y });
        points.push({ x: start.x + margin, y: sideY });
        points.push({ x: end.x - margin, y: sideY });
        points.push({ x: end.x - margin, y: end.y });
      } else {
        points.push({ x: midX, y: start.y });
        points.push({ x: midX, y: end.y });
      }
    } else {
      const preferBottom = offset >= 0;
      const allScopeNodes = [sourceNode, targetNode, ...obstacles.map((o) => o.node)].filter(Boolean) as FlowchartNode[];
      const sideY = getBypassY(allScopeNodes, preferBottom);
      points.push({ x: start.x + margin, y: start.y });
      points.push({ x: start.x + margin, y: sideY });
      points.push({ x: end.x - margin, y: sideY });
      points.push({ x: end.x - margin, y: end.y });
    }
  }

  // ================= CASE D: Left -> Right (Horizontal right-to-left) =================
  else if (sPort === 'left' && tPort === 'right') {
    if (end.x <= start.x - 30) {
      let midX = (start.x + end.x) / 2 + offset;
      const colliders = [
        ...findCollidingObstacles(start, { x: midX, y: start.y }, obstacles),
        ...findCollidingObstacles({ x: midX, y: start.y }, { x: midX, y: end.y }, obstacles),
        ...findCollidingObstacles({ x: midX, y: end.y }, end, obstacles),
      ];
      if (colliders.length > 0) {
        const preferBottom = offset >= 0;
        const sideY = getBypassY(colliders, preferBottom);
        points.push({ x: start.x - margin, y: start.y });
        points.push({ x: start.x - margin, y: sideY });
        points.push({ x: end.x + margin, y: sideY });
        points.push({ x: end.x + margin, y: end.y });
      } else {
        points.push({ x: midX, y: start.y });
        points.push({ x: midX, y: end.y });
      }
    } else {
      const preferBottom = offset >= 0;
      const allScopeNodes = [sourceNode, targetNode, ...obstacles.map((o) => o.node)].filter(Boolean) as FlowchartNode[];
      const sideY = getBypassY(allScopeNodes, preferBottom);
      points.push({ x: start.x - margin, y: start.y });
      points.push({ x: start.x - margin, y: sideY });
      points.push({ x: end.x + margin, y: sideY });
      points.push({ x: end.x + margin, y: end.y });
    }
  }

  // ================= CASE E: Perpendicular turns (e.g. Decision branch Bottom -> Right/Left) =================
  else if (sPort === 'bottom' && (tPort === 'left' || tPort === 'right')) {
    const isTargetLower = end.y >= start.y + 20;
    if (isTargetLower) {
      const colliders = [
        ...findCollidingObstacles(start, { x: start.x, y: end.y }, obstacles),
        ...findCollidingObstacles({ x: start.x, y: end.y }, end, obstacles),
      ];
      if (colliders.length > 0) {
        const sideX = tPort === 'left' ? end.x - margin - 20 : end.x + margin + 20;
        points.push({ x: start.x, y: start.y + margin });
        points.push({ x: sideX, y: start.y + margin });
        points.push({ x: sideX, y: end.y });
      } else {
        points.push({ x: start.x, y: end.y });
      }
    } else {
      const sideX = tPort === 'left' ? end.x - margin : end.x + margin;
      points.push({ x: start.x, y: start.y + margin });
      points.push({ x: sideX, y: start.y + margin });
      points.push({ x: sideX, y: end.y });
    }
  }
  else if (sPort === 'top' && (tPort === 'left' || tPort === 'right')) {
    const isTargetHigher = end.y <= start.y - 20;
    if (isTargetHigher) {
      points.push({ x: start.x, y: end.y });
    } else {
      const sideX = tPort === 'left' ? end.x - margin : end.x + margin;
      points.push({ x: start.x, y: start.y - margin });
      points.push({ x: sideX, y: start.y - margin });
      points.push({ x: sideX, y: end.y });
    }
  }
  else if ((sPort === 'left' || sPort === 'right') && tPort === 'top') {
    const isTargetLower = end.y >= start.y + margin;
    if (isTargetLower) {
      points.push({ x: end.x, y: start.y });
    } else {
      const sideX = sPort === 'right' ? start.x + margin : start.x - margin;
      points.push({ x: sideX, y: start.y });
      points.push({ x: sideX, y: end.y - margin });
      points.push({ x: end.x, y: end.y - margin });
    }
  }
  else if ((sPort === 'left' || sPort === 'right') && tPort === 'bottom') {
    const isTargetHigher = end.y <= start.y - margin;
    if (isTargetHigher) {
      points.push({ x: end.x, y: start.y });
    } else {
      const sideX = sPort === 'right' ? start.x + margin : start.x - margin;
      points.push({ x: sideX, y: start.y });
      points.push({ x: sideX, y: end.y + margin });
      points.push({ x: end.x, y: end.y + margin });
    }
  }

  // ================= CASE F: Same side ports (e.g. bottom -> bottom, top -> top) =================
  else if (sPort === 'bottom' && tPort === 'bottom') {
    const maxY = Math.max(start.y, end.y) + margin + offset;
    points.push({ x: start.x, y: maxY });
    points.push({ x: end.x, y: maxY });
  }
  else if (sPort === 'top' && tPort === 'top') {
    const minY = Math.min(start.y, end.y) - margin - offset;
    points.push({ x: start.x, y: minY });
    points.push({ x: end.x, y: minY });
  }
  else if (sPort === 'right' && tPort === 'right') {
    const maxX = Math.max(start.x, end.x) + margin + offset;
    points.push({ x: maxX, y: start.y });
    points.push({ x: maxX, y: end.y });
  }
  else if (sPort === 'left' && tPort === 'left') {
    const minX = Math.min(start.x, end.x) - margin - offset;
    points.push({ x: minX, y: start.y });
    points.push({ x: minX, y: end.y });
  }

  // Fallback orthogonal
  else {
    const midX = (start.x + end.x) / 2 + offset;
    points.push({ x: midX, y: start.y });
    points.push({ x: midX, y: end.y });
  }

  points.push(end);
  return buildPathWithRadius(points, 8);
}

/**
 * Builds SVG path string with elegant smooth rounded corners at orthogonal turns
 */
function buildPathWithRadius(
  points: Point[],
  radius = 8
): { path: string; labelPos: Point; points: Point[] } {
  // Deduplicate consecutive identical points
  const cleanPoints: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    if (
      i === 0 ||
      Math.abs(points[i].x - cleanPoints[cleanPoints.length - 1].x) > 1 ||
      Math.abs(points[i].y - cleanPoints[cleanPoints.length - 1].y) > 1
    ) {
      cleanPoints.push(points[i]);
    }
  }

  if (cleanPoints.length <= 1) {
    return {
      path: `M ${points[0]?.x || 0} ${points[0]?.y || 0}`,
      labelPos: points[0] || { x: 0, y: 0 },
      points: cleanPoints,
    };
  }

  let pathStr = `M ${cleanPoints[0].x} ${cleanPoints[0].y}`;
  for (let i = 1; i < cleanPoints.length - 1; i++) {
    const prev = cleanPoints[i - 1];
    const curr = cleanPoints[i];
    const next = cleanPoints[i + 1];

    const d1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const d2 = { x: next.x - curr.x, y: next.y - curr.y };

    const len1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y);
    const len2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);
    const r = Math.min(radius, len1 / 2, len2 / 2);

    if (r > 1 && (d1.x !== d2.x || d1.y !== d2.y)) {
      const pBefore = {
        x: curr.x - (d1.x / (len1 || 1)) * r,
        y: curr.y - (d1.y / (len1 || 1)) * r,
      };
      const pAfter = {
        x: curr.x + (d2.x / (len2 || 1)) * r,
        y: curr.y + (d2.y / (len2 || 1)) * r,
      };
      pathStr += ` L ${pBefore.x} ${pBefore.y} Q ${curr.x} ${curr.y} ${pAfter.x} ${pAfter.y}`;
    } else {
      pathStr += ` L ${curr.x} ${curr.y}`;
    }
  }
  pathStr += ` L ${cleanPoints[cleanPoints.length - 1].x} ${cleanPoints[cleanPoints.length - 1].y}`;

  // Find longest or middle segment for clean label positioning
  const midIdx = Math.floor(cleanPoints.length / 2);
  const pA = cleanPoints[midIdx - 1] || cleanPoints[0];
  const pB = cleanPoints[midIdx] || cleanPoints[cleanPoints.length - 1];
  const labelPos = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };

  return { path: pathStr, labelPos, points: cleanPoints };
}

export function getNodeBoundingBox(nodes: FlowchartNode[], padding = 60) {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 800, width: 1000, height: 800 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(300, maxX - minX),
    height: Math.max(300, maxY - minY),
  };
}

/**
 * Checks if an axis-aligned box intersects with a node
 */
export function doesBoxIntersectNode(
  box: { x1: number; y1: number; x2: number; y2: number },
  node: FlowchartNode
): boolean {
  const minX = Math.min(box.x1, box.x2);
  const maxX = Math.max(box.x1, box.x2);
  const minY = Math.min(box.y1, box.y2);
  const maxY = Math.max(box.y1, box.y2);

  const nodeMinX = node.x;
  const nodeMaxX = node.x + node.width;
  const nodeMinY = node.y;
  const nodeMaxY = node.y + node.height;

  return !(
    nodeMaxX < minX ||
    nodeMinX > maxX ||
    nodeMaxY < minY ||
    nodeMinY > maxY
  );
}
