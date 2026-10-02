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
  const pages =
    project.pages && project.pages.length > 0
      ? project.pages
      : [
          {
            id: 'page-1',
            name: 'صفحه اصلی',
            description: project.description,
            nodes: project.nodes,
            edges: project.edges,
          },
        ];

  const pagesJson = JSON.stringify(pages, null, 2);

  const htmlContent = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || project.title || 'فلوچارت تعاملی FlowCraft'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --surface: #334155;
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
    .brand-wrap { display: flex; align-items: center; gap: 0.75rem; }
    .brand-icon {
      background: var(--accent);
      color: #fff;
      font-weight: 800;
      font-size: 0.85rem;
      padding: 0.4rem 0.6rem;
      border-radius: 8px;
    }
    h1 { font-size: 1.25rem; font-weight: 700; color: #fff; }
    .meta { font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 0.5rem; align-items: center; margin-top: 2px; }
    .controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    button {
      background: #334155;
      color: #fff;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 0.45rem 0.9rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    button:hover { background: #475569; }
    .btn-print { background: #2563eb; border-color: #2563eb; }
    .btn-print:hover { background: #1d4ed8; }

    /* Page Tabs */
    .pages-nav {
      background: #111827;
      border-bottom: 1px solid var(--border);
      padding: 0.5rem 1.5rem;
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
    }
    .page-tab-btn {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid transparent;
      padding: 0.4rem 0.9rem;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .page-tab-btn.active {
      background: var(--card-bg);
      color: #fff;
      border-color: var(--accent);
      font-weight: 700;
    }

    /* Main Container */
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      gap: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    /* Page Description Box */
    .page-desc-box {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-right: 4px solid var(--accent);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .desc-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px dashed var(--border);
    }
    .desc-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
    }
    .desc-body {
      font-size: 0.95rem;
      line-height: 1.75;
      color: #e2e8f0;
      white-space: pre-wrap;
    }

    #canvas-container {
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      background: radial-gradient(circle, #1e293b 1px, transparent 1px);
      background-size: 24px 24px;
      min-height: 520px;
      border-radius: 16px;
      border: 1px solid var(--border);
    }
    svg {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
      max-width: 100%;
      height: auto;
      transition: transform 0.2s ease-out;
    }

    .data-table-section {
      padding: 1.5rem;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
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

    @media print {
      body { background: #fff !important; color: #000 !important; }
      header, .pages-nav, .controls, .btn-print { display: none !important; }
      main { padding: 0 !important; max-width: 100% !important; }
      .page-desc-box { background: #f8fafc !important; color: #000 !important; border-color: #cbd5e1 !important; border-right-color: #2563eb !important; }
      .desc-body { color: #000 !important; }
      #canvas-container { background: #fff !important; border: none !important; padding: 0 !important; }
      svg { box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand-wrap">
      <div class="brand-icon">FC</div>
      <div>
        <h1>${title || project.title || 'فلوچارت تعاملی FlowCraft'}</h1>
        <div class="meta">
          <span id="header-stats">مجموع صفحات: ${pages.length}</span>
          <span>•</span>
          <span>تاریخ خروجی: ${new Date().toLocaleDateString('fa-IR')}</span>
        </div>
      </div>
    </div>
    <div class="controls">
      <button onclick="zoomIn()">بزرگ‌نمایی (+)</button>
      <button onclick="zoomOut()">کوچک‌نمایی (-)</button>
      <button onclick="resetZoom()">اندازه اصلی</button>
      <button class="btn-print" onclick="window.print()">🖨️ چاپ این صفحه (Print)</button>
    </div>
  </header>

  ${
    pages.length > 1
      ? `
    <nav class="pages-nav">
      ${pages
        .map(
          (p, i) => `
        <button class="page-tab-btn ${i === 0 ? 'active' : ''}" onclick="selectPage(${i})">
          ${p.name} (${p.nodes.length})
        </button>
      `
        )
        .join('')}
    </nav>
  `
      : ''
  }

  <main>
    <div id="page-description-container"></div>
    <div id="canvas-container">
      <div id="svg-host"></div>
    </div>

    <section class="data-table-section">
      <h2 id="table-heading">مراحل فرآیند (Step Inventory)</h2>
      <table>
        <thead>
          <tr>
            <th>شناسه</th>
            <th>نوع نماد</th>
            <th>عنوان مرحله</th>
            <th>موقعیت</th>
            <th>ابعاد</th>
          </tr>
        </thead>
        <tbody id="table-body"></tbody>
      </table>
    </section>
  </main>

  <script>
    const pages = ${pagesJson};
    let activePageIndex = 0;
    let currentScale = 1;

    function renderActivePage() {
      const page = pages[activePageIndex];
      if (!page) return;

      // Update tabs
      const tabs = document.querySelectorAll('.page-tab-btn');
      tabs.forEach((tab, idx) => {
        if (idx === activePageIndex) tab.classList.add('active');
        else tab.classList.remove('active');
      });

      // Update description box
      const descContainer = document.getElementById('page-description-container');
      if (page.description && page.description.trim()) {
        descContainer.innerHTML = \`
          <div class="page-desc-box">
            <div class="desc-title-row">
              <span class="desc-badge">توضیحات و مستندات فلوچارت</span>
              <span style="font-size: 0.8rem; color: var(--text-muted);">\${page.name}</span>
            </div>
            <div class="desc-body">\${page.description}</div>
          </div>
        \`;
        descContainer.style.display = 'block';
      } else {
        descContainer.innerHTML = '';
        descContainer.style.display = 'none';
      }

      // Calculate BBox
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      if (page.nodes.length === 0) {
        minX = 0; minY = 0; maxX = 600; maxY = 400;
      } else {
        page.nodes.forEach(n => {
          minX = Math.min(minX, n.x);
          minY = Math.min(minY, n.y);
          maxX = Math.max(maxX, n.x + n.width);
          maxY = Math.max(maxY, n.y + n.height);
        });
        const pad = 40;
        minX -= pad; minY -= pad; maxX += pad; maxY += pad;
      }
      const w = Math.max(500, maxX - minX);
      const h = Math.max(350, maxY - minY);

      // Render SVG
      const edgesSvg = page.edges.map(e => {
        const s = page.nodes.find(n => n.id === e.sourceNodeId);
        const t = page.nodes.find(n => n.id === e.targetNodeId);
        if (!s || !t) return '';
        const sx = s.x + s.width / 2;
        const sy = s.y + s.height;
        const tx = t.x + t.width / 2;
        const ty = t.y;
        const midY = (sy + ty) / 2;
        const d = \`M \${sx} \${sy} L \${sx} \${midY} L \${tx} \${midY} L \${tx} \${ty}\`;
        return \`<path d="\${d}" stroke="\${e.color || '#64748b'}" stroke-width="\${e.strokeWidth || 2}" fill="none" marker-end="url(#arrow)" />\`;
      }).join('');

      const nodesSvg = page.nodes.map(n => {
        const rx = n.type === 'terminal' ? 24 : 6;
        return \`
          <g transform="translate(\${n.x}, \${n.y})">
            <rect width="\${n.width}" height="\${n.height}" rx="\${rx}" fill="\${n.fill}" stroke="\${n.stroke}" stroke-width="\${n.strokeWidth}" />
            <text x="\${n.width / 2}" y="\${n.height / 2 + 5}" text-anchor="middle" fill="\${n.textColor}" font-size="\${n.fontSize}" font-weight="\${n.fontWeight || 'normal'}" font-family="Vazirmatn, sans-serif">
              \${n.label}
            </text>
          </g>
        \`;
      }).join('');

      const svgHtml = \`
        <svg id="flowchart-svg" viewBox="\${minX} \${minY} \${w} \${h}" width="\${w}" height="\${h}">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748B" />
            </marker>
          </defs>
          <g>\${edgesSvg}</g>
          <g>\${nodesSvg}</g>
        </svg>
      \`;

      document.getElementById('svg-host').innerHTML = svgHtml;
      currentScale = 1;
      applyTransform();

      // Table inventory
      document.getElementById('table-heading').innerText = 'مراحل فرآیند: ' + page.name;
      const tbody = document.getElementById('table-body');
      tbody.innerHTML = page.nodes.map(n => \`
        <tr>
          <td style="font-family: monospace;">\${n.id}</td>
          <td><span class="badge">\${n.type}</span></td>
          <td><strong>\${n.label}</strong></td>
          <td style="font-family: monospace;">\${Math.round(n.x)}, \${Math.round(n.y)}</td>
          <td style="font-family: monospace;">\${n.width} × \${n.height}</td>
        </tr>
      \`).join('');
    }

    function selectPage(index) {
      activePageIndex = index;
      renderActivePage();
    }

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
      const el = document.getElementById('flowchart-svg');
      if (el) el.style.transform = 'scale(' + currentScale + ')';
    }

    // Initial render
    renderActivePage();
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
