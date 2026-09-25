import { FlowchartNode } from '../types/flowchart';

export function renderNodeShapePath(node: FlowchartNode): {
  element: 'rect' | 'polygon' | 'circle' | 'path';
  props: Record<string, any>;
  auxiliaryElements?: Array<{ element: string; props: Record<string, any> }>;
} {
  const { width: w, height: h, type, fill, stroke, strokeWidth, strokeStyle } = node;
  const strokeDash = strokeStyle === 'dashed' ? '6,4' : strokeStyle === 'dotted' ? '2,3' : undefined;

  switch (type) {
    case 'terminal':
      // Rounded pill / capsule
      return {
        element: 'rect',
        props: {
          x: 0,
          y: 0,
          width: w,
          height: h,
          rx: Math.min(w, h) / 2,
          ry: Math.min(w, h) / 2,
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
        },
      };

    case 'process':
      // Rectangle with subtle modern rounding
      return {
        element: 'rect',
        props: {
          x: 0,
          y: 0,
          width: w,
          height: h,
          rx: 6,
          ry: 6,
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
        },
      };

    case 'decision':
      // Diamond
      const points = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;
      return {
        element: 'polygon',
        props: {
          points,
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
          strokeLinejoin: 'round',
        },
      };

    case 'input-output':
      // Parallelogram (slanted)
      const slant = Math.min(22, w * 0.15);
      const ioPoints = `${slant},0 ${w},0 ${w - slant},${h} 0,${h}`;
      return {
        element: 'polygon',
        props: {
          points: ioPoints,
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
          strokeLinejoin: 'round',
        },
      };

    case 'document':
      // Wave bottom
      const waveD = `M 0,0 L ${w},0 L ${w},${h - 12} Q ${w * 0.75},${h - 22} ${w * 0.5},${h - 10} Q ${w * 0.25},${h + 2} 0,${h - 10} Z`;
      return {
        element: 'path',
        props: {
          d: waveD,
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
        },
      };

    case 'subroutine':
      // Double sided vertical stripes
      const margin = Math.min(16, w * 0.12);
      return {
        element: 'rect',
        props: {
          x: 0,
          y: 0,
          width: w,
          height: h,
          rx: 4,
          ry: 4,
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
        },
        auxiliaryElements: [
          {
            element: 'line',
            props: {
              x1: margin,
              y1: 0,
              x2: margin,
              y2: h,
              stroke,
              strokeWidth,
              strokeDasharray: strokeDash,
            },
          },
          {
            element: 'line',
            props: {
              x1: w - margin,
              y1: 0,
              x2: w - margin,
              y2: h,
              stroke,
              strokeWidth,
              strokeDasharray: strokeDash,
            },
          },
        ],
      };

    case 'database':
      // Cylinder: top ellipse, body, bottom curve
      const ry = Math.min(14, h * 0.2);
      const dbPath = `
        M 0,${ry}
        A ${w / 2},${ry} 0 0,0 ${w},${ry}
        L ${w},${h - ry}
        A ${w / 2},${ry} 0 0,1 0,${h - ry}
        Z
      `;
      return {
        element: 'path',
        props: {
          d: dbPath,
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
        },
        auxiliaryElements: [
          {
            element: 'ellipse',
            props: {
              cx: w / 2,
              cy: ry,
              rx: w / 2,
              ry,
              fill,
              stroke,
              strokeWidth,
            },
          },
        ],
      };

    case 'connector':
      // Circle
      const r = Math.min(w, h) / 2;
      return {
        element: 'circle',
        props: {
          cx: w / 2,
          cy: h / 2,
          r,
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
        },
      };

    case 'note':
      // Sticky folded note
      const fold = 16;
      const notePath = `M 0,0 L ${w - fold},0 L ${w},${fold} L ${w},${h} L 0,${h} Z`;
      return {
        element: 'path',
        props: {
          d: notePath,
          fill,
          stroke,
          strokeWidth,
          strokeDasharray: strokeDash,
        },
        auxiliaryElements: [
          {
            element: 'polygon',
            props: {
              points: `${w - fold},0 ${w},${fold} ${w - fold},${fold}`,
              fill: stroke,
              opacity: 0.35,
            },
          },
        ],
      };

    default:
      return {
        element: 'rect',
        props: { x: 0, y: 0, width: w, height: h, fill, stroke, strokeWidth },
      };
  }
}
