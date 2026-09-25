import { FlowchartNode, FlowchartPort, LineType } from '../types/flowchart';

export interface Point {
  x: number;
  y: number;
}

export function getPortPosition(node: FlowchartNode, port: FlowchartPort): Point {
  const { x, y, width, height } = node;
  switch (port) {
    case 'top':
      return { x: x + width / 2, y };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
    case 'right':
      return { x: x + width, y: y + height / 2 };
  }
}

export function calculateEdgePath(
  start: Point,
  end: Point,
  sourcePort: FlowchartPort,
  targetPort: FlowchartPort,
  lineType: LineType
): { path: string; labelPos: Point } {
  if (lineType === 'straight') {
    const path = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    const labelPos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    return { path, labelPos };
  }

  if (lineType === 'curved') {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.max(30, Math.min(distance * 0.4, 120));

    let cp1 = { ...start };
    let cp2 = { ...end };

    if (sourcePort === 'top') cp1.y -= curvature;
    if (sourcePort === 'bottom') cp1.y += curvature;
    if (sourcePort === 'left') cp1.x -= curvature;
    if (sourcePort === 'right') cp1.x += curvature;

    if (targetPort === 'top') cp2.y -= curvature;
    if (targetPort === 'bottom') cp2.y += curvature;
    if (targetPort === 'left') cp2.x -= curvature;
    if (targetPort === 'right') cp2.x += curvature;

    const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    // Approximate midpoint on cubic bezier
    const labelPos = {
      x: 0.125 * start.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * end.x,
      y: 0.125 * start.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * end.y,
    };
    return { path, labelPos };
  }

  // Orthogonal (stepped) routing
  const points: Point[] = [start];

  if (sourcePort === 'bottom' && targetPort === 'top') {
    const midY = (start.y + end.y) / 2;
    if (end.y > start.y + 20) {
      points.push({ x: start.x, y: midY });
      points.push({ x: end.x, y: midY });
    } else {
      // Loop around
      const offset = 30;
      points.push({ x: start.x, y: start.y + offset });
      const midX = (start.x + end.x) / 2;
      points.push({ x: midX, y: start.y + offset });
      points.push({ x: midX, y: end.y - offset });
      points.push({ x: end.x, y: end.y - offset });
    }
  } else if (sourcePort === 'top' && targetPort === 'bottom') {
    const midY = (start.y + end.y) / 2;
    points.push({ x: start.x, y: midY });
    points.push({ x: end.x, y: midY });
  } else if (sourcePort === 'right' && targetPort === 'left') {
    const midX = (start.x + end.x) / 2;
    if (end.x > start.x + 20) {
      points.push({ x: midX, y: start.y });
      points.push({ x: midX, y: end.y });
    } else {
      const offset = 30;
      points.push({ x: start.x + offset, y: start.y });
      const midY = (start.y + end.y) / 2;
      points.push({ x: start.x + offset, y: midY });
      points.push({ x: end.x - offset, y: midY });
      points.push({ x: end.x - offset, y: end.y });
    }
  } else if (sourcePort === 'left' && targetPort === 'right') {
    const midX = (start.x + end.x) / 2;
    points.push({ x: midX, y: start.y });
    points.push({ x: midX, y: end.y });
  } else if (sourcePort === 'right' && targetPort === 'top') {
    points.push({ x: end.x, y: start.y });
  } else if (sourcePort === 'left' && targetPort === 'top') {
    points.push({ x: end.x, y: start.y });
  } else if (sourcePort === 'bottom' && targetPort === 'right') {
    points.push({ x: start.x, y: end.y });
  } else if (sourcePort === 'bottom' && targetPort === 'left') {
    points.push({ x: start.x, y: end.y });
  } else {
    // Default orthogonal fallback
    const midX = (start.x + end.x) / 2;
    points.push({ x: midX, y: start.y });
    points.push({ x: midX, y: end.y });
  }

  points.push(end);

  // Build SVG path with rounded corners
  const radius = 8;
  let pathStr = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

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
  pathStr += ` L ${end.x} ${end.y}`;

  // Find middle segment for label position
  const midIdx = Math.floor(points.length / 2);
  const pA = points[midIdx - 1] || points[0];
  const pB = points[midIdx] || points[points.length - 1];
  const labelPos = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };

  return { path: pathStr, labelPos };
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
