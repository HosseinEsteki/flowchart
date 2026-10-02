import {
  FlowchartPage,
  FlowchartProject,
  FlowchartNode,
  FlowchartEdge,
  PrintSettings,
  PrintColorMode,
} from '../types/flowchart';
import { getNodeBoundingBox, calculateEdgePath, getPortPosition } from './canvasMath';
import { renderNodeShapePath } from './shapePaths';
import { jsPDF } from 'jspdf';

// Default print configuration
export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  colorMode: 'color',
  fontFamily: 'vazirmatn',
  descFontSize: 13,
  titleFontSize: 20,
  fontWeight: 'normal',
  textAlign: 'right',
  spacing: 24,
  descPosition: 'below',
  paperSize: 'a4',
  orientation: 'landscape',
  marginSize: 'normal',
  showPageNumbers: true,
  showHeaderFooter: true,
  showDate: true,
  showBorders: true,
  targetPages: 'all',
};

// Convert hex/named color to RGB
function parseColorToRgb(color: string): { r: number; g: number; b: number } {
  if (!color || color === 'transparent') return { r: 255, g: 255, b: 255 };

  let c = color.trim().toLowerCase();
  if (c.startsWith('#')) {
    if (c.length === 4) {
      // #abc -> #aabbcc
      c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    }
    const num = parseInt(c.slice(1), 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  const rgbMatch = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return { r: 200, g: 200, b: 200 };
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b))
    .toString(16)
    .slice(1)}`;
}

// Convert color to grayscale
export function toGrayscaleColor(
  color: string,
  type: 'fill' | 'stroke' | 'text'
): string {
  if (!color || color === 'transparent') return 'transparent';

  const { r, g, b } = parseColorToRgb(color);
  // Standard ITU-R BT.601 luminance
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  if (type === 'fill') {
    // For print fills, ensure high-key light grays so toner is saved and contrast with text is high
    const targetLum = Math.max(220, Math.min(248, lum > 200 ? lum : 225 + lum * 0.08));
    return rgbToHex(targetLum, targetLum, targetLum);
  }

  if (type === 'stroke') {
    // Darker, sharp borders for print
    const strokeLum = Math.min(75, Math.max(20, lum * 0.4));
    return rgbToHex(strokeLum, strokeLum, strokeLum);
  }

  // text
  return lum < 140 ? '#111827' : '#000000';
}

// Map node based on print color mode
export function transformNodeForPrint(
  node: FlowchartNode,
  mode: PrintColorMode
): FlowchartNode {
  if (mode === 'color') return node;

  if (mode === 'monochrome') {
    return {
      ...node,
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeWidth: Math.max(1.5, node.strokeWidth),
      textColor: '#000000',
    };
  }

  // Grayscale
  return {
    ...node,
    fill: toGrayscaleColor(node.fill, 'fill'),
    stroke: toGrayscaleColor(node.stroke, 'stroke'),
    textColor: toGrayscaleColor(node.textColor, 'text'),
  };
}

// Map edge based on print color mode
export function transformEdgeForPrint(
  edge: FlowchartEdge,
  mode: PrintColorMode
): FlowchartEdge {
  if (mode === 'color') return edge;

  if (mode === 'monochrome') {
    return {
      ...edge,
      color: '#000000',
      strokeWidth: Math.max(1.5, edge.strokeWidth),
    };
  }

  // Grayscale
  return {
    ...edge,
    color: '#374151',
  };
}

// Generate standalone SVG markup for a page diagram
export function generatePageSvgMarkup(
  page: FlowchartPage,
  colorMode: PrintColorMode = 'color',
  options?: { padding?: number }
): { svg: string; width: number; height: number } {
  const padding = options?.padding ?? 40;
  const bbox = getNodeBoundingBox(page.nodes, padding);
  const width = Math.max(600, bbox.width);
  const height = Math.max(380, bbox.height);

  const nodes = page.nodes.map((n) => transformNodeForPrint(n, colorMode));
  const edges = page.edges.map((e) => transformEdgeForPrint(e, colorMode));

  const arrowColor =
    colorMode === 'monochrome' ? '#000000' : colorMode === 'grayscale' ? '#374151' : '#64748B';

  const edgesSvg = edges
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
      const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
      if (!sourceNode || !targetNode) return '';

      const start = getPortPosition(sourceNode, edge.sourcePort);
      const end = getPortPosition(targetNode, edge.targetPort);
      const { path: pathD } = calculateEdgePath(start, end, edge.sourcePort, edge.targetPort, edge.lineType);

      const strokeDash = edge.style === 'dashed' ? 'stroke-dasharray="6,4"' : '';
      const markerId = `arrow-${colorMode}`;

      let labelSvg = '';
      if (edge.label) {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2 - 6;
        labelSvg = `
          <g>
            <rect x="${midX - 30}" y="${midY - 10}" width="60" height="20" rx="4" fill="#FFFFFF" stroke="${edge.color}" stroke-width="0.8" opacity="0.95" />
            <text x="${midX}" y="${midY + 4}" text-anchor="middle" font-size="11" fill="${edge.color}" font-family="Vazirmatn, sans-serif" font-weight="600">${edge.label}</text>
          </g>
        `;
      }

      return `
        <g class="flowchart-edge">
          <path d="${pathD}" fill="none" stroke="${edge.color}" stroke-width="${edge.strokeWidth}" ${strokeDash} marker-end="url(#${markerId})" stroke-linecap="round" stroke-linejoin="round" />
          ${labelSvg}
        </g>
      `;
    })
    .join('\n');

  const nodesSvg = nodes
    .map((node) => {
      const shape = renderNodeShapePath(node);
      const propsStr = Object.entries(shape.props)
        .map(([k, v]) => (v !== undefined ? `${k}="${v}"` : ''))
        .filter(Boolean)
        .join(' ');

      let auxStr = '';
      if (shape.auxiliaryElements) {
        auxStr = shape.auxiliaryElements
          .map((aux) => {
            const auxProps = Object.entries(aux.props)
              .map(([k, v]) => `${k}="${v}"`)
              .join(' ');
            return `<${aux.element} ${auxProps} />`;
          })
          .join('\n');
      }

      // Multi-line text support
      const lines = (node.label || '').split('\n');
      const lineHeight = node.fontSize * 1.3;
      const startY = node.height / 2 - ((lines.length - 1) * lineHeight) / 2 + node.fontSize * 0.35;

      const textSpans = lines
        .map((line, idx) => {
          return `<tspan x="${node.width / 2}" y="${startY + idx * lineHeight}">${line}</tspan>`;
        })
        .join('');

      return `
        <g transform="translate(${node.x}, ${node.y})" class="flowchart-node">
          <${shape.element} ${propsStr} />
          ${auxStr}
          <text fill="${node.textColor}" font-size="${node.fontSize}" font-weight="${node.fontWeight || 'normal'}" font-family="Vazirmatn, system-ui, sans-serif" text-anchor="middle">
            ${textSpans}
          </text>
        </g>
      `;
    })
    .join('\n');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.minX} ${bbox.minY} ${width} ${height}" width="${width}" height="${height}" style="background-color: #FFFFFF; font-family: 'Vazirmatn', system-ui, sans-serif;">
      <defs>
        <marker id="arrow-${colorMode}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="${arrowColor}" />
        </marker>
      </defs>
      <g id="edges-layer">${edgesSvg}</g>
      <g id="nodes-layer">${nodesSvg}</g>
    </svg>
  `;

  return { svg, width, height };
}

// Generate CSS font-family string
export function getFontFamilyCss(family: PrintSettings['fontFamily']): string {
  switch (family) {
    case 'vazirmatn':
      return "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    case 'shabnam':
      return "'Shabnam', 'Vazirmatn', Tahoma, sans-serif";
    case 'system':
      return "'Segoe UI', Tahoma, Arial, 'Vazirmatn', sans-serif";
    case 'serif':
      return "'Times New Roman', 'B Nazanin', 'Mitra', Georgia, serif";
    case 'sans':
    default:
      return "'Plus Jakarta Sans', 'Vazirmatn', system-ui, -apple-system, sans-serif";
  }
}

// Margin in mm
export function getMarginMm(marginSize: PrintSettings['marginSize']): number {
  switch (marginSize) {
    case 'compact':
      return 10;
    case 'spacious':
      return 26;
    case 'normal':
    default:
      return 18;
  }
}

// Generate complete standalone HTML report optimized for printing
export function generatePrintReportHtml(
  project: FlowchartProject,
  settings: PrintSettings
): string {
  const fontFamilyCss = getFontFamilyCss(settings.fontFamily);
  const marginMm = getMarginMm(settings.marginSize);
  const pages =
    settings.targetPages === 'current'
      ? (project.pages || []).filter((p) => p.id === project.activePageId)
      : project.pages && project.pages.length > 0
      ? project.pages
      : [
          {
            id: 'p1',
            name: 'صفحه اصلی',
            description: project.description,
            nodes: project.nodes,
            edges: project.edges,
          },
        ];

  const now = new Date();
  const dateFa = now.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateEn = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const totalPages = pages.length;

  const pagesHtml = pages
    .map((page, index) => {
      const pageNum = index + 1;
      const { svg } = generatePageSvgMarkup(page, settings.colorMode);
      const hasDescription = Boolean(page.description && page.description.trim());
      const descText = (page.description || '').trim();

      const descBoxHtml = hasDescription
        ? `
          <div class="page-description-box" style="margin-${
            settings.descPosition === 'above' ? 'bottom' : 'top'
          }: ${settings.spacing}px;">
            <div class="desc-header">
              <span class="desc-tag">توضیحات و مستندات فلوچارت</span>
              <span class="desc-subtitle">${page.name}</span>
            </div>
            <div class="desc-content" style="font-size: ${
              settings.descFontSize
            }px; font-weight: ${settings.fontWeight}; text-align: ${
            settings.textAlign
          };">
              ${descText
                .split('\n')
                .map((line) => (line.trim() ? `<p>${line}</p>` : '<br/>'))
                .join('')}
            </div>
          </div>
        `
        : '';

      const isAppendix = settings.descPosition === 'appendix' && hasDescription;

      return `
        <!-- DIAGRAM PAGE ${pageNum} -->
        <div class="print-page sheet">
          ${
            settings.showHeaderFooter
              ? `
            <header class="sheet-header">
              <div class="header-project-title">
                <span class="brand-badge">FlowCraft</span>
                <span class="project-title" style="font-size: ${settings.titleFontSize}px;">${
                  project.title || 'فلوچارت'
                }</span>
              </div>
              <div class="header-meta">
                <span class="page-name-badge">${page.name}</span>
                ${settings.showDate ? `<span class="date-badge">${dateFa} (${dateEn})</span>` : ''}
              </div>
            </header>
          `
              : ''
          }

          <div class="sheet-body">
            ${settings.descPosition === 'above' && !isAppendix ? descBoxHtml : ''}

            <div class="diagram-wrapper ${settings.showBorders ? 'with-border' : ''}">
              ${svg}
            </div>

            ${settings.descPosition === 'below' && !isAppendix ? descBoxHtml : ''}
          </div>

          ${
            settings.showHeaderFooter
              ? `
            <footer class="sheet-footer">
              <div class="footer-stats">
                <span>تعداد نمادها: ${page.nodes.length}</span>
                <span>•</span>
                <span>تعداد اتصالات: ${page.edges.length}</span>
                <span>•</span>
                <span>حالت چاپ: ${
                  settings.colorMode === 'color'
                    ? 'رنگی کامل'
                    : settings.colorMode === 'grayscale'
                    ? 'خاکستری (Grayscale)'
                    : 'سیاه و سفید خطی'
                }</span>
              </div>
              ${
                settings.showPageNumbers
                  ? `<div class="footer-page-num">صفحه ${pageNum} از ${
                      isAppendix ? totalPages * 2 : totalPages
                    }</div>`
                  : ''
              }
            </footer>
          `
              : ''
          }
        </div>

        ${
          isAppendix
            ? `
          <!-- APPENDIX PAGE FOR DESCRIPTION -->
          <div class="print-page sheet appendix-page">
            <header class="sheet-header">
              <div class="header-project-title">
                <span class="brand-badge">FlowCraft</span>
                <span class="project-title">${project.title || 'فلوچارت'} - ضمیمه مستندات</span>
              </div>
              <div class="header-meta">
                <span class="page-name-badge">${page.name} (ضمیمه)</span>
              </div>
            </header>

            <div class="sheet-body">
              <div class="appendix-content">
                <h3 class="appendix-title">توضیحات و مستندات تفصیلی: ${page.name}</h3>
                <div class="desc-content" style="font-size: ${
                  settings.descFontSize + 1
                }px; font-weight: ${settings.fontWeight}; text-align: ${settings.textAlign};">
                  ${descText
                    .split('\n')
                    .map((line) => (line.trim() ? `<p>${line}</p>` : '<br/>'))
                    .join('')}
                </div>
              </div>
            </div>

            <footer class="sheet-footer">
              <div class="footer-stats">ضمیمه توضیحات صفحه ${page.name}</div>
              ${
                settings.showPageNumbers
                  ? `<div class="footer-page-num">صفحه ${pageNum}-ب</div>`
                  : ''
              }
            </footer>
          </div>
        `
            : ''
        }
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.title || 'چاپ فلوچارت'} - FlowCraft Print</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Vazirmatn:wght@400;500;600;700&family=Shabnam:wght@400;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${settings.paperSize.toUpperCase()} ${settings.orientation};
      margin: ${marginMm}mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${fontFamilyCss};
      background-color: #f1f5f9;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }

    .no-print-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #1e293b;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .toolbar-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      font-family: inherit;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #334155;
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: #475569;
    }

    /* Print Sheet Canvas */
    .print-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 0 48px;
      gap: 32px;
    }

    .sheet {
      background: #ffffff;
      width: 100%;
      max-width: ${settings.orientation === 'landscape' ? '1120px' : '820px'};
      min-height: ${settings.orientation === 'landscape' ? '720px' : '1080px'};
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-radius: 6px;
      page-break-after: always;
      break-after: page;
      position: relative;
    }

    .sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }

    .header-project-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-badge {
      font-size: 11px;
      font-weight: 800;
      background: #0f172a;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .project-title {
      font-weight: 700;
      color: #0f172a;
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #64748b;
    }

    .page-name-badge {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 600;
      color: #1e293b;
    }

    .date-badge {
      font-size: 11px;
    }

    .sheet-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
    }

    .diagram-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #ffffff;
      overflow: hidden;
    }

    .diagram-wrapper.with-border {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
    }

    .diagram-wrapper svg {
      width: 100%;
      height: auto;
      max-height: ${settings.orientation === 'landscape' ? '520px' : '760px'};
      object-fit: contain;
    }

    .page-description-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-right: 4px solid #2563eb;
      border-radius: 8px;
      padding: 14px 18px;
    }

    .desc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px dashed #cbd5e1;
    }

    .desc-tag {
      font-size: 11px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
    }

    .desc-subtitle {
      font-size: 11px;
      color: #64748b;
    }

    .desc-content p {
      margin-bottom: 6px;
      line-height: 1.7;
      color: #1e293b;
    }

    .desc-content p:last-child {
      margin-bottom: 0;
    }

    .appendix-content {
      padding: 20px 0;
    }

    .appendix-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #0f172a;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      display: inline-block;
    }

    .sheet-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 18px;
      font-size: 11px;
      color: #64748b;
    }

    .footer-stats {
      display: flex;
      gap: 8px;
    }

    .footer-page-num {
      font-weight: 600;
      font-family: monospace;
    }

    /* Print media overrides */
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .no-print-toolbar {
        display: none !important;
      }
      .print-container {
        padding: 0 !important;
        gap: 0 !important;
      }
      .sheet {
        box-shadow: none !important;
        max-width: 100% !important;
        width: 100% !important;
        min-height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .page-description-box {
        background: #ffffff !important;
        border-color: #64748b !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar">
    <div class="toolbar-title">
      <span>🖨️ آماده پرینت: ${project.title || 'فلوچارت'}</span>
      <span style="font-size: 12px; opacity: 0.75;">(${
        settings.colorMode === 'color'
          ? 'رنگی'
          : settings.colorMode === 'grayscale'
          ? 'خاکستری'
          : 'سیاه و سفید'
      } - کاغذ ${settings.paperSize.toUpperCase()} ${
    settings.orientation === 'landscape' ? 'افقی' : 'عمودی'
  })</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-secondary" onclick="window.close()">بستن پنجره</button>
      <button class="btn btn-primary" onclick="window.print()">پرینت مستقیم (Print)</button>
    </div>
  </div>

  <div class="print-container">
    ${pagesHtml}
  </div>
</body>
</html>`;
}

// Trigger direct browser print dialog via hidden iframe
export function triggerPrintDialog(
  project: FlowchartProject,
  settings: PrintSettings
): void {
  const html = generatePrintReportHtml(project, settings);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1500);
  }, 400);
}

// Export multi-page PDF with print settings
export async function exportMultiPagePdf(
  project: FlowchartProject,
  settings: PrintSettings
): Promise<void> {
  const pages =
    settings.targetPages === 'current'
      ? (project.pages || []).filter((p) => p.id === project.activePageId)
      : project.pages && project.pages.length > 0
      ? project.pages
      : [
          {
            id: 'p1',
            name: 'صفحه اصلی',
            description: project.description,
            nodes: project.nodes,
            edges: project.edges,
          },
        ];

  const orientation = settings.orientation === 'landscape' ? 'landscape' : 'portrait';
  const format = settings.paperSize === 'a3' ? 'a3' : settings.paperSize === 'letter' ? 'letter' : 'a4';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = getMarginMm(settings.marginSize);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) {
      pdf.addPage(format, orientation);
    }

    const { svg, width, height } = generatePageSvgMarkup(page, settings.colorMode);

    // Rasterize SVG for jsPDF image inclusion
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG for PDF'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    URL.revokeObjectURL(url);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Header
    let currentY = margin;
    if (settings.showHeaderFooter) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text(project.title || 'FlowCraft Diagram', margin, currentY + 5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(page.name, pageWidth - margin, currentY + 5, { align: 'right' });

      currentY += 12;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 6;
    }

    // Available space for diagram
    const footerHeight = settings.showHeaderFooter ? 12 : 0;
    const hasNotes = Boolean(page.description && page.description.trim());
    const notesHeightEstimate = hasNotes ? 25 : 0;

    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - currentY - margin - footerHeight - notesHeightEstimate;

    const imgAspect = width / height;
    let renderW = availWidth;
    let renderH = availWidth / imgAspect;

    if (renderH > availHeight) {
      renderH = availHeight;
      renderW = availHeight * imgAspect;
    }

    const posX = margin + (availWidth - renderW) / 2;
    const posY = currentY + (availHeight - renderH) / 2;

    if (settings.showBorders) {
      pdf.setDrawColor(203, 213, 225);
      pdf.rect(posX - 2, posY - 2, renderW + 4, renderH + 4);
    }

    pdf.addImage(imgData, 'JPEG', posX, posY, renderW, renderH);

    // Description text if present
    if (hasNotes && settings.descPosition !== 'appendix') {
      const noteY = posY + renderH + 8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(settings.descFontSize * 0.75);
      pdf.setTextColor(30, 41, 59);

      const splitText = pdf.splitTextToSize(page.description || '', availWidth);
      pdf.text(splitText, margin, noteY);
    }

    // Footer
    if (settings.showHeaderFooter) {
      const footY = pageHeight - margin + 2;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Nodes: ${page.nodes.length}  |  Edges: ${page.edges.length}  |  Mode: ${settings.colorMode}`,
        margin,
        footY
      );

      if (settings.showPageNumbers) {
        pdf.text(`Page ${i + 1} of ${pages.length}`, pageWidth - margin, footY, {
          align: 'right',
        });
      }
    }
  }

  pdf.save(`${project.title || 'flowchart'}-print.pdf`);
}
