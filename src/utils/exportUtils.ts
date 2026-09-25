import { jsPDF } from 'jspdf';
import { FlowchartProject } from '../types/flowchart';
import { getNodeBoundingBox } from './canvasMath';

export async function exportToSvg(svgElement: SVGSVGElement, filename: string): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Clean interactive chrome elements like selection boxes, connection handles, cursors
  const interactiveElements = clone.querySelectorAll('.interactive-overlay, .cursor-indicator, .port-handle');
  interactiveElements.forEach((el) => el.remove());

  // Ensure namespaces
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || 'flowchart'}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportToPng(
  svgElement: SVGSVGElement,
  filename: string,
  scale = 2,
  bg = '#FFFFFF'
): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const interactiveElements = clone.querySelectorAll('.interactive-overlay, .cursor-indicator, .port-handle');
  interactiveElements.forEach((el) => el.remove());

  // Get viewBox or dimensions
  const viewBoxAttr = clone.getAttribute('viewBox');
  let width = 1200;
  let height = 800;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/\s+/).map(Number);
    if (parts.length === 4) {
      width = parts[2];
      height = parts[3];
    }
  }

  clone.setAttribute('width', `${width}`);
  clone.setAttribute('height', `${height}`);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Fill background
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(url);

  const pngUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = pngUrl;
  a.download = `${filename || 'flowchart'}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function exportToPdf(
  svgElement: SVGSVGElement,
  project: FlowchartProject,
  title: string
): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const interactiveElements = clone.querySelectorAll('.interactive-overlay, .cursor-indicator, .port-handle');
  interactiveElements.forEach((el) => el.remove());

  const viewBoxAttr = clone.getAttribute('viewBox');
  let width = 1200;
  let height = 800;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/\s+/).map(Number);
    if (parts.length === 4) {
      width = parts[2];
      height = parts[3];
    }
  }

  clone.setAttribute('width', `${width}`);
  clone.setAttribute('height', `${height}`);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // Landscape or portrait based on aspect ratio
  const isLandscape = width > height;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Header Title banner
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(20, 30, 50);
  pdf.text(title || project.title || 'Flowchart Diagram', 14, 16);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  pdf.text(`Generated by FlowCraft Studio  |  Nodes: ${project.nodes.length}  |  ${dateStr}`, 14, 22);

  // Fit image inside available page area
  const margin = 14;
  const topOffset = 28;
  const availWidth = pageWidth - margin * 2;
  const availHeight = pageHeight - topOffset - margin;

  const imgAspect = width / height;
  let renderWidth = availWidth;
  let renderHeight = availWidth / imgAspect;

  if (renderHeight > availHeight) {
    renderHeight = availHeight;
    renderWidth = availHeight * imgAspect;
  }

  const posX = margin + (availWidth - renderWidth) / 2;
  const posY = topOffset + (availHeight - renderHeight) / 2;

  pdf.addImage(imgData, 'JPEG', posX, posY, renderWidth, renderHeight);

  pdf.save(`${title || 'flowchart'}.pdf`);
}

export function exportToHtml(project: FlowchartProject, title: string): void {
  const bbox = getNodeBoundingBox(project.nodes, 40);
  const nodesJson = JSON.stringify(project.nodes, null, 2);
  const edgesJson = JSON.stringify(project.edges, null, 2);

  const htmlContent = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || project.title || 'Flowchart'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Vazirmatn:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Vazirmatn', 'Plus Jakarta Sans', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card-bg);
      flex-wrap: wrap;
      gap: 1rem;
    }
    h1 { font-size: 1.25rem; font-weight: 700; color: #fff; }
    .meta { font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 0.5rem; align-items: center; }
    .controls { display: flex; gap: 0.5rem; align-items: center; }
    button {
      background: #334155;
      color: #fff;
      border: 1px solid #475569;
      border-radius: 6px;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }
    button:hover { background: #475569; }
    #canvas-container {
      flex: 1;
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      background: radial-gradient(circle, #1e293b 1px, transparent 1px);
      background-size: 24px 24px;
      min-height: 550px;
    }
    svg {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      max-width: 100%;
      height: auto;
      transition: transform 0.2s ease-out;
    }
    .data-table-section {
      padding: 1.5rem;
      background: var(--card-bg);
      border-top: 1px solid var(--border);
    }
    h2 { font-size: 1rem; margin-bottom: 0.75rem; color: var(--text-muted); font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.6rem 0.8rem; text-align: right; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-weight: 600; }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${title || project.title || 'فلوچارت تعاملی FlowCraft'}</h1>
      <div class="meta">
        <span>تعداد گره‌ها: ${project.nodes.length}</span>
        <span>·</span>
        <span>تعداد اتصالات: ${project.edges.length}</span>
        <span>·</span>
        <span>تاریخ خروجی: ${new Date().toLocaleDateString('fa-IR')}</span>
      </div>
    </div>
    <div class="controls">
      <button onclick="zoomIn()">بزرگ‌نمایی (+)</button>
      <button onclick="zoomOut()">کوچک‌نمایی (-)</button>
      <button onclick="resetZoom()">اندازه اصلی</button>
      <button onclick="window.print()">چاپ / ذخیره PDF</button>
    </div>
  </header>

  <div id="canvas-container">
    <svg id="flowchart-svg" viewBox="${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}" width="${bbox.width}" height="${bbox.height}">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748B" />
        </marker>
      </defs>
      <!-- Edges -->
      <g id="edges-layer">
        ${project.edges
          .map((edge) => {
            const source = project.nodes.find((n) => n.id === edge.sourceNodeId);
            const target = project.nodes.find((n) => n.id === edge.targetNodeId);
            if (!source || !target) return '';
            const sx = source.x + source.width / 2;
            const sy = source.y + source.height;
            const tx = target.x + target.width / 2;
            const ty = target.y;
            const midY = (sy + ty) / 2;
            const d = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
            return `<path d="${d}" stroke="${edge.color || '#64748b'}" stroke-width="${edge.strokeWidth || 2}" fill="none" marker-end="url(#arrow)" />`;
          })
          .join('')}
      </g>
      <!-- Nodes -->
      <g id="nodes-layer">
        ${project.nodes
          .map((node) => {
            const rx = node.type === 'terminal' ? 24 : 6;
            return `
              <g transform="translate(${node.x}, ${node.y})">
                <rect width="${node.width}" height="${node.height}" rx="${rx}" fill="${node.fill}" stroke="${node.stroke}" stroke-width="${node.strokeWidth}" />
                <text x="${node.width / 2}" y="${node.height / 2 + 5}" text-anchor="middle" fill="${node.textColor}" font-size="${node.fontSize}" font-weight="${node.fontWeight || 'normal'}" font-family="Vazirmatn, sans-serif">
                  ${node.label}
                </text>
              </g>
            `;
          })
          .join('')}
      </g>
    </svg>
  </div>

  <section class="data-table-section">
    <h2>جدول مراحل فرآیند (Step Inventory)</h2>
    <table>
      <thead>
        <tr>
          <th>شناسه</th>
          <th>نوع نماد</th>
          <th>عنوان مرحله</th>
          <th>موقعیت (X, Y)</th>
          <th>ابعاد</th>
        </tr>
      </thead>
      <tbody>
        ${project.nodes
          .map(
            (n) => `
          <tr>
            <td style="font-family: monospace;">${n.id}</td>
            <td><span class="badge">${n.type}</span></td>
            <td><strong>${n.label}</strong></td>
            <td style="font-family: monospace;">${Math.round(n.x)}, ${Math.round(n.y)}</td>
            <td style="font-family: monospace;">${n.width} × ${n.height}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </section>

  <script>
    let currentScale = 1;
    const svg = document.getElementById('flowchart-svg');

    function zoomIn() {
      currentScale = Math.min(2.5, currentScale + 0.2);
      applyTransform();
    }
    function zoomOut() {
      currentScale = Math.max(0.4, currentScale - 0.2);
      applyTransform();
    }
    function resetZoom() {
      currentScale = 1;
      applyTransform();
    }
    function applyTransform() {
      svg.style.transform = 'scale(' + currentScale + ')';
    }

    // Embed backup data
    window.__FLOWCHART_PROJECT_NODES__ = ${nodesJson};
    window.__FLOWCHART_PROJECT_EDGES__ = ${edgesJson};
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'flowchart'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToJson(project: FlowchartProject): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title || 'flowchart-project'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
