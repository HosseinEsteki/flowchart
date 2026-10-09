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
  customFontName: '',
  customFontUrl: '',
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
  showNotes: true,
  targetPages: 'all',
  documentTitle: '',
  documentSubtitle: 'دپارتمان فرآیندها و سیستم‌ها',
  organizationName: 'سازمان / شرکت',
  diagramScale: 100,
  diagramAlign: 'center',
  diagramBorder: 'thin',
  diagramBg: 'white',
  footerNote: 'تمامی حقوق این سند محفوظ و طبق استانداردهای مدیریت فرآیند است.',
  preset: 'formal',
  accentColor: '#2563EB',
  includeCoverPage: false,
  coverSummary: '',
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

      const align = node.textAlign || 'center';
      const textAnchor = align === 'right' ? 'end' : align === 'left' ? 'start' : 'middle';
      const textX = align === 'right' ? node.width - 12 : align === 'left' ? 12 : node.width / 2;
      const fontFam = node.fontFamily || 'Vazirmatn, system-ui, sans-serif';
      const fontSty = node.fontStyle || 'normal';

      const textSpans = lines
        .map((line, idx) => {
          return `<tspan x="${textX}" y="${startY + idx * lineHeight}">${line}</tspan>`;
        })
        .join('');

      return `
        <g transform="translate(${node.x}, ${node.y})" class="flowchart-node">
          <${shape.element} ${propsStr} />
          ${auxStr}
          <text fill="${node.textColor}" font-size="${node.fontSize}" font-weight="${node.fontWeight || 'normal'}" font-style="${fontSty}" font-family="${fontFam}" text-anchor="${textAnchor}">
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
export function getFontFamilyCss(
  family: PrintSettings['fontFamily'],
  customName?: string
): string {
  if (customName && customName.trim()) {
    return `'${customName.trim()}', 'Vazirmatn', system-ui, -apple-system, sans-serif`;
  }
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
      return "'Plus Jakarta Sans', 'Vazirmatn', system-ui, -apple-system, sans-serif";
    case 'custom':
      return customName && customName.trim()
        ? `'${customName.trim()}', 'Vazirmatn', sans-serif`
        : "'Vazirmatn', sans-serif";
    default:
      return family
        ? `'${family}', 'Vazirmatn', system-ui, sans-serif`
        : "'Vazirmatn', sans-serif";
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
  const customFontName = settings.customFontName?.trim();
  const fontFamilyCss = getFontFamilyCss(settings.fontFamily, customFontName);
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
            description: '',
            notes: '',
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

  const totalPages = pages.length;
  const docTitle = settings.documentTitle || project.title || 'فلوچارت فرآیند';
  const orgName = settings.organizationName || 'سازمان / دپارتمان سیستم‌ها';
  const accentColor = settings.accentColor || '#2563EB';

  // Custom Font Face injection if custom URL provided
  const customFontFaceCss =
    settings.customFontUrl && settings.customFontUrl.trim()
      ? `
    @font-face {
      font-family: '${customFontName || 'CustomPrintFont'}';
      src: url('${settings.customFontUrl.trim()}');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
  `
      : '';

  // Optional Cover Page HTML
  const coverPageHtml = settings.includeCoverPage
    ? `
      <div class="print-page sheet cover-sheet">
        <div class="cover-top-bar" style="border-top: 6px solid ${accentColor};"></div>
        <div class="cover-content">
          <div class="cover-org-badge" style="color: ${accentColor};">${orgName}</div>
          <h1 class="cover-title">${docTitle}</h1>
          ${settings.documentSubtitle ? `<p class="cover-subtitle">${settings.documentSubtitle}</p>` : ''}
          <div class="cover-meta-grid">
            <div class="meta-item">
              <span class="meta-label">تاریخ تدوین:</span>
              <span class="meta-value">${dateFa}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">تعداد صفحات دیاگرام:</span>
              <span class="meta-value font-mono">${totalPages} صفحه</span>
            </div>
          </div>
          ${
            settings.coverSummary || project.description
              ? `
            <div class="cover-summary-box">
              <div class="summary-label">خلاصه مدیریتی و هدف فرآیند:</div>
              <p class="summary-text">${settings.coverSummary || project.description}</p>
            </div>
          `
              : ''
          }
        </div>
        <div class="cover-footer">
          <div>${settings.footerNote || 'کلیه حقوق این سند فرآیندی محفوظ است.'}</div>
          <div class="font-mono">صفحه جلد / Cover</div>
        </div>
      </div>
    `
    : '';

  const pagesHtml = pages
    .map((page, index) => {
      const pageNum = index + 1;
      const { svg } = generatePageSvgMarkup(page, settings.colorMode);
      const hasDescription = Boolean(page.description && page.description.trim());
      const descText = (page.description || '').trim();
      const hasNotes = Boolean(settings.showNotes !== false && page.notes && page.notes.trim());
      const notesText = (page.notes || '').trim();

      const descBoxHtml = hasDescription
        ? `
          <div class="page-description-box" style="margin-${
            settings.descPosition === 'above' ? 'bottom' : 'top'
          }: ${settings.spacing}px;">
            <div class="desc-header">
              <span class="desc-tag" style="color: ${accentColor};">شرح و یادداشت‌های فرآیند</span>
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

      const notesBoxHtml = hasNotes
        ? `
          <div class="page-notes-box" style="margin-${
            settings.descPosition === 'above' ? 'bottom' : 'top'
          }: ${Math.max(8, settings.spacing * 0.4)}px;">
            <div class="notes-header">
              <span class="notes-tag">💡 نکات و ملاحظات</span>
              <span class="notes-subtitle">${page.name}</span>
            </div>
            <div class="notes-content" style="font-size: ${
              Math.max(11, settings.descFontSize - 1)
            }px; font-weight: ${settings.fontWeight}; text-align: ${
            settings.textAlign
          };">
              ${notesText
                .split('\n')
                .map((line) => {
                  const trimmed = line.trim();
                  if (!trimmed) return '<br/>';
                  const bullet = trimmed.startsWith('•') || trimmed.startsWith('-') ? '' : '• ';
                  return `<p>${bullet}${trimmed}</p>`;
                })
                .join('')}
            </div>
          </div>
        `
        : '';

      const isAppendix = settings.descPosition === 'appendix' && (hasDescription || hasNotes);

      // Diagram border class
      const borderClass =
        settings.diagramBorder === 'none'
          ? 'border-none'
          : settings.diagramBorder === 'double'
          ? 'border-double'
          : settings.diagramBorder === 'dashed'
          ? 'border-dashed'
          : settings.diagramBorder === 'shadow'
          ? 'border-shadow'
          : 'border-thin';

      const bgClass =
        settings.diagramBg === 'subtle'
          ? 'bg-subtle'
          : settings.diagramBg === 'grid'
          ? 'bg-grid'
          : 'bg-white';

      const scaleStyle =
        settings.diagramScale && settings.diagramScale !== 100
          ? `transform: scale(${settings.diagramScale / 100}); transform-origin: center center;`
          : '';

      return `
        <!-- DIAGRAM PAGE ${pageNum} -->
        <div class="print-page sheet">
          ${
            settings.showHeaderFooter
              ? `
            <header class="sheet-header">
              <div class="header-project-title">
                <span class="brand-badge" style="background: ${accentColor};">${orgName}</span>
                <div>
                  <div class="project-title" style="font-size: ${settings.titleFontSize}px;">${docTitle}</div>
                  ${settings.documentSubtitle ? `<div class="project-subtitle">${settings.documentSubtitle}</div>` : ''}
                </div>
              </div>
              <div class="header-meta">
                <span class="page-name-badge">${page.name}</span>
                ${settings.showDate ? `<span class="date-badge">${dateFa}</span>` : ''}
              </div>
            </header>
          `
              : ''
          }

          <div class="sheet-body">
            ${settings.descPosition === 'above' && !isAppendix ? `${descBoxHtml}${notesBoxHtml}` : ''}

            <div class="diagram-wrapper ${settings.showBorders ? borderClass : ''} ${bgClass}">
              <div class="diagram-inner" style="${scaleStyle}">
                ${svg}
              </div>
            </div>

            ${settings.descPosition === 'below' && !isAppendix ? `${descBoxHtml}${notesBoxHtml}` : ''}
          </div>

          ${
            settings.showHeaderFooter
              ? `
            <footer class="sheet-footer">
              <div class="footer-stats">
                <span>${settings.footerNote || 'سند مدیریت فرآیند'}</span>
                <span>•</span>
                <span>تعداد گره‌ها: ${page.nodes.length}</span>
                <span>•</span>
                <span>حالت چاپ: ${
                  settings.colorMode === 'color'
                    ? 'رنگی کامل'
                    : settings.colorMode === 'grayscale'
                    ? 'خاکستری'
                    : 'سیاه و سفید اقتصادی'
                }</span>
              </div>
              ${
                settings.showPageNumbers
                  ? `<div class="footer-page-num font-mono">صفحه ${pageNum} از ${
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
                <span class="brand-badge" style="background: ${accentColor};">${orgName}</span>
                <span class="project-title">${docTitle} - ضمیمه مستندات</span>
              </div>
              <div class="header-meta">
                <span class="page-name-badge">${page.name} (پیوست)</span>
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
                ${notesBoxHtml ? `<div style="margin-top: 14px;">${notesBoxHtml}</div>` : ''}
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
  <title>${docTitle} - FlowCraft Print</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Vazirmatn:wght@400;500;600;700&family=Shabnam:wght@400;700&display=swap" rel="stylesheet">
  <style>
    ${customFontFaceCss}

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
      background-color: #0f172a;
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
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .toolbar-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toolbar-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      font-family: inherit;
      padding: 8px 18px;
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
      padding: 32px 0 64px;
      gap: 36px;
    }

    .sheet {
      background: #ffffff;
      width: 100%;
      max-width: ${settings.orientation === 'landscape' ? '1120px' : '820px'};
      min-height: ${settings.orientation === 'landscape' ? '720px' : '1080px'};
      box-shadow: 0 14px 35px -5px rgba(0, 0, 0, 0.3);
      padding: 28px 36px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-radius: 6px;
      page-break-after: always;
      break-after: page;
      position: relative;
      overflow: hidden;
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
      position: relative;
      z-index: 2;
    }

    .header-project-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-badge {
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }

    .project-title {
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }

    .project-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #64748b;
    }

    .doc-code-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
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
      position: relative;
      z-index: 2;
    }

    .diagram-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      margin: 8px 0;
    }

    .diagram-wrapper.border-thin {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
    }

    .diagram-wrapper.border-double {
      border: 3px double #94a3b8;
      border-radius: 8px;
      padding: 12px;
    }

    .diagram-wrapper.border-dashed {
      border: 1.5px dashed #94a3b8;
      border-radius: 8px;
      padding: 12px;
    }

    .diagram-wrapper.border-shadow {
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 14px rgba(0,0,0,0.06);
      border-radius: 8px;
      padding: 12px;
    }

    .diagram-wrapper.bg-white { background: #ffffff; }
    .diagram-wrapper.bg-subtle { background: #f8fafc; }
    .diagram-wrapper.bg-grid {
      background-color: #ffffff;
      background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
      background-size: 16px 16px;
    }

    .diagram-inner {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .diagram-wrapper svg {
      width: 100%;
      height: auto;
      max-height: ${settings.orientation === 'landscape' ? '460px' : '680px'};
      object-fit: contain;
    }

    .page-description-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-right: 4px solid ${accentColor};
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 8px;
    }

    .desc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px dashed #cbd5e1;
    }

    .desc-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .desc-subtitle {
      font-size: 11px;
      color: #64748b;
    }

    .desc-content p {
      margin-bottom: 4px;
      line-height: 1.6;
      color: #1e293b;
    }

    .page-notes-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-right: 4px solid #d97706;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 8px;
    }

    .notes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px dashed #fde68a;
    }

    .notes-tag {
      font-size: 11px;
      font-weight: 700;
      color: #b45309;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .notes-subtitle {
      font-size: 11px;
      color: #92400e;
    }

    .notes-content p {
      margin-bottom: 3px;
      line-height: 1.55;
      color: #78350f;
    }

    /* Cover Page */
    .cover-sheet {
      justify-content: space-between;
      padding: 48px;
      text-align: center;
    }

    .cover-top-bar {
      margin-bottom: 32px;
    }

    .cover-org-badge {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1px;
      margin-bottom: 16px;
      text-transform: uppercase;
    }

    .cover-title {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      margin-bottom: 8px;
    }

    .cover-subtitle {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 32px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      max-w: 480px;
      margin: 0 auto 32px;
      text-align: right;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
    }

    .meta-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }

    .meta-label { color: #64748b; }
    .meta-value { font-weight: 700; color: #0f172a; }

    .cover-summary-box {
      max-w: 540px;
      margin: 0 auto;
      text-align: right;
      background: #ffffff;
      border-right: 4px solid ${accentColor};
      padding: 12px 18px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .summary-label {
      font-size: 11px;
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 4px;
    }

    .summary-text {
      font-size: 12px;
      color: #334155;
      line-height: 1.7;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      font-size: 11px;
      color: #64748b;
    }

    .sheet-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 14px;
      font-size: 10px;
      color: #64748b;
      position: relative;
      z-index: 2;
    }

    .footer-stats {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .footer-page-num {
      font-weight: 600;
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
      .page-notes-box {
        background: #ffffff !important;
        border-color: #d97706 !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar">
    <div class="toolbar-title">
      <span>🖨️ آماده پرینت: ${docTitle}</span>
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
    ${coverPageHtml}
    ${pagesHtml}
  </div>
</body>
</html>`;
}

// Export high resolution PNG image of a flowchart page
export async function exportHighResPng(
  page: FlowchartPage,
  settings: PrintSettings,
  projectTitle: string
): Promise<void> {
  const { svg, width, height } = generatePageSvgMarkup(page, settings.colorMode);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load SVG for PNG'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  // High DPI 3x resolution
  const scale = 3;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);

  const pngUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = pngUrl;
  a.download = `${projectTitle || 'flowchart'}-${page.name}-300dpi.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
            description: '',
            notes: '',
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
    const docTitle = settings.documentTitle || project.title || 'FlowCraft Diagram';
    if (settings.showHeaderFooter) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text(docTitle, margin, currentY + 5);

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
    const hasDesc = Boolean(page.description && page.description.trim());
    const hasPageNotes = Boolean(settings.showNotes !== false && page.notes && page.notes.trim());
    const notesHeightEstimate = (hasDesc ? 18 : 0) + (hasPageNotes ? 18 : 0);

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
    let textCursorY = posY + renderH + 7;
    if (hasDesc && settings.descPosition !== 'appendix') {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(settings.descFontSize * 0.72);
      pdf.setTextColor(30, 41, 59);

      const splitText = pdf.splitTextToSize(page.description || '', availWidth);
      pdf.text(splitText, margin, textCursorY);
      textCursorY += splitText.length * 4.5 + 4;
    }

    // Key Notes text if present
    if (hasPageNotes && settings.descPosition !== 'appendix') {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(Math.max(7.5, settings.descFontSize * 0.65));
      pdf.setTextColor(180, 83, 9);
      const splitNotes = pdf.splitTextToSize(`Notes: ${page.notes || ''}`, availWidth);
      pdf.text(splitNotes, margin, textCursorY);
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
